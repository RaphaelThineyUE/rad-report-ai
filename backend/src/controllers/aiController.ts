import type { Request, Response } from 'express';
import { analyzeReportText, compareTreatments, consolidateReports, generatePatientSummary } from '../services/claudeService.js';

export const analyzeReport = async (request: Request, response: Response) => {
  const result = await analyzeReportText(String(request.body.pdf_text ?? ''));
  response.json({ result });
};

export const summary = async (request: Request, response: Response) => {
  const result = await generatePatientSummary(request.body.extracted_json);
  response.json({ result });
};

export const consolidate = async (request: Request, response: Response) => {
  const result = await consolidateReports(request.body.reports ?? [], request.body.patient ?? {});
  response.json({ result });
};

export const compare = async (request: Request, response: Response) => {
  const result = await compareTreatments(request.body.patient ?? {}, request.body.treatment_options ?? []);
  response.json({ result });
};
