import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Patient, TreatmentComparisonResult } from '../../types/domain';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { TreatmentComparisonCharts } from './TreatmentComparisonCharts';

export const TreatmentComparison = ({ patient }: { patient: Patient }) => {
  const [options, setOptions] = useState(['Lumpectomy', 'Chemotherapy']);
  const comparison = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ result: TreatmentComparisonResult }>('/api/ai/compare-treatments', {
        patient,
        treatment_options: options.filter(Boolean),
      });
      return data.result;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Treatment comparison</p>
            <p className="text-sm text-foreground/60">Compare up to five treatment options with Claude-guided reasoning.</p>
          </div>
          <Button disabled={comparison.isPending} onClick={() => comparison.mutate()}>
            {comparison.isPending ? 'Analyzing…' : 'Compare options'}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => (
            <Input
              key={index}
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(event) => setOptions((current) => current.map((value, position) => position === index ? event.target.value : value))}
            />
          ))}
        </div>
        {options.length < 5 ? (
          <Button className="mt-4 bg-transparent text-foreground" onClick={() => setOptions((current) => [...current, ''])}>Add option</Button>
        ) : null}
      </Card>
      <Card className="border-amber-500/30 bg-amber-500/5 text-sm text-foreground/70">
        Medical disclaimer: AI treatment comparisons support discussion and never replace multidisciplinary clinical judgment.
      </Card>
      {comparison.data ? (
        <>
          <TreatmentComparisonCharts result={comparison.data} />
          <Card>
            <p className="font-semibold">Overall recommendation</p>
            <p className="mt-3 text-sm text-foreground/70">{comparison.data.overall_recommendation}</p>
            <p className="mt-4 text-xs text-foreground/50">{comparison.data.disclaimer}</p>
          </Card>
        </>
      ) : null}
    </div>
  );
};
