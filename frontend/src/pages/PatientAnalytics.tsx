/**
 * PatientAnalytics page — population-level analytics across demographics, diagnostics, and treatments.
 * Fetches patients, reports, and treatments via parallel API calls; computes distributions client-side.
 * Filterable by cancer stage (Stage 0–IV); all charts re-fetch when the filter changes.
 * Sections: gender/cancer-type/stage/ethnicity (demographics), BI-RADS/exam-type/breast-density
 * (diagnostics), treatment type/outcome/duration (treatments). No TanStack Query hooks used.
 * Wrapped in ErrorBoundary to gracefully handle render errors.
 */
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageErrorFallback } from '@/components/PageErrorFallback';
import type { Patient } from '@/hooks/usePatients';
import type { Report } from '@/hooks/useReports';
import type { Treatment } from '@/hooks/useTreatments';

interface DemographicsStats {
  total_patients: number;
  avg_age: number;
  gender_distribution: Record<string, number>;
  cancer_type_distribution: Record<string, number>;
  cancer_stage_distribution: Record<string, number>;
  ethnicity_distribution: Record<string, number>;
}

interface DiagnosticsStats {
  birads_distribution: Record<string, number>;
  birads_by_cancer_type: Record<string, Record<string, number>>;
  exam_type_distribution: Record<string, number>;
  breast_density_distribution: Record<string, number>;
}

interface TreatmentStats {
  treatment_type_distribution: Record<string, number>;
  treatment_outcome_distribution: Record<string, number>;
  avg_treatment_duration_days: number;
  treatments_by_stage: Record<string, Record<string, number>>;
}

function PatientAnalyticsContent() {
  const [demographics, setDemographics] = useState<DemographicsStats | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStats | null>(null);
  const [treatments, setTreatments] = useState<TreatmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('');
  const { handleError } = useApiError();

  useEffect(() => {
    fetchAnalyticsData();
  }, [filterStage]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsRes, reportsRes, treatmentsRes] = await Promise.all([
        api.get('/api/patients'),
        api.get('/api/reports'),
        api.get('/api/treatments'),
      ]);

      const patients: Patient[] = patientsRes.data?.patients || patientsRes.data || [];
      const reports: Report[] = reportsRes.data?.reports || reportsRes.data || [];
      const treatmentRecords: Treatment[] = treatmentsRes.data?.treatments || treatmentsRes.data || [];

      // Filter by stage if specified
      let filteredPatients = patients;
      if (filterStage) {
        filteredPatients = patients.filter((p) => p.cancer_stage === filterStage);
      }

      // Calculate demographics
      const genderDist: Record<string, number> = {};
      const cancerTypeDist: Record<string, number> = {};
      const stageDist: Record<string, number> = {};
      const ethnicityDist: Record<string, number> = {};
      let totalAge = 0;

      filteredPatients.forEach((p) => {
        if (p.gender) {
          genderDist[p.gender] = (genderDist[p.gender] || 0) + 1;
        }
        cancerTypeDist[p.cancer_type] = (cancerTypeDist[p.cancer_type] || 0) + 1;
        if (p.cancer_stage) {
          stageDist[p.cancer_stage] = (stageDist[p.cancer_stage] || 0) + 1;
        }
        if (p.ethnicity) {
          ethnicityDist[p.ethnicity] = (ethnicityDist[p.ethnicity] || 0) + 1;
        }

        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        totalAge += age;
      });

      setDemographics({
        total_patients: filteredPatients.length,
        avg_age: filteredPatients.length > 0 ? Math.round(totalAge / filteredPatients.length) : 0,
        gender_distribution: genderDist,
        cancer_type_distribution: cancerTypeDist,
        cancer_stage_distribution: stageDist,
        ethnicity_distribution: ethnicityDist,
      });

      // Filter reports by patient
      const patientIds = filteredPatients.map((p) => p.id);
      const filteredReports = reports.filter((r) => patientIds.includes(r.patient_id));

      // Calculate diagnostics
      const biradsDistribution: Record<string, number> = {};
      const biradsbyType: Record<string, Record<string, number>> = {};
      const examTypeDist: Record<string, number> = {};
      const densityDist: Record<string, number> = {};

      filteredReports.forEach((r) => {
        const patient = filteredPatients.find((p) => p.id === r.patient_id);
        if (!patient) return;

        if (r.birads_value) {
          const biradsLabel = r.birads_value <= 2 ? '1-2' : String(r.birads_value);
          biradsDistribution[biradsLabel] = (biradsDistribution[biradsLabel] || 0) + 1;

          if (!biradsbyType[patient.cancer_type]) {
            biradsbyType[patient.cancer_type] = {};
          }
          biradsbyType[patient.cancer_type][biradsLabel] =
            (biradsbyType[patient.cancer_type][biradsLabel] || 0) + 1;
        }

        if (r.exam_type) {
          examTypeDist[r.exam_type] = (examTypeDist[r.exam_type] || 0) + 1;
        }

        if (r.breast_density_value) {
          densityDist[r.breast_density_value] = (densityDist[r.breast_density_value] || 0) + 1;
        }
      });

      setDiagnostics({
        birads_distribution: biradsDistribution,
        birads_by_cancer_type: biradsbyType,
        exam_type_distribution: examTypeDist,
        breast_density_distribution: densityDist,
      });

      // Calculate treatment statistics
      const patientTreatmentMap = new Map<string, Treatment[]>();
      treatmentRecords.forEach((t) => {
        if (patientIds.includes(t.patient_id)) {
          if (!patientTreatmentMap.has(t.patient_id)) {
            patientTreatmentMap.set(t.patient_id, []);
          }
          patientTreatmentMap.get(t.patient_id)!.push(t);
        }
      });

      const treatmentTypeDist: Record<string, number> = {};
      const treatmentOutcomeDist: Record<string, number> = {};
      const treatmentByStage: Record<string, Record<string, number>> = {};
      let totalDuration = 0;
      let treatmentCount = 0;

      patientTreatmentMap.forEach((treatmentsForPatient, patientId) => {
        const patient = filteredPatients.find((p) => p.id === patientId);
        if (!patient || !patient.cancer_stage) return;

        if (!treatmentByStage[patient.cancer_stage]) {
          treatmentByStage[patient.cancer_stage] = {};
        }

        treatmentsForPatient.forEach((t) => {
          treatmentTypeDist[t.treatment_type] = (treatmentTypeDist[t.treatment_type] || 0) + 1;

          if (t.treatment_outcome) {
            treatmentOutcomeDist[t.treatment_outcome] = (treatmentOutcomeDist[t.treatment_outcome] || 0) + 1;
          }

          if (patient.cancer_stage) {
            treatmentByStage[patient.cancer_stage][t.treatment_type] =
              (treatmentByStage[patient.cancer_stage][t.treatment_type] || 0) + 1;
          }

          if (t.treatment_start_date && t.treatment_end_date) {
            const duration =
              (new Date(t.treatment_end_date).getTime() - new Date(t.treatment_start_date).getTime()) /
              (1000 * 60 * 60 * 24);
            totalDuration += duration;
            treatmentCount++;
          }
        });
      });

      setTreatments({
        treatment_type_distribution: treatmentTypeDist,
        treatment_outcome_distribution: treatmentOutcomeDist,
        avg_treatment_duration_days: treatmentCount > 0 ? Math.round(totalDuration / treatmentCount) : 0,
        treatments_by_stage: treatmentByStage,
      });
    } catch (err: unknown) {
      const msg = handleError(err, 'Failed to load patient analytics data', false);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <PageErrorFallback
        error={new Error(error)}
        resetErrorBoundary={fetchAnalyticsData}
        title="Analytics Error"
        description={error}
      />
    );
  }

  if (loading) {
    return (
      <div className="fade-up">
        <div className="page-head">
          <h1 className="t-h1">Loading...</h1>
        </div>
      </div>
    );
  }

  const stageOptions = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'];

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Patient Analytics</h1>
          <div className="sub">Demographics, diagnostics, and treatment analysis</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginRight: 12 }}>
          Filter by Stage:
        </label>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--slate-300)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <option value="">All Stages</option>
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      {/* Demographics Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Patient Demographics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <span className="t-overline">Gender Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(demographics?.gender_distribution || {}).map(([gender, count]) => (
                <div key={gender}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{gender}</span>
                    <span className="mono" style={{ color: 'var(--fg-3)' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((count / (demographics?.total_patients || 1)) * 100)}%`,
                        height: '100%',
                        background: 'var(--primary-400)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Cancer Type Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(demographics?.cancer_type_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{type}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / (demographics?.total_patients || 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--rose-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Cancer Stage Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(demographics?.cancer_stage_distribution || {})
                .sort((a) => (a[0] === 'Unknown' ? 1 : -1))
                .map(([stage, count]) => (
                  <div key={stage}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{stage}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / (demographics?.total_patients || 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--amber-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <span className="t-overline">Key Demographic Metrics</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Total Patients</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{demographics?.total_patients}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Average Age</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{demographics?.avg_age} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Unique Cancer Types</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {Object.keys(demographics?.cancer_type_distribution || {}).length}
                </span>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Ethnicity Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(demographics?.ethnicity_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([ethnicity, count]) => (
                  <div key={ethnicity} style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{ethnicity || 'Not specified'}</span>
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

      {/* Diagnostics Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Diagnostic Findings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <span className="t-overline">BI-RADS Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(diagnostics?.birads_distribution || {})
                .sort((a, b) => {
                  const orderMap: Record<string, number> = { '1-2': 0, '3': 1, '4': 2, '5': 3, '6': 4 };
                  return (orderMap[a[0]] || 999) - (orderMap[b[0]] || 999);
                })
                .map(([birads, count]) => (
                  <div key={birads}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>BI-RADS {birads}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / Math.max(...Object.values(diagnostics?.birads_distribution || {}), 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--info-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Exam Type Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(diagnostics?.exam_type_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([examType, count]) => (
                  <div key={examType}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{examType}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / Math.max(...Object.values(diagnostics?.exam_type_distribution || {}), 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--cyan-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Breast Density Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(diagnostics?.breast_density_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([density, count]) => (
                  <div key={density}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{density}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / Math.max(...Object.values(diagnostics?.breast_density_distribution || {}), 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--purple-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Section */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Treatment Analysis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="card card-pad">
            <span className="t-overline">Treatment Type Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(treatments?.treatment_type_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{type}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / Math.max(...Object.values(treatments?.treatment_type_distribution || {}), 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--teal-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Treatment Outcome Distribution</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(treatments?.treatment_outcome_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([outcome, count]) => (
                  <div key={outcome}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{outcome}</span>
                      <span className="mono" style={{ color: 'var(--fg-3)' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((count / Math.max(...Object.values(treatments?.treatment_outcome_distribution || {}), 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--green-400)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-pad">
            <span className="t-overline">Treatment Metrics</span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Avg Duration</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {treatments?.avg_treatment_duration_days || 0} days
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Treatment Types</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {Object.keys(treatments?.treatment_type_distribution || {}).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Outcomes Tracked</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {Object.keys(treatments?.treatment_outcome_distribution || {}).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientAnalytics() {
  return (
    <ErrorBoundary
      fallback={(error: Error, retry: () => void) => (
        <PageErrorFallback
          error={error}
          resetErrorBoundary={retry}
          title="Patient Analytics Error"
          description="An unexpected error occurred while displaying patient analytics."
        />
      )}
    >
      <PatientAnalyticsContent />
    </ErrorBoundary>
  );
}
