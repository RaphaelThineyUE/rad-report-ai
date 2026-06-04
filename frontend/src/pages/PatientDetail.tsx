import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PatientTimeline } from '../components/patient/PatientTimeline';
import { TreatmentComparison } from '../components/patient/TreatmentComparison';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { usePatient } from '../hooks/usePatients';
import { useReports } from '../hooks/useReports';
import { useTreatments } from '../hooks/useTreatments';

const tabs = ['Overview', 'Timeline', 'Treatments', 'Comparison'] as const;

export const PatientDetailPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const { data: patient } = usePatient(id);
  const { data: reports = [] } = useReports(id);
  const { data: treatments = [] } = useTreatments(id);
  const biomarkers = useMemo(() => [patient?.er_status, patient?.pr_status, patient?.her2_status].filter(Boolean), [patient]);

  if (!patient) {
    return <Card>Loading patient record…</Card>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-primary">Patient detail</p>
            <h1 className="text-3xl font-semibold">{patient.full_name}</h1>
            <p className="mt-2 text-sm text-foreground/60">{patient.cancer_type} · {patient.cancer_stage ?? 'Unknown stage'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {biomarkers.map((marker) => <Badge key={marker}>{marker}</Badge>)}
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-lg border border-border/50 px-4 py-2 text-sm ${activeTab === tab ? 'bg-primary text-white' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="font-semibold">Clinical overview</p>
            <dl className="mt-4 grid gap-3 text-sm text-foreground/70">
              <div><dt className="text-foreground/50">Date of birth</dt><dd>{patient.date_of_birth}</dd></div>
              <div><dt className="text-foreground/50">Diagnosis date</dt><dd>{patient.diagnosis_date}</dd></div>
              <div><dt className="text-foreground/50">Initial treatment plan</dt><dd>{patient.initial_treatment_plan ?? 'Pending'}</dd></div>
            </dl>
          </Card>
          <Card>
            <p className="font-semibold">Recent activity</p>
            <p className="mt-4 text-sm text-foreground/70">{reports.length} reports and {treatments.length} treatment records are currently associated with this patient.</p>
          </Card>
        </div>
      ) : null}
      {activeTab === 'Timeline' ? <PatientTimeline reports={reports} treatments={treatments} /> : null}
      {activeTab === 'Treatments' ? (
        <Card>
          <p className="font-semibold">Treatment records</p>
          <div className="mt-4 space-y-3 text-sm">
            {treatments.length ? treatments.map((treatment) => (
              <div key={treatment.id} className="rounded-lg border border-border/50 p-3">
                <p className="font-medium">{treatment.treatment_type}</p>
                <p className="text-foreground/60">{treatment.treatment_start_date} → {treatment.treatment_end_date ?? 'ongoing'}</p>
                <p className="mt-2 text-foreground/70">{treatment.medication_details ?? 'No medication details provided.'}</p>
              </div>
            )) : <p className="text-foreground/60">No treatments recorded yet.</p>}
          </div>
        </Card>
      ) : null}
      {activeTab === 'Comparison' ? <TreatmentComparison patient={patient} /> : null}
    </motion.div>
  );
};
