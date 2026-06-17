/**
 * Treatment controller — CRUD for patient treatment records (treatment_records table).
 * Exports: listTreatments, createTreatment, getTreatment, updateTreatment, deleteTreatment.
 * listTreatments requires patient_id as a query param; ordered by treatment_start_date desc.
 * All queries use the caller's JWT client; RLS enforces created_by ownership.
 * Treatment data is also consumed by aiController.comparePatientTreatments for AI comparison.
 * Audit logs are written asynchronously for create/update/delete operations.
 */
import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { AppError, Errors } from '../utils/AppError.js';
import { logTreatmentAudit } from '../services/auditService.js';

interface TreatmentBody {
  patient_id: string;
  treatment_type: string;
  treatment_start_date: string;
  treatment_end_date?: string | null;
  medication_details?: string | null;
  treatment_outcome?: string | null;
  side_effects?: string | null;
  follow_up_date?: string | null;
}

export async function listTreatments(req: AuthRequest, res: Response): Promise<void> {
  const patientId = String(req.query.patient_id ?? '').trim();

  if (!patientId) {
    throw Errors.validation('patient_id is required');
  }

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('treatment_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('treatment_start_date', { ascending: false });

  if (error) {
    logger.error('listTreatments error', { userId: req.userId, patientId, error: error.message });
    throw Errors.internal('Failed to fetch treatments');
  }

  res.json({ treatments: data ?? [] });
}

export async function createTreatment(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid treatment data', errors.array());
  }

  const {
    patient_id,
    treatment_type,
    treatment_start_date,
    treatment_end_date,
    medication_details,
    treatment_outcome,
    side_effects,
    follow_up_date,
  } = req.body as TreatmentBody;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('treatment_records')
    .insert({
      created_by: req.userId,
      patient_id,
      treatment_type,
      treatment_start_date,
      treatment_end_date: treatment_end_date ?? null,
      medication_details: medication_details ?? null,
      treatment_outcome: treatment_outcome ?? null,
      side_effects: side_effects ?? null,
      follow_up_date: follow_up_date ?? null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('createTreatment error', { userId: req.userId, patientId: patient_id, error: error.message });
    throw Errors.internal('Failed to create treatment');
  }

  logTreatmentAudit(req.userId, 'create_treatment', data.id, req.accessToken);
  res.status(201).json(data);
}

export async function getTreatment(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('treatment_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw Errors.notFound('Treatment');
  }

  res.json(data);
}

export async function updateTreatment(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid treatment data', errors.array());
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body as Partial<TreatmentBody>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.patient_id !== undefined) updates.patient_id = body.patient_id;
  if (body.treatment_type !== undefined) updates.treatment_type = body.treatment_type;
  if (body.treatment_start_date !== undefined) updates.treatment_start_date = body.treatment_start_date;
  if (body.treatment_end_date !== undefined) updates.treatment_end_date = body.treatment_end_date;
  if (body.medication_details !== undefined) updates.medication_details = body.medication_details;
  if (body.treatment_outcome !== undefined) updates.treatment_outcome = body.treatment_outcome;
  if (body.side_effects !== undefined) updates.side_effects = body.side_effects;
  if (body.follow_up_date !== undefined) updates.follow_up_date = body.follow_up_date;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('treatment_records')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    logger.error('updateTreatment error', { userId: req.userId, treatmentId: id, error: error?.message });
    throw Errors.notFound('Treatment');
  }

  logTreatmentAudit(req.userId, 'update_treatment', id as string, req.accessToken);
  res.json(data);
}

export async function deleteTreatment(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { error } = await client
    .from('treatment_records')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('deleteTreatment error', { userId: req.userId, treatmentId: id, error: error.message });
    throw Errors.internal('Failed to delete treatment');
  }

  logTreatmentAudit(req.userId, 'delete_treatment', id as string, req.accessToken);
  res.status(204).send();
}
