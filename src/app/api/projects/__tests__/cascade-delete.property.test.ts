import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Project } from '@/types/database';

const hasSupabaseAdmin = Boolean(supabaseAdmin);

/**
 * Property-based тест для каскадного удаления
 * 
 * Feature: reality-digitizer-3d
 * Property 10: Каскадное удаление данных проекта
 * 
 * Validates: Требования 8.4, 8.5
 */

// Вспомогательные функции
async function createTestUser(email: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  return data.user.id;
}

async function deleteTestUser(userId: string): Promise<void> {
  if (!supabaseAdmin) {
    return;
  }

  await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function createProject(userId: string, name: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: userId,
      name,
      status: 'created',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

async function createPhoto(projectId: string, storagePath: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({
      project_id: projectId,
      storage_path: storagePath,
      url: `https://example.com/${storagePath}`,
      size_bytes: 1024,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create photo: ${error.message}`);
  }

  return data;
}

async function createModel3D(projectId: string, modelType: 'gaussian-splatting' | 'nerf') {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('models_3d')
    .insert({
      project_id: projectId,
      model_type: modelType,
      storage_path: `models/${projectId}/${modelType}`,
      url: `https://example.com/models/${projectId}/${modelType}`,
      is_original: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create 3D model: ${error.message}`);
  }

  return data;
}

async function createStyleAnalysis(modelId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('style_analyses')
    .insert({
      model_id: modelId,
      style_description: 'Test style',
      dominant_colors: ['#FF0000', '#00FF00'],
      materials: ['wood', 'metal'],
      style_tags: ['modern', 'minimalist'],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create style analysis: ${error.message}`);
  }

  return data;
}

async function createModificationSuggestion(modelId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('modification_suggestions')
    .insert({
      model_id: modelId,
      modification_type: 'recolor',
      description: 'Test suggestion',
      parameters: { color: '#FF0000' },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create modification suggestion: ${error.message}`);
  }

  return data;
}

async function createModification(originalModelId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('modifications')
    .insert({
      original_model_id: originalModelId,
      modification_type: 'recolor',
      parameters: { color: '#0000FF' },
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create modification: ${error.message}`);
  }

  return data;
}

async function createProcessingJob(projectId: string, jobType: 'scan' | 'modify') {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const jobId = `job-${Date.now()}-${Math.random()}`;
  const { data, error } = await supabaseAdmin
    .from('processing_jobs')
    .insert({
      id: jobId,
      job_type: jobType,
      project_id: projectId,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create processing job: ${error.message}`);
  }

  return data;
}

async function deleteProject(projectId: string) {
  if (!supabaseAdmin) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

async function checkPhotosExist(projectId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('photos')
    .select('id')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to check photos: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

async function checkModelsExist(projectId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('models_3d')
    .select('id')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to check models: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

async function checkStyleAnalysesExist(modelId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('style_analyses')
    .select('id')
    .eq('model_id', modelId);

  if (error) {
    throw new Error(`Failed to check style analyses: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

async function checkModificationSuggestionsExist(modelId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('modification_suggestions')
    .select('id')
    .eq('model_id', modelId);

  if (error) {
    throw new Error(`Failed to check modification suggestions: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

async function checkModificationsExist(modelId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('modifications')
    .select('id')
    .eq('original_model_id', modelId);

  if (error) {
    throw new Error(`Failed to check modifications: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

async function checkProcessingJobsExist(projectId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('processing_jobs')
    .select('id')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to check processing jobs: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

describe('Feature: reality-digitizer-3d, Property 10: Каскадное удаление данных проекта', () => {
  /**
   * Validates: Требования 8.4, 8.5
   * 
   * Для любого удаляемого проекта, все связанные данные (3D-модели, фотографии,
   * анализы, модификации) должны быть полностью удалены из системы.
   */
  it('should cascade delete all related data when project is deleted', async () => {
    if (!hasSupabaseAdmin) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          projectName: fc.string({ minLength: 1, maxLength: 255 }),
          photoCount: fc.integer({ min: 1, max: 5 }),
          modelType: fc.constantFrom('gaussian-splatting' as const, 'nerf' as const),
        }),
        async ({ email, projectName, photoCount, modelType }) => {
          let userId: string | null = null;
          let projectId: string | null = null;
          let modelId: string | null = null;

          try {
            // Arrange: создаём пользователя и проект с полным набором связанных данных
            userId = await createTestUser(email);
            const project = await createProject(userId!, projectName);
            projectId = project.id;

            // Создаём фотографии
            const photoIds: string[] = [];
            for (let i = 0; i < photoCount; i++) {
              const photo = await createPhoto(projectId!, `photos/${projectId}/photo-${i}.jpg`);
              photoIds.push(photo.id);
            }

            // Создаём 3D-модель
            const model = await createModel3D(projectId!, modelType);
            modelId = model.id;

            // Создаём анализ стиля
            await createStyleAnalysis(modelId!);

            // Создаём предложения по модификации
            await createModificationSuggestion(modelId!);

            // Создаём модификацию
            await createModification(modelId!);

            // Создаём задачу обработки
            await createProcessingJob(projectId!, 'scan');

            // Проверяем, что все данные существуют до удаления
            expect(await checkPhotosExist(projectId!)).toBe(true);
            expect(await checkModelsExist(projectId!)).toBe(true);
            expect(await checkStyleAnalysesExist(modelId!)).toBe(true);
            expect(await checkModificationSuggestionsExist(modelId!)).toBe(true);
            expect(await checkModificationsExist(modelId!)).toBe(true);
            expect(await checkProcessingJobsExist(projectId!)).toBe(true);

            // Act: удаляем проект
            await deleteProject(projectId!);

            // Assert: проверяем, что все связанные данные удалены
            expect(await checkPhotosExist(projectId!)).toBe(false);
            expect(await checkModelsExist(projectId!)).toBe(false);
            expect(await checkStyleAnalysesExist(modelId!)).toBe(false);
            expect(await checkModificationSuggestionsExist(modelId!)).toBe(false);
            expect(await checkModificationsExist(modelId!)).toBe(false);
            expect(await checkProcessingJobsExist(projectId!)).toBe(false);

            // Проверяем, что сам проект удалён
            const { data: deletedProject } = await supabaseAdmin!
              .from('projects')
              .select('id')
              .eq('id', projectId)
              .single();

            expect(deletedProject).toBeNull();
          } finally {
            // Cleanup: удаляем пользователя (если проект не был удалён)
            if (projectId) {
              await deleteProject(projectId).catch(() => {});
            }
            if (userId) {
              await deleteTestUser(userId).catch(() => {});
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
