import type { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js';

export const listTreatments = async (request: Request, response: Response) => {
  let query = supabase.from('treatment_records').select('*').eq('created_by', request.user!.id);
  const patientId = request.header('x-patient-id');
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query.order('treatment_start_date', { ascending: false });
  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ treatments: data });
};

export const createTreatment = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('treatment_records')
    .insert({ ...request.body, created_by: request.user!.id })
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(201).json({ treatment: data });
};

export const getTreatment = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('treatment_records')
    .select('*')
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .single();

  if (error) {
    response.status(404).json({ error: error.message });
    return;
  }

  response.json({ treatment: data });
};

export const updateTreatment = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('treatment_records')
    .update({ ...request.body, updated_at: new Date().toISOString() })
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ treatment: data });
};

export const deleteTreatment = async (request: Request, response: Response) => {
  const { error } = await supabase
    .from('treatment_records')
    .delete()
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id);

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(204).send();
};
