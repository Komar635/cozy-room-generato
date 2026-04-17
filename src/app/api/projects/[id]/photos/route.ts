import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

// Константы валидации
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_PHOTOS = 10;

// Схема валидации для загрузки фотографий
const uploadPhotoSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().max(MAX_FILE_SIZE, `Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024} МБ`),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']).refine(
    (val) => ALLOWED_FORMATS.includes(val),
    { message: 'Поддерживаются только форматы: JPEG, PNG, WebP' }
  ),
  base64Data: z.string().min(1),
});

// POST /api/projects/[id]/photos - загрузка фотографий
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Нет доступа к этому проекту' },
        { status: 403 }
      );
    }

    // Парсинг тела запроса
    const body = await request.json();
    const { photos } = body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо загрузить хотя бы одну фотографию' },
        { status: 400 }
      );
    }

    // Валидация каждой фотографии
    const validationErrors: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const result = uploadPhotoSchema.safeParse(photos[i]);
      if (!result.success) {
        validationErrors.push(`Фото ${i + 1}: ${result.error.issues[0].message}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ошибки валидации фотографий',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Загрузка фотографий в Supabase Storage
    const uploadedPhotos = [];
    const uploadErrors = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = photo.mimeType.split('/')[1];
      const storagePath = `projects/${projectId}/photos/${timestamp}-${randomId}.${extension}`;

      try {
        // Конвертация base64 в Buffer
        const base64Data = photo.base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Загрузка в Storage
        const { data: storageData, error: storageError } = await supabaseAdmin
          .storage
          .from('photos')
          .upload(storagePath, buffer, {
            contentType: photo.mimeType,
            upsert: false,
          });

        if (storageError) {
          uploadErrors.push(`Фото ${i + 1}: ${storageError.message}`);
          continue;
        }

        // Получение публичного URL
        const { data: urlData } = supabaseAdmin
          .storage
          .from('photos')
          .getPublicUrl(storagePath);

        // Сохранение метаданных в БД
        const { data: photoRecord, error: dbError } = await supabaseAdmin
          .from('photos')
          .insert({
            project_id: projectId,
            storage_path: storagePath,
            url: urlData.publicUrl,
            size_bytes: photo.fileSize,
          })
          .select()
          .single();

        if (dbError) {
          // Удаляем файл из storage если не удалось сохранить в БД
          await supabaseAdmin.storage.from('photos').remove([storagePath]);
          uploadErrors.push(`Фото ${i + 1}: Ошибка сохранения метаданных`);
          continue;
        }

        uploadedPhotos.push(photoRecord);
      } catch (error) {
        console.error(`Ошибка загрузки фото ${i + 1}:`, error);
        uploadErrors.push(`Фото ${i + 1}: Внутренняя ошибка`);
      }
    }

    // Обновление статуса проекта
    if (uploadedPhotos.length > 0) {
      await supabaseAdmin
        .from('projects')
        .update({ status: 'uploading' })
        .eq('id', projectId);
    }

    // Формирование ответа
    if (uploadErrors.length > 0 && uploadedPhotos.length === 0) {
      return NextResponse.json(
        { 
          error: 'Не удалось загрузить фотографии',
          details: uploadErrors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos.length,
      failed: uploadErrors.length,
      photos: uploadedPhotos,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка в POST /api/projects/[id]/photos:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/photos - список фотографий
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Нет доступа к этому проекту' },
        { status: 403 }
      );
    }

    // Получение списка фотографий
    const { data: photos, error } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: true });

    if (error) {
      console.error('Ошибка получения фотографий:', error);
      return NextResponse.json(
        { error: 'Не удалось получить фотографии' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      photos: photos || [],
      count: photos?.length || 0,
    }, { status: 200 });

  } catch (error) {
    console.error('Ошибка в GET /api/projects/[id]/photos:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
