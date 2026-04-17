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
        { error: 'Unauthorized' },
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

    const { data: job, error: jobError } = await client
      .from('processing_jobs')
      .select('*')
      .eq('project_id', projectId)
      .eq('job_type', 'scan')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { 
          error: 'No scanning job found',
          message: 'Сканирование еще не запущено'
        },
        { status: 404 }
      );
    }

    let elapsedTime = null;
    if (job.started_at) {
      const startTime = new Date(job.started_at).getTime();
      const endTime = job.completed_at 
        ? new Date(job.completed_at).getTime()
        : Date.now();
      elapsedTime = Math.floor((endTime - startTime) / 1000);
    }

    let estimatedTimeRemaining = null;
    if (job.status === 'processing' && job.progress > 0) {
      const totalEstimatedTime = 600;
      const progressRatio = job.progress / 100;
      estimatedTimeRemaining = Math.floor(totalEstimatedTime * (1 - progressRatio));
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      createdAt: job.created_at,
      elapsedTime,
      estimatedTimeRemaining
    });
  } catch (error) {
    console.error('Error getting scan status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
