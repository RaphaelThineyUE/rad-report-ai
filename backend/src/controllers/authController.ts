import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { signToken } from '../utils/jwt.js';
import type { UserRecord } from '../models/types.js';

const sanitizeUser = (user: UserRecord) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const register = async (request: Request, response: Response) => {
  const password_hash = await bcrypt.hash(request.body.password, 12);
  const { data, error } = await supabase
    .from('users')
    .insert({ email: request.body.email, full_name: request.body.full_name ?? null, password_hash })
    .select()
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  const user = data as UserRecord;
  response.status(201).json({ token: signToken(sanitizeUser(user)), user: sanitizeUser(user) });
};

export const login = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', request.body.email)
    .maybeSingle();

  if (error || !data) {
    response.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const user = data as UserRecord;
  const isValid = await bcrypt.compare(request.body.password, user.password_hash);
  if (!isValid) {
    response.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  response.json({ token: signToken(sanitizeUser(user)), user: sanitizeUser(user) });
};

export const me = async (request: Request, response: Response) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', request.user!.id).single();
  if (error) {
    response.status(404).json({ error: error.message });
    return;
  }

  response.json({ user: sanitizeUser(data as UserRecord) });
};

export const updateMe = async (request: Request, response: Response) => {
  const updates = {
    full_name: request.body.full_name,
    updated_at: new Date().toISOString(),
  };

  if (request.body.password) {
    Object.assign(updates, { password_hash: await bcrypt.hash(request.body.password, 12) });
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', request.user!.id)
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ user: sanitizeUser(data as UserRecord) });
};
