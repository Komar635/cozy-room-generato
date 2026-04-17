import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

/**
 * GET /api/models/[id]/suggestions
 * Get modification suggestions for a 3D model
 */
export async function GET(
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

    // Verify model exists and user has access
    const model = await prisma.model3D.findUnique({
      where: { id: modelId },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || model.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get suggestions from database
    const suggestions = await prisma.modificationSuggestion.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });

    // If no suggestions exist, we could trigger generation here
    // For now, just return what we have
    if (suggestions.length === 0) {
      return NextResponse.json(
        { 
          error: 'No suggestions found',
          message: 'Run style analysis first to generate suggestions'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
