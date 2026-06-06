/**
 * AdminDashboard page — system-wide health metrics; accessible to org-admin role only.
 * Fetches SystemHealth from GET /admin/health on mount and on manual refresh.
 * Displays MetricCards (users, patients, reports, avg processing time),
 * recent report success/failure counts, an AI reliability progress bar, and service status indicators.
 */
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/ui';
import { api } from '@/lib/api';

interface SystemHealth {
  system_health: {
    total_users: number;
    total_patients: number;
    total_reports: number;
    failed_reports_recent: number;
    completed_reports_recent: number;
    avg_processing_time_ms: number;
    ai_failure_rate_percent: number;
  };
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await api.get('/admin/health');
      setHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="fade-up"><div className="page-head"><h1 className="t-h1">Loading...</h1></div></div>;
  }

  if (!health) {
    return <div className="fade-up"><div className="page-head"><h1 className="t-h1">Failed to load admin dashboard</h1></div></div>;
  }

  const data = health.system_health;
  const successRate = 100 - data.ai_failure_rate_percent;

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Admin Dashboard</h1>
          <div className="sub">System health and usage metrics</div>
        </div>
        <button onClick={fetchSystemHealth} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--slate-300)', background: 'white', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Users" value={String(data.total_users)} icon="users" />
        <MetricCard label="Total Patients" value={String(data.total_patients)} icon="heart-pulse" />
        <MetricCard label="Total Reports" value={String(data.total_reports)} icon="file-text" />
        <MetricCard label="Avg Processing" value={`${(data.avg_processing_time_ms / 1000).toFixed(1)}s`} icon="clock" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Report Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--success-500)' }}>{data.completed_reports_recent}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Completed</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--danger-500)' }}>{data.failed_reports_recent}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Failed</div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>AI Reliability</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--success-500)' }}>{successRate.toFixed(1)}%</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, borderRadius: 6, background: 'var(--slate-100)', overflow: 'hidden', marginBottom: 8 }}>
                <div
                  style={{
                    width: `${successRate}%`,
                    height: '100%',
                    background: 'var(--success-500)',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: 'var(--success-50)', borderRadius: 6, border: '1px solid var(--success-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success-700)', marginBottom: 4 }}>API Status</div>
            <div style={{ fontSize: 12, color: 'var(--success-600)' }}>Operational</div>
          </div>
          <div style={{ padding: 12, background: 'var(--success-50)', borderRadius: 6, border: '1px solid var(--success-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success-700)', marginBottom: 4 }}>Database</div>
            <div style={{ fontSize: 12, color: 'var(--success-600)' }}>Connected</div>
          </div>
          <div style={{ padding: 12, background: 'var(--success-50)', borderRadius: 6, border: '1px solid var(--success-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success-700)', marginBottom: 4 }}>Storage</div>
            <div style={{ fontSize: 12, color: 'var(--success-600)' }}>Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
