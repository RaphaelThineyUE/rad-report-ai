import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/ui/card';
import { usePatients } from '../hooks/usePatients';
import { useReports } from '../hooks/useReports';
import { useTreatments } from '../hooks/useTreatments';

const tabs = ['Demographics', 'Diagnostic', 'Treatment'] as const;

export const PatientAnalyticsPage = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Demographics');
  const { data: patients = [] } = usePatients();
  const { data: reports = [] } = useReports();
  const { data: treatments = [] } = useTreatments();
  const stageData = useMemo(() => Object.entries(patients.reduce<Record<string, number>>((acc, patient) => {
    const key = patient.cancer_stage ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value })), [patients]);

  const summaryCards = [
    { label: 'Total patients', value: patients.length },
    { label: 'Completed reports', value: reports.filter((report) => report.status === 'completed').length },
    { label: 'Active treatments', value: treatments.length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label}><p className="text-sm text-foreground/60">{card.label}</p><p className="mt-2 text-3xl font-semibold">{card.value}</p></Card>
        ))}
      </div>
      <div className="flex gap-2">
        {tabs.map((entry) => (
          <button key={entry} type="button" className={`rounded-lg border border-border/50 px-4 py-2 text-sm ${tab === entry ? 'bg-primary text-white' : ''}`} onClick={() => setTab(entry)}>{entry}</button>
        ))}
      </div>
      <Card>
        <p className="font-semibold">{tab} insights</p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stageData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} fill="hsl(var(--primary))" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
};
