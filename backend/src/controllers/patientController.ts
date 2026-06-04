import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { createUserClient } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface PatientBody {
  full_name: string;
  date_of_birth: string;
  gender?: string | null;
  ethnicity?: string | null;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage?: string | null;
  tumor_size_cm?: number | null;
  lymph_node_positive?: boolean | null;
  er_status?: string | null;
  pr_status?: string | null;
  her2_status?: string | null;
  menopausal_status?: string | null;
  initial_treatment_plan?: string | null;
}

export async function listPatients(req: AuthRequest, res: Response): Promise<void> {
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('created_by', req.userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('listPatients error', { userId: req.userId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch patients' });
    return;
  }

  res.json({ patients: data ?? [] });
}

export async function createPatient(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const {
    full_name,
    date_of_birth,
    gender,
    ethnicity,
    diagnosis_date,
    cancer_type,
    cancer_stage,
    tumor_size_cm,
    lymph_node_positive,
    er_status,
    pr_status,
    her2_status,
    menopausal_status,
    initial_treatment_plan,
  } = req.body as PatientBody;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .insert({
      created_by: req.userId,
      full_name,
      date_of_birth,
      gender: gender ?? null,
      ethnicity: ethnicity ?? null,
      diagnosis_date,
      cancer_type,
      cancer_stage: cancer_stage ?? null,
      tumor_size_cm: tumor_size_cm ?? null,
      lymph_node_positive: lymph_node_positive ?? null,
      er_status: er_status ?? null,
      pr_status: pr_status ?? null,
      her2_status: her2_status ?? null,
      menopausal_status: menopausal_status ?? null,
      initial_treatment_plan: initial_treatment_plan ?? null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('createPatient error', { userId: req.userId, error: error.message });
    res.status(500).json({ error: 'Failed to create patient' });
    return;
  }

  res.status(201).json(data);
}

export async function getPatient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  res.json(data);
}

export async function updatePatient(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;
  const body = req.body as Partial<PatientBody>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.full_name !== undefined) updates.full_name = body.full_name;
  if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth;
  if (body.gender !== undefined) updates.gender = body.gender;
  if (body.ethnicity !== undefined) updates.ethnicity = body.ethnicity;
  if (body.diagnosis_date !== undefined) updates.diagnosis_date = body.diagnosis_date;
  if (body.cancer_type !== undefined) updates.cancer_type = body.cancer_type;
  if (body.cancer_stage !== undefined) updates.cancer_stage = body.cancer_stage;
  if (body.tumor_size_cm !== undefined) updates.tumor_size_cm = body.tumor_size_cm;
  if (body.lymph_node_positive !== undefined) updates.lymph_node_positive = body.lymph_node_positive;
  if (body.er_status !== undefined) updates.er_status = body.er_status;
  if (body.pr_status !== undefined) updates.pr_status = body.pr_status;
  if (body.her2_status !== undefined) updates.her2_status = body.her2_status;
  if (body.menopausal_status !== undefined) updates.menopausal_status = body.menopausal_status;
  if (body.initial_treatment_plan !== undefined) updates.initial_treatment_plan = body.initial_treatment_plan;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    logger.error('updatePatient error', { userId: req.userId, patientId: id, error: error?.message });
    res.status(404).json({ error: 'Patient not found or update failed' });
    return;
  }

  res.json(data);
}

export async function deletePatient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const { error } = await client
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('deletePatient error', { userId: req.userId, patientId: id, error: error.message });
    res.status(500).json({ error: 'Failed to delete patient' });
    return;
  }

  res.status(204).send();
}
