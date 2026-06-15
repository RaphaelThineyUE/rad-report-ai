/**
 * Patient controller — CRUD and data-export for oncology patient records.
 * Exports: listPatients, createPatient, getPatient, updatePatient,
 *   deletePatient, exportPatientBundle.
 * All queries use the caller's JWT client; RLS enforces created_by ownership.
 * exportPatientBundle returns patient demographics, linked radiology reports,
 * and treatment records as a downloadable JSON attachment (no PHI in logs).
 * Audit logs are written asynchronously for create/update/delete operations.
 */
import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { AppError, Errors } from '../utils/AppError.js';
import { logPatientAudit } from '../services/auditService.js';

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
    throw Errors.internal('Failed to fetch patients');
  }

  res.json({ patients: data ?? [] });
}

export async function createPatient(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid patient data', errors.array());
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
    throw Errors.internal('Failed to create patient');
  }

  logPatientAudit(req.userId, 'create_patient', data.id, req.accessToken);
  res.status(201).json(data);
}

export async function getPatient(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw Errors.notFound('Patient');
  }

  res.json(data);
}

export async function updatePatient(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid patient data', errors.array());
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
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
    throw Errors.notFound('Patient');
  }

  logPatientAudit(req.userId, 'update_patient', id, req.accessToken);
  res.json(data);
}

export async function deletePatient(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { error } = await client
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('deletePatient error', { userId: req.userId, patientId: id, error: error.message });
    throw Errors.internal('Failed to delete patient');
  }

  logPatientAudit(req.userId, 'delete_patient', id, req.accessToken);
  res.status(204).send();
}

export async function exportPatientBundle(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);

  const { data: patient, error: patientError } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('created_by', req.userId)
    .single();

  if (patientError || !patient) {
    throw Errors.notFound('Patient');
  }

  const { data: reports, error: reportsError } = await client
    .from('radiology_reports')
    .select('id, filename, created_at, status, birads_value, summary, findings, recommendations')
    .eq('patient_id', id);

  if (reportsError) {
    logger.error('exportPatientBundle reports error', { userId: req.userId, patientId: id, error: reportsError.message });
    throw Errors.internal('Failed to fetch patient reports');
  }

  const { data: treatments, error: treatmentsError } = await client
    .from('treatment_records')
    .select('*')
    .eq('patient_id', id);

  if (treatmentsError) {
    logger.error('exportPatientBundle treatments error', { userId: req.userId, patientId: id, error: treatmentsError.message });
    throw Errors.internal('Failed to fetch patient treatments');
  }

  const exportData = {
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      ethnicity: patient.ethnicity,
      diagnosis_date: patient.diagnosis_date,
      cancer_type: patient.cancer_type,
      cancer_stage: patient.cancer_stage,
      tumor_size_cm: patient.tumor_size_cm,
      lymph_node_positive: patient.lymph_node_positive,
      er_status: patient.er_status,
      pr_status: patient.pr_status,
      her2_status: patient.her2_status,
      menopausal_status: patient.menopausal_status,
      initial_treatment_plan: patient.initial_treatment_plan,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
    },
    reports: reports ?? [],
    treatments: treatments ?? [],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="patient-${id}.json"`);
  res.json(exportData);
}
