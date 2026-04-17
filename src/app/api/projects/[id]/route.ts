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

    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 404 }
        );
      }
      console.error('Ошибка получения проекта:', error);
      return NextResponse.json(
        { error: 'Не удалось получить проект' },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Ошибка в GET /api/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { data: project, error: fetchError } = await client
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await client
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Ошибка удаления проекта:', deleteError);
      return NextResponse.json(
        { error: 'Не удалось удалить проект' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Проект успешно удалён' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка в DELETE /api/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
