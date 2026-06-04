import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import type { TreatmentComparisonResult } from '../../types/domain';

export const TreatmentComparisonCharts = ({ result }: { result: TreatmentComparisonResult }) => (
  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
    <Card>
      <p className="font-semibold">Scored comparison</p>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={result.options}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Bar dataKey="score" fill="hsl(var(--primary))" radius={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
    <div className="space-y-4">
      {result.options.map((option) => (
        <Card key={option.name}>
          <p className="font-semibold">{option.name}</p>
          <p className="mt-2 text-3xl font-semibold">{option.score}/10</p>
          <p className="mt-2 text-sm text-foreground/60">Duration: {option.duration}</p>
          <p className="mt-2 text-sm text-foreground/70">{option.efficacy}</p>
        </Card>
      ))}
    </div>
  </div>
);
