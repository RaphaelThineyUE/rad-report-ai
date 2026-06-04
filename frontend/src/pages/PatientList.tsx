import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AddPatientDialog } from '../components/patient/AddPatientDialog';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { usePatients } from '../hooks/usePatients';
import { formatDate } from '../lib/utils';

export const PatientListPage = () => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: patients = [] } = usePatients(search, stage);
  const filtered = useMemo(() => patients, [patients]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold">Patient registry</p>
            <p className="text-sm text-foreground/60">Search, filter, and open patient records for analytics or longitudinal review.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search patient" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Input placeholder="Filter by stage" value={stage} onChange={(event) => setStage(event.target.value)} />
            <Button onClick={() => setDialogOpen(true)}>Add patient</Button>
          </div>
        </div>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border/50 text-foreground/60">
            <tr>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Diagnosis</th>
              <th className="px-5 py-3">Stage</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient) => (
              <tr key={patient.id} className="border-b border-border/50 last:border-none">
                <td className="px-5 py-4"><Link className="font-medium text-primary" to={`/patients/${patient.id}`}>{patient.full_name}</Link></td>
                <td className="px-5 py-4">{patient.cancer_type}</td>
                <td className="px-5 py-4">{patient.cancer_stage ?? 'Unknown'}</td>
                <td className="px-5 py-4">{formatDate(patient.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <AddPatientDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </motion.div>
  );
};
