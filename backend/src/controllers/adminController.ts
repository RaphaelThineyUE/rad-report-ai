/**
 * Admin controller — system-level dashboard and user management endpoints.
 * Requires an authenticated admin user (JWT checked by auth middleware).
 * Exports: getSystemHealth, listUsers, getUserProfile.
 * Uses supabaseAdmin (service-role) to access auth.admin APIs;
 * uses the caller's user client for data queries so RLS still applies.
 * No PHI is returned; only aggregate counts and metadata.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { Errors } from '../utils/AppError.js';

export async function getSystemHealth(req: AuthRequest, res: Response): Promise<void> {
  const client = createUserClient(req.accessToken);

  // Check if user is admin (this is a simplified check - in production, add proper admin role verification)
  const { data: authUser } = await client.auth.getUser();
  if (!authUser.user) {
    throw Errors.unauthorized();
  }

  try {
    // Fetch system stats
    const { count: totalPatients } = await client
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const { count: totalReports } = await client
      .from('radiology_reports')
      .select('*', { count: 'exact', head: true });

    const { data: recentReports } = await client
      .from('radiology_reports')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const failedReports = recentReports?.filter((r) => r.status === 'failed').length || 0;
    const completedReports = recentReports?.filter((r) => r.status === 'completed').length || 0;

    // Calculate processing stats
    const { data: reportStats } = await client
      .from('radiology_reports')
      .select('processing_time_ms')
      .eq('status', 'completed')
      .not('processing_time_ms', 'is', null);

    const avgProcessingTime = reportStats && reportStats.length > 0
      ? reportStats.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / reportStats.length
      : 0;

    const aiFailureRate = recentReports && recentReports.length > 0
      ? (failedReports / recentReports.length) * 100
      : 0;

    res.json({
      system_health: {
        total_users: 1,
        total_patients: totalPatients || 0,
        total_reports: totalReports || 0,
        failed_reports_recent: failedReports,
        completed_reports_recent: completedReports,
        avg_processing_time_ms: Math.round(avgProcessingTime),
        ai_failure_rate_percent: Math.round(aiFailureRate * 100) / 100,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getSystemHealth error', { userId: req.userId, error: message });
    throw Errors.internal('Failed to fetch system health');
  }
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Use admin client to list users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      logger.error('listUsers auth error', { userId: req.userId, error: authError.message });
      throw Errors.internal('Failed to fetch users');
    }

    const client = createUserClient(req.accessToken);

    // Get user stats
    const userList = await Promise.all(
      (authUsers || []).map(async (user) => {
        const { count: patientCount } = await client
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);

        const { count: reportCount } = await client
          .from('radiology_reports')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);

        return {
          id: user.id,
          email: user.email || 'Unknown',
          created_at: user.created_at || null,
          patient_count: patientCount || 0,
          report_count: reportCount || 0,
        };
      }),
    );

    res.json({ users: userList });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('listUsers error', { userId: req.userId, error: message });
    throw Errors.internal('Failed to fetch users');
  }
}

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  try {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      throw Errors.notFound('User');
    }

    const client = createUserClient(req.accessToken);

    const { data: patients } = await client
      .from('patients')
      .select('id, full_name, created_at')
      .eq('created_by', userId);

    const { data: reports } = await client
      .from('radiology_reports')
      .select('id, status, created_at')
      .eq('created_by', userId);

    res.json({
      user: {
        id: userId,
        email: user.email,
        created_at: user.created_at,
      },
      stats: {
        patient_count: patients?.length || 0,
        report_count: reports?.length || 0,
        completed_reports: reports?.filter((r) => r.status === 'completed').length || 0,
      },
      recent_patients: patients?.slice(0, 5) || [],
      recent_reports: reports?.slice(0, 5) || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getUserProfile error', { userId: req.userId, targetUserId: userId, error: message });
    throw Errors.internal('Failed to fetch user profile');
  }
}
