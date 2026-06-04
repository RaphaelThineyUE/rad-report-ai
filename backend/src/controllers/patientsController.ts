import type { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js';

export const listPatients = async (request: Request, response: Response) => {
  let query = supabase.from('patients').select('*').eq('created_by', request.user!.id);

  if (request.query.search) {
    query = query.ilike('full_name', `%${String(request.query.search)}%`);
  }

  if (request.query.stage) {
    query = query.eq('cancer_stage', String(request.query.stage));
  }

  const sort = String(request.query.sort ?? 'created_at');
  const ascending = sort === 'full_name';
  const { data, error } = await query.order(sort, { ascending });

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ patients: data });
};

export const createPatient = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...request.body, created_by: request.user!.id })
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(201).json({ patient: data });
};

export const getPatient = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .single();

  if (error) {
    response.status(404).json({ error: error.message });
    return;
  }

  response.json({ patient: data });
};

export const updatePatient = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('patients')
    .update({ ...request.body, updated_at: new Date().toISOString() })
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ patient: data });
};

export const deletePatient = async (request: Request, response: Response) => {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id);

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(204).send();
};
