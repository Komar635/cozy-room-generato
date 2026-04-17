import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    const { data: project, error: projectError } = await client
      .from('projects')
      .select('id, user_id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data: photos, error: photosError } = await client
      .from('photos')
      .select('id')
      .eq('project_id', projectId);

    if (photosError || !photos || photos.length < 10) {
      return NextResponse.json(
        { 
          error: 'Insufficient photos',
          message: 'Необходимо минимум 10 фотографий для сканирования'
        },
        { status: 400 }
      );
    }

    const jobId = `scan_${projectId}_${Date.now()}`;
    const { data: job, error: jobError } = await client
      .from('processing_jobs')
      .insert({
        id: jobId,
        job_type: 'scan',
        project_id: projectId,
        status: 'pending',
        progress: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create processing job' },
        { status: 500 }
      );
    }

    await client
      .from('projects')
      .update({ status: 'scanning' })
      .eq('id', projectId);

    simulateScanning(client, jobId, projectId);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: 'Сканирование запущено'
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function simulateScanning(client: NonNullable<typeof supabaseAdmin>, jobId: string, projectId: string) {
  const intervals = [10, 25, 40, 55, 70, 85, 95, 100];
  
  for (const progress of intervals) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await client
      .from('processing_jobs')
      .update({ 
        status: progress === 100 ? 'completed' : 'processing',
        progress 
      })
      .eq('id', jobId);
    
    if (progress === 100) {
      await client
        .from('models_3d')
        .insert({
          project_id: projectId,
          model_type: 'gaussian-splatting',
          storage_path: `models/${projectId}/model.ply`,
          url: `https://example.com/models/${projectId}/model.ply`,
          is_original: true,
          processing_job_id: jobId
        });
      
      await client
        .from('projects')
        .update({ 
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      await client
        .from('processing_jobs')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', jobId);
    }
  }
}
