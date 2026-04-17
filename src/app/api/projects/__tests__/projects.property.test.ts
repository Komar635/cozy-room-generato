import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import fc from 'fast-check';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Project } from '@/types/database';

const hasSupabaseAdmin = Boolean(supabaseAdmin);

/**
 * Property-based тесты для управления проектами
 * 
 * Feature: reality-digitizer-3d
 * Property 9: Сохранение проекта с полными данными
 * Property 11: Список проектов пользователя
 * 
 * Validates: Требования 8.1, 8.2, 8.3
 */

// Вспомогательные функции для тестов
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

async function createProject(userId: string, name: string, description?: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: userId,
      name,
      description: description || null,
      status: 'created',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

async function getProjectById(projectId: string) {
  if (!supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

async function getUserProjects(userId: string) {
  if (!supabaseAdmin) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user projects: ${error.message}`);
  }

  return data || [];
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

describe('Feature: reality-digitizer-3d, Property 9: Сохранение проекта с полными данными', () => {
  /**
   * Validates: Требования 8.1, 8.3
   * 
   * Для любого создаваемого проекта, после сохранения все связанные данные
   * (метаданные проекта) должны быть доступны при последующей загрузке.
   */
  it('should save and retrieve project with complete data', async () => {
    if (!hasSupabaseAdmin) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 255 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined }),
        }),
        async ({ email, name, description }) => {
          let userId: string | null = null;
          let projectId: string | null = null;

          try {
            // Arrange: создаём тестового пользователя
            userId = await createTestUser(email);

            // Act: создаём проект
            const createdProject = await createProject(userId!, name, description);
            projectId = createdProject.id;

            // Assert: проверяем, что проект сохранён с полными данными
            const retrievedProject = await getProjectById(projectId!);

            expect(retrievedProject).not.toBeNull();
            expect(retrievedProject!.id).toBe(createdProject.id);
            expect(retrievedProject!.user_id).toBe(userId);
            expect(retrievedProject!.name).toBe(name);
            expect(retrievedProject!.description).toBe(description || null);
            expect(retrievedProject!.status).toBe('created');
            expect(retrievedProject!.created_at).toBeDefined();
            expect(retrievedProject!.updated_at).toBeDefined();
          } finally {
            // Cleanup
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

describe('Feature: reality-digitizer-3d, Property 11: Список проектов пользователя', () => {
  /**
   * Validates: Требования 8.2
   * 
   * Для любого пользователя, запрос списка проектов должен возвращать
   * все и только те проекты, которые принадлежат этому пользователю.
   */
  it('should return all and only projects belonging to the user', async () => {
    if (!hasSupabaseAdmin) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user1Email: fc.emailAddress(),
          user2Email: fc.emailAddress(),
          user1Projects: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 255 }),
              description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          user2Projects: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 255 }),
              description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async ({ user1Email, user2Email, user1Projects, user2Projects }) => {
          // Пропускаем, если email одинаковые
          fc.pre(user1Email !== user2Email);

          let user1Id: string | null = null;
          let user2Id: string | null = null;
          const createdProjectIds: string[] = [];

          try {
            // Arrange: создаём двух пользователей
            user1Id = await createTestUser(user1Email);
            user2Id = await createTestUser(user2Email);

            // Создаём проекты для первого пользователя
            const user1CreatedProjects: Project[] = [];
            for (const projectData of user1Projects) {
              const project = await createProject(user1Id, projectData.name, projectData.description);
              createdProjectIds.push(project.id);
              user1CreatedProjects.push(project);
            }

            // Создаём проекты для второго пользователя
            for (const projectData of user2Projects) {
              const project = await createProject(user2Id, projectData.name, projectData.description);
              createdProjectIds.push(project.id);
            }

            // Act: получаем проекты первого пользователя
            const retrievedUser1Projects = await getUserProjects(user1Id);

            // Assert: проверяем, что возвращены все и только проекты первого пользователя
            expect(retrievedUser1Projects.length).toBe(user1Projects.length);

            // Все проекты принадлежат первому пользователю
            for (const project of retrievedUser1Projects) {
              expect(project.user_id).toBe(user1Id);
            }

            // Все созданные проекты первого пользователя присутствуют в списке
            const retrievedIds = new Set(retrievedUser1Projects.map((p: Project) => p.id));
            for (const createdProject of user1CreatedProjects) {
              expect(retrievedIds.has(createdProject.id)).toBe(true);
            }

            // Проекты второго пользователя не присутствуют в списке
            const user2ProjectIds = createdProjectIds.filter(
              id => !user1CreatedProjects.some((p: Project) => p.id === id)
            );
            for (const user2ProjectId of user2ProjectIds) {
              expect(retrievedIds.has(user2ProjectId)).toBe(false);
            }
          } finally {
            // Cleanup
            for (const projectId of createdProjectIds) {
              await deleteProject(projectId).catch(() => {});
            }
            if (user1Id) {
              await deleteTestUser(user1Id).catch(() => {});
            }
            if (user2Id) {
              await deleteTestUser(user2Id).catch(() => {});
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
