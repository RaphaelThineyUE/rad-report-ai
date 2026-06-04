import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { createUserClient } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface PatientBody {
  name: string;
  date_of_birth?: string;
  sex?: 'M' | 'F' | 'Other';
  mrn?: string;
  stage?: string;
  notes?: string;
}

export async function listPatients(req: AuthRequest, res: Response): Promise<void> {
  const { search, stage, sort = 'created_at', order = 'desc' } = req.query as {
    search?: string;
    stage?: string;
    sort?: 'name' | 'created_at';
    order?: 'asc' | 'desc';
  };

  const client = createUserClient(req.accessToken);
  let query = client
    .from('patients')
    .select('*')
    .order(sort, { ascending: order === 'asc' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (stage) {
    query = query.eq('stage', stage);
  }

  const { data, error } = await query;

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

  const { name, date_of_birth, sex, mrn, stage, notes } = req.body as PatientBody;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .insert({
      name,
      date_of_birth: date_of_birth ?? null,
      sex: sex ?? null,
      mrn: mrn ?? null,
      stage: stage ?? null,
      notes: notes ?? null,
      created_by: req.userId,
    })
    .select()
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
  const { id } = req.params;
  const { name, date_of_birth, sex, mrn, stage, notes } = req.body as Partial<PatientBody>;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
  if (sex !== undefined) updates.sex = sex;
  if (mrn !== undefined) updates.mrn = mrn;
  if (stage !== undefined) updates.stage = stage;
  if (notes !== undefined) updates.notes = notes;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
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
