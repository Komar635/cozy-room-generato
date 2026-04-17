import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { getStyleAnalysisService } from '@/lib/ai/style-analysis';

/**
 * POST /api/models/[id]/analyze
 * Trigger style analysis for a 3D model using Google Gemini
 */
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

    // Verify model exists and user has access
    const model = await prisma.model3D.findUnique({
      where: { id: modelId },
      include: {
        project: {
          select: {
            userId: true,
            photos: {
              select: {
                url: true,
              },
              take: 1, // Use first photo for analysis
            },
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

    // Check if analysis already exists
    const existingAnalysis = await prisma.styleAnalysis.findFirst({
      where: { modelId },
    });

    if (existingAnalysis) {
      return NextResponse.json(
        {
          message: 'Analysis already exists',
          analysis: existingAnalysis,
        },
        { status: 200 }
      );
    }

    // Use model URL or first photo for analysis
    const imageUrl = model.project.photos.length > 0 ? model.project.photos[0].url : null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image available for analysis' },
        { status: 400 }
      );
    }

    // Perform style analysis using Google Gemini
    const styleService = getStyleAnalysisService();
    const analysisResult = await styleService.analyzeStyle(imageUrl);

    // Save analysis to database
    const styleAnalysis = await prisma.styleAnalysis.create({
      data: {
        modelId,
        styleDescription: analysisResult.styleDescription,
        dominantColors: analysisResult.dominantColors,
        materials: analysisResult.materials,
        styleTags: analysisResult.styleTags,
      },
    });

    return NextResponse.json({
      message: 'Style analysis completed',
      analysis: styleAnalysis,
    });
  } catch (error) {
    console.error('Error analyzing style:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze style',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models/[id]/analysis
 * Get style analysis results for a 3D model
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

    // Get latest analysis
    const analysis = await prisma.styleAnalysis.findFirst({
      where: { modelId },
      orderBy: { analyzedAt: 'desc' },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
