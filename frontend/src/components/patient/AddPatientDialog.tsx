import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { useCreatePatient } from '../../hooks/usePatients';

const initialValues = {
  full_name: '',
  date_of_birth: '',
  diagnosis_date: '',
  cancer_type: '',
  cancer_stage: 'Unknown',
};

export const AddPatientDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [values, setValues] = useState(initialValues);
  const mutation = useCreatePatient();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add patient</h2>
          <Button className="bg-transparent text-foreground" onClick={onClose}>Close</Button>
        </div>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(values, { onSuccess: () => { setValues(initialValues); onClose(); } });
          }}
        >
          <Input placeholder="Full name" value={values.full_name} onChange={(event) => setValues({ ...values, full_name: event.target.value })} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" value={values.date_of_birth} onChange={(event) => setValues({ ...values, date_of_birth: event.target.value })} required />
            <Input type="date" value={values.diagnosis_date} onChange={(event) => setValues({ ...values, diagnosis_date: event.target.value })} required />
          </div>
          <Input placeholder="Cancer type" value={values.cancer_type} onChange={(event) => setValues({ ...values, cancer_type: event.target.value })} required />
          <Input placeholder="Stage" value={values.cancer_stage} onChange={(event) => setValues({ ...values, cancer_stage: event.target.value })} />
          <Button disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Create patient'}</Button>
        </form>
      </Card>
    </div>
  );
};
