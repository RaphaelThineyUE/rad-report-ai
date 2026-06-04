import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ConsolidatedView } from '../components/reports/ConsolidatedView';
import { FileDropzone } from '../components/reports/FileDropzone';
import { ReportDetail } from '../components/reports/ReportDetail';
import { ReportsList } from '../components/reports/ReportsList';
import { Card } from '../components/ui/card';
import { usePatients } from '../hooks/usePatients';
import { useDeleteReport, useReports, useUploadReport } from '../hooks/useReports';
import { api } from '../services/api';
import type { Report } from '../types/domain';

export const HomePage = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [consolidated, setConsolidated] = useState<{ reports: Report[]; summary: string } | null>(null);
  const { data: patients = [] } = usePatients();
  const { data: reports = [], isLoading } = useReports(selectedPatientId || undefined);
  const uploadReport = useUploadReport();
  const deleteReport = useDeleteReport();
  const consolidation = useMutation({
    mutationFn: async (report: Report) => {
      const reportGroup = reports.filter((item) => item.patient_id === report.patient_id);
      const patient = patients.find((item) => item.id === report.patient_id);
      const { data } = await api.post<{ result: string }>('/api/ai/consolidate-reports', { reports: reportGroup, patient });
      return { reports: reportGroup, summary: data.result };
    },
    onSuccess: setConsolidated,
  });

  const stats = useMemo(
    () => [
      { label: 'Patients', value: patients.length },
      { label: 'Reports', value: reports.length },
      { label: 'Critical flags', value: reports.reduce((sum, report) => sum + (report.red_flags?.length ?? 0), 0) },
    ],
    [patients.length, reports],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-foreground/60">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Patient selector</p>
            <p className="text-sm text-foreground/60">Choose a patient to scope uploads and report review.</p>
          </div>
          <select
            className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.target.value)}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}
          </select>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <FileDropzone
          disabled={!selectedPatientId}
          onUpload={async (file) => {
            await uploadReport.mutateAsync({ patientId: selectedPatientId, file });
          }}
        />
        <ReportsList reports={reports} isLoading={isLoading} onSelect={setActiveReport} />
      </div>
      <ReportDetail
        report={activeReport}
        onClose={() => setActiveReport(null)}
        onDelete={(reportId) => deleteReport.mutate(reportId, { onSuccess: () => setActiveReport(null) })}
        onConsolidate={(report) => consolidation.mutate(report)}
      />
      {consolidated ? <ConsolidatedView reports={consolidated.reports} summary={consolidated.summary} onClose={() => setConsolidated(null)} /> : null}
    </motion.div>
  );
};
