import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = supabaseAdmin;
    if (!client) {
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

    const { data: project, error: projectError } = await client
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

    const { data: models, error: modelsError } = await client
      .from('models_3d')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (modelsError) {
      console.error('Ошибка получения моделей проекта:', modelsError);
      return NextResponse.json(
        { error: 'Не удалось получить модели проекта' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        models: models || [],
        latestModel: models?.[0] ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка в GET /api/projects/[id]/models:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
