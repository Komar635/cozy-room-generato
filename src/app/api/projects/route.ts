import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно').max(255),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: session.user.id,
        name,
        description: description || null,
        status: 'created',
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания проекта:', error);
      return NextResponse.json(
        { error: 'Не удалось создать проект' },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Ошибка в POST /api/projects:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения проектов:', error);
      return NextResponse.json(
        { error: 'Не удалось получить проекты' },
        { status: 500 }
      );
    }

    return NextResponse.json(projects || [], { status: 200 });
  } catch (error) {
    console.error('Ошибка в GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
