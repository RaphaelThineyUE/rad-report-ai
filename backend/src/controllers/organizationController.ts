/**
 * Organization controller — multi-tenant workspace management.
 * Exports: createOrganization, listOrganizations, getOrganization, updateOrganization,
 *   deleteOrganization, listMembers, inviteMember, updateMemberRole, removeMember.
 * Owner-only guard is applied inline before destructive mutations.
 * supabaseAdmin is used only to resolve invited users by email; all other queries
 * use the caller's JWT client so RLS enforces membership visibility.
 * Every mutating action writes an audit_log entry.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';

export async function createOrganization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Organization name is required' });
      return;
    }

    const client = createUserClient(req.accessToken);
    const { data, error } = await client
      .from('organizations')
      .insert({
        name,
        description,
        owner_id: userId,
      })
      .select();

    if (error) {
      logger.error('Failed to create organization', { userId, error: error.message });
      res.status(500).json({ error: 'Failed to create organization' });
      return;
    }

    const org = data?.[0];

    // Add owner as member with owner role
    await client.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

    // Log action
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'create_organization',
      resource_type: 'organization',
      resource_id: org.id,
      organization_id: org.id,
    });

    res.json(org);
  } catch (err) {
    logger.error('Unexpected error creating organization', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listOrganizations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    const client = createUserClient(req.accessToken);
    const { data, error } = await client
      .from('organizations')
      .select('*');

    if (error) {
      logger.error('Failed to list organizations', { userId, error: error.message });
      res.status(500).json({ error: 'Failed to list organizations' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    logger.error('Unexpected error listing organizations', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrganization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { orgId } = req.params;

    const client = createUserClient(req.accessToken);
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) {
      logger.error('Failed to get organization', { userId: req.userId, orgId, error: error.message });
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json(data);
  } catch (err) {
    logger.error('Unexpected error getting organization', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOrganization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { orgId } = req.params;
    const { name, description } = req.body;

    const client = createUserClient(req.accessToken);

    // Check if user is owner
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    if (orgError || org?.owner_id !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { data, error } = await client
      .from('organizations')
      .update({ name, description })
      .eq('id', orgId)
      .select();

    if (error) {
      logger.error('Failed to update organization', { userId, orgId, error: error.message });
      res.status(500).json({ error: 'Failed to update organization' });
      return;
    }

    // Log action
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'update_organization',
      resource_type: 'organization',
      resource_id: orgId,
      organization_id: orgId,
    });

    res.json(data?.[0]);
  } catch (err) {
    logger.error('Unexpected error updating organization', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteOrganization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { orgId } = req.params;

    const client = createUserClient(req.accessToken);

    // Check if user is owner
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    if (orgError || org?.owner_id !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Log action before deleting
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'delete_organization',
      resource_type: 'organization',
      resource_id: orgId,
      organization_id: orgId,
    });

    const { error } = await client.from('organizations').delete().eq('id', orgId);

    if (error) {
      logger.error('Failed to delete organization', { userId, orgId, error: error.message });
      res.status(500).json({ error: 'Failed to delete organization' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error deleting organization', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { orgId } = req.params;

    const client = createUserClient(req.accessToken);
    const { data, error } = await client
      .from('organization_members')
      .select(
        `
        id,
        user_id,
        role,
        created_at,
        users(email, full_name)
      `
      )
      .eq('organization_id', orgId);

    if (error) {
      logger.error('Failed to list members', { userId: req.userId, orgId, error: error.message });
      res.status(500).json({ error: 'Failed to list members' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    logger.error('Unexpected error listing members', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function inviteMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { orgId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ error: 'Email and role are required' });
      return;
    }

    if (!['admin', 'clinician', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const client = createUserClient(req.accessToken);

    // Check if user is admin/owner in organization
    const { data: memberCheck } = await client
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!memberCheck || !['owner', 'admin'].includes(memberCheck.role)) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Find user by email using admin client
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError || !users) {
      logger.error('Failed to list auth users', { userId, error: authError?.message });
      res.status(500).json({ error: 'Failed to find user' });
      return;
    }

    const invitedUser = users.find((u) => u.email === email);
    if (!invitedUser) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Add member
    const { data, error } = await client
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: invitedUser.id,
        role,
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'User is already a member' });
        return;
      }
      logger.error('Failed to invite member', { userId, orgId, email, error: error.message });
      res.status(500).json({ error: 'Failed to invite member' });
      return;
    }

    // Log action
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'invite_member',
      resource_type: 'organization_member',
      resource_id: data?.[0]?.id,
      organization_id: orgId,
    });

    res.json(data?.[0]);
  } catch (err) {
    logger.error('Unexpected error inviting member', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { orgId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'clinician', 'viewer', 'owner'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const client = createUserClient(req.accessToken);

    // Check if user is admin/owner in organization
    const { data: memberCheck } = await client
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!memberCheck || !['owner', 'admin'].includes(memberCheck.role)) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { data, error } = await client
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .select();

    if (error) {
      logger.error('Failed to update member role', { userId, orgId, memberId, error: error.message });
      res.status(500).json({ error: 'Failed to update member role' });
      return;
    }

    // Log action
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'update_member_role',
      resource_type: 'organization_member',
      resource_id: memberId,
      organization_id: orgId,
    });

    res.json(data?.[0]);
  } catch (err) {
    logger.error('Unexpected error updating member role', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { orgId, memberId } = req.params;

    const client = createUserClient(req.accessToken);

    // Check if user is owner in organization (only owners can remove members)
    const { data: memberCheck } = await client
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!memberCheck || memberCheck.role !== 'owner') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Log action before deleting
    await client.from('audit_logs').insert({
      user_id: userId,
      action: 'remove_member',
      resource_type: 'organization_member',
      resource_id: memberId,
      organization_id: orgId,
    });

    const { error } = await client.from('organization_members').delete().eq('id', memberId);

    if (error) {
      logger.error('Failed to remove member', { userId, orgId, memberId, error: error.message });
      res.status(500).json({ error: 'Failed to remove member' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error removing member', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
}
