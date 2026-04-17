import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const modelId = params.id;
    const body = await request.json();
    const { modification_type, parameters } = body;

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
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || model.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const modification = await prisma.modification.create({
      data: {
        originalModelId: modelId,
        modificationType: modification_type,
        parameters,
        status: 'completed'
      }
    });

    return NextResponse.json({
      modificationId: modification.id,
      originalModelId: modelId,
      status: 'completed',
      message: 'Modification applied successfully'
    });
  } catch (error) {
    console.error('Error applying modification:', error);
    return NextResponse.json(
      { error: 'Failed to apply modification' },
      { status: 500 }
    );
  }
}