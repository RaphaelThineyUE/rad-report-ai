import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../services/supabaseClient';
import { AuthRequest } from '../middleware/auth';
import { logPasswordChange, logAccountDeletion, logEmailChange } from '../services/auditService';

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { email, password, full_name } = req.body;
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ user: data.user, session: data.session });
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({ user: data.user, session: data.session });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name ?? null,
    role: data.user.role ?? 'user',
  });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { userId } = req as AuthRequest;
  const { full_name, email, password } = req.body;

  const updates: Record<string, unknown> = {};
  if (full_name) updates.data = { full_name };
  if (email) updates.email = email;
  if (password) updates.password = password;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Log password change if password was updated
  if (password) {
    const userAgent = req.get('user-agent');
    await logPasswordChange(
      userId,
      req.ip,
      Array.isArray(userAgent) ? userAgent[0] : userAgent
    );
  }

  // Log email change if email was updated
  if (email) {
    const userAgent2 = req.get('user-agent');
    await logEmailChange(
      userId,
      req.ip,
      Array.isArray(userAgent2) ? userAgent2[0] : userAgent2
    );
  }

  res.json({
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name ?? null,
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { email } = req.body;

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'Password reset email sent' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { password } = req.body;
  const { accessToken } = req as AuthRequest;

  // The reset token should be passed via the Authorization header (Bearer token from the email link)
  if (!accessToken) {
    res.status(401).json({ error: 'Invalid or expired reset token' });
    return;
  }

  // Verify the token is valid by checking the user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    res.status(401).json({ error: 'Invalid or expired reset token' });
    return;
  }

  // Update password for the authenticated user
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    password,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'Password reset successful' });
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Log the account deletion action
  const userAgent3 = req.get('user-agent');
  await logAccountDeletion(
    userId,
    req.ip,
    Array.isArray(userAgent3) ? userAgent3[0] : userAgent3
  );

  res.json({ message: 'Account deleted successfully' });
}
