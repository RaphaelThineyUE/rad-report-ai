import { motion } from 'framer-motion';
import { Card } from '../components/ui/card';

const items = [
  ['1. Register a patient', 'Create the patient record first so uploads and analytics stay scoped to the correct profile.'],
  ['2. Upload radiology PDFs', 'Use the Home page dropzone to upload secure PDF reports to Supabase Storage.'],
  ['3. Review extracted findings', 'Open each report to inspect BI-RADS, evidence quotes, red flags, and recommendations.'],
  ['4. Compare treatments', 'Use the patient comparison tab for AI-assisted option scoring with a clinician-in-the-loop workflow.'],
];

export const HowToPage = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <Card>
      <p className="text-sm text-primary">Clinical workflow guide</p>
      <h1 className="mt-2 text-3xl font-semibold">How to use RadReport AI</h1>
      <p className="mt-3 text-sm text-foreground/60">Operational guidance for secure radiology report consolidation and oncology collaboration.</p>
    </Card>
    <div className="space-y-4">
      {items.map(([title, body]) => (
        <details key={title} className="rounded-xl border border-border/50 bg-card p-5">
          <summary className="cursor-pointer font-medium">{title}</summary>
          <p className="mt-3 text-sm text-foreground/70">{body}</p>
        </details>
      ))}
    </div>
    <Card className="border-amber-500/30 bg-amber-500/5 text-sm text-foreground/70">
      Medical disclaimer: RadReport AI surfaces structured information to assist clinicians and patients, but it does not provide a diagnosis or replace medical judgment.
    </Card>
  </motion.div>
);
