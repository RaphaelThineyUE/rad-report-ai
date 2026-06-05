import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useExportAnalytics } from '@/hooks/useExport';

interface AnalyticsData {
  summary: {
    total_reports: number;
    completed_reports: number;
    failed_reports: number;
    avg_processing_time_ms: number;
    total_patients: number;
  };
  birads_distribution: Record<string, number>;
  monthly_trend: Record<string, number>;
  cancer_stage_distribution: Record<string, number>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const exportAnalytics = useExportAnalytics();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cancerStage: '',
    treatmentType: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cancerStage) params.append('cancerStage', filters.cancerStage);
      if (filters.treatmentType) params.append('treatmentType', filters.treatmentType);

      const response = await api.get(`/analytics?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      cancerStage: '',
      treatmentType: '',
    });
  };

  const handleExportCsv = async () => {
    try {
      await exportAnalytics(filters);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  if (loading) {
    return <div className="fade-up"><div className="page-head"><h1 className="t-h1">Loading...</h1></div></div>;
  }

  if (!data) {
    return <div className="fade-up"><div className="page-head"><h1 className="t-h1">Failed to load analytics</h1></div></div>;
  }

  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const monthValues = monthLabels.map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const monthKey = date.toISOString().slice(0, 7);
    return data.monthly_trend[monthKey] || 0;
  });
  const maxMonth = Math.max(...monthValues, 1);

  const biradsEntries = Object.entries(data.birads_distribution || {});
  const stageEntries = Object.entries(data.cancer_stage_distribution || {});

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Analytics</h1>
          <div className="sub">Patient population reporting · filtered results</div>
        </div>
        <button onClick={handleExportCsv} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--slate-300)', background: 'white', cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>Cancer Stage</label>
          <select
            value={filters.cancerStage}
            onChange={(e) => handleFilterChange('cancerStage', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6, fontSize: 14 }}
          >
            <option value="">All stages</option>
            {stageEntries.map(([stage]) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>Treatment Type</label>
          <input
            type="text"
            value={filters.treatmentType}
            onChange={(e) => handleFilterChange('treatmentType', e.target.value)}
            placeholder="e.g., Chemotherapy"
            style={{ padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6, fontSize: 14 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={clearFilters} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 4, border: '1px solid var(--slate-300)', background: 'var(--slate-50)', cursor: 'pointer' }}>
          Clear Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard label="Total Reports" value={String(data.summary.total_reports)} icon="file-text" />
        <MetricCard label="Completed" value={String(data.summary.completed_reports)} icon="check-circle" />
        <MetricCard label="Failed" value={String(data.summary.failed_reports)} icon="alert-triangle" />
        <MetricCard label="Avg Time" value={`${(data.summary.avg_processing_time_ms / 1000).toFixed(1)}s`} icon="clock" />
        <MetricCard label="Total Patients" value={String(data.summary.total_patients)} icon="users" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16 }}>
        <div className="card card-pad">
          <span className="t-overline">Reports per month</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 188, marginTop: 18 }}>
            {monthValues.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div
                  style={{
                    width: '100%',
                    height: (val / maxMonth) * 160,
                    borderRadius: '5px 5px 0 0',
                    background: 'var(--rose-200)',
                  }}
                />
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)' }}>
                  {monthLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <span className="t-overline">BI-RADS distribution</span>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {biradsEntries.map(([label, value]) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span className="mono" style={{ color: 'var(--fg-3)' }}>
                    {value}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--slate-100)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min((value / Math.max(...Object.values(data.birads_distribution), 1)) * 100, 100)}%`,
                      height: '100%',
                      background: 'var(--rose-500)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <span className="t-overline">Cancer stages</span>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stageEntries.slice(0, 6).map(([stage, count]) => (
              <div key={stage} style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{stage}</span>
                  <span className="mono" style={{ color: 'var(--fg-3)' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
