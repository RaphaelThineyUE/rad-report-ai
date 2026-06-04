import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { AddPatientDialog } from '@/components/patients/AddPatientDialog';
import { StageBadge, PatientAvatar } from '@/components/patients/StageBadge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const STAGES = ['Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'];

function SkeletonCard() {
  return (
    <div className="card card-pad" style={{ opacity: 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-subtle)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'var(--bg-subtle)' }} />
          <div style={{ height: 11, width: '40%', borderRadius: 6, background: 'var(--bg-subtle)' }} />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="kv">
          <div style={{ height: 11, width: '30%', borderRadius: 6, background: 'var(--bg-subtle)' }} />
          <div style={{ height: 11, width: '25%', borderRadius: 6, background: 'var(--bg-subtle)' }} />
        </div>
      ))}
    </div>
  );
}

// The global search prop from AppLayout is accepted but patients manages its own local search
interface PatientsProps {
  search?: string;
}

export default function Patients(_props: PatientsProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sort, setSort] = useState<'created_at' | 'name'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [addOpen, setAddOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data: patients, isLoading, isError } = usePatients({
    search: debouncedSearch || undefined,
    stage: stageFilter || undefined,
    sort,
    order,
  });

  function toggleSort(field: 'created_at' | 'name') {
    if (sort === field) setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
  }

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Patients</h1>
          <div className="sub">Longitudinal records across all studies</div>
        </div>
        <Button variant="primary" icon="UserPlus" onClick={() => setAddOpen(true)}>
          Add Patient
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Icon name="Search" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients…"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fg-4)', padding: 0 }}>
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={selectStyle}>
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button onClick={() => toggleSort('name')} className="btn btn-secondary btn-sm">
          <Icon name="ArrowUpDown" size={13} />
          Name {sort === 'name' ? (order === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button onClick={() => toggleSort('created_at')} className="btn btn-secondary btn-sm">
          <Icon name="Calendar" size={13} />
          Date {sort === 'created_at' ? (order === 'asc' ? '↑' : '↓') : ''}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--danger-700)' }}>
          <Icon name="AlertCircle" size={32} />
          <p>Failed to load patients. Please try again.</p>
        </div>
      ) : !patients?.length ? (
        <EmptyState hasFilters={!!(debouncedSearch || stageFilter)} onAdd={() => setAddOpen(true)} />
      ) : (
        <PatientGrid patients={patients} />
      )}

      {addOpen && <AddPatientDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
}

interface PatientGridProps {
  patients: Array<{
    id: string; name: string; mrn: string | null; stage: string | null;
    sex: 'M' | 'F' | 'Other' | null; date_of_birth: string | null; created_at: string;
  }>;
}

function PatientGrid({ patients }: PatientGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {patients.map(p => (
        <Link key={p.id} to={`/patients/${p.id}`} style={{ textDecoration: 'none' }}>
          <div
            className="card card-pad"
            style={{ cursor: 'pointer', transition: 'box-shadow var(--dur-fast), transform var(--dur-fast)', height: '100%' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
              (e.currentTarget as HTMLDivElement).style.transform = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <PatientAvatar name={p.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                {p.mrn && (
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>MRN: {p.mrn}</div>
                )}
              </div>
              {p.stage && <StageBadge stage={p.stage} />}
            </div>
            <div className="kv">
              <span className="k">Sex</span>
              <span className="v">{p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : p.sex ?? '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Date of birth</span>
              <span className="v mono">{p.date_of_birth ? p.date_of_birth.slice(0, 10) : '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Added</span>
              <span className="v mono">{p.created_at.slice(0, 10)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onAdd }: { hasFilters: boolean; onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 24px', color: 'var(--fg-3)' }}>
      <Icon name="Users" size={40} />
      <h3 className="t-h3" style={{ marginTop: 16, marginBottom: 8 }}>No patients yet</h3>
      <p style={{ color: 'var(--fg-4)' }}>
        {hasFilters ? 'No patients match your filters.' : 'Add your first patient to get started.'}
      </p>
      {!hasFilters && (
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" icon="UserPlus" onClick={onAdd}>Add your first patient</Button>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: 13,
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border-2)',
  background: 'var(--bg-surface)',
  color: 'var(--fg-2)',
  fontFamily: 'inherit',
  cursor: 'pointer',
};
