/**
 * Organizations routes — mounted at /api/organizations. All routes require requireAuth.
 * POST   /                          — create organization (createOrganization)
 * GET    /                          — list organizations for current user (listOrganizations)
 * GET    /:orgId                    — fetch single organization (getOrganization)
 * PATCH  /:orgId                    — update organization (updateOrganization)
 * DELETE /:orgId                    — delete organization (deleteOrganization)
 * GET    /:orgId/members            — list members (listMembers)
 * POST   /:orgId/members/invite     — invite a new member (inviteMember)
 * PATCH  /:orgId/members/:memberId  — update member role (updateMemberRole)
 * DELETE /:orgId/members/:memberId  — remove member (removeMember)
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/organizationController.js';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

// Organization CRUD
router.post('/', requireAuth, wrapAuth(createOrganization));
router.get('/', requireAuth, wrapAuth(listOrganizations));
router.get('/:orgId', requireAuth, wrapAuth(getOrganization));
router.patch('/:orgId', requireAuth, wrapAuth(updateOrganization));
router.delete('/:orgId', requireAuth, wrapAuth(deleteOrganization));

// Member management
router.get('/:orgId/members', requireAuth, wrapAuth(listMembers));
router.post('/:orgId/members/invite', requireAuth, wrapAuth(inviteMember));
router.patch('/:orgId/members/:memberId', requireAuth, wrapAuth(updateMemberRole));
router.delete('/:orgId/members/:memberId', requireAuth, wrapAuth(removeMember));

export default router;
