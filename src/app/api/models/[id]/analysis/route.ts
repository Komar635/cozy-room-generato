import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const modelId = params.id;

    // Verify model exists and user has access
    const model = await prisma.model3D.findUnique({
      where: { id: modelId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Модель не найдена' },
        { status: 404 }
      );
    }

    if (model.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Нет доступа к этой модели' },
        { status: 403 }
      );
    }

    // Get analysis
    const analysis = await prisma.styleAnalysis.findFirst({
      where: { modelId },
      orderBy: { analyzedAt: 'desc' }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Анализ не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении анализа:', error);
    return NextResponse.json(
      { error: 'Не удалось получить анализ стиля' },
      { status: 500 }
    );
  }
}
