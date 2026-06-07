-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizations_owner_id ON organizations(owner_id);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'clinician', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_role ON organization_members(role);

-- Add organization_id to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS patients_organization_id ON patients(organization_id);

-- Add organization_id to radiology_reports table
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS reports_organization_id ON radiology_reports(organization_id);

-- Add organization_id to treatment_records table
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS treatments_organization_id ON treatment_records(organization_id);

-- Add organization_id to audit_logs for tracking
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS audit_logs_org_id ON audit_logs(organization_id);

-- Enable RLS on organization tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization RLS policies
-- Only members of an organization can view it
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id AND user_id = auth.uid()
  )
);

-- Only owners can update their organization
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  auth.uid() = owner_id
);

-- Only owners can delete their organization
CREATE POLICY "org_delete" ON organizations FOR DELETE USING (
  auth.uid() = owner_id
);

-- Only owners can insert (create new org)
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);

-- Organization members policies
-- Users can view their own membership records.
-- (A self-referencing EXISTS would cause infinite recursion when other table policies
-- query organization_members during RLS evaluation.)
CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (
  user_id = auth.uid()
);

-- Only admins/owners can add members
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    INNER JOIN organizations o ON om.organization_id = o.id
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);

-- Only admins/owners can update member roles
CREATE POLICY "org_members_update" ON organization_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);

-- Only owners can remove members
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- Update patients RLS to support organization-based access
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

-- Allow viewing if user created it OR is member of the organization
CREATE POLICY "patients_select" ON patients FOR SELECT USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = patients.organization_id
     AND user_id = auth.uid()
   )
  )
);

CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "patients_update" ON patients FOR UPDATE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = patients.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin', 'clinician')
   )
  )
);

CREATE POLICY "patients_delete" ON patients FOR DELETE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = patients.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin')
   )
  )
);

-- Update radiology_reports RLS
DROP POLICY IF EXISTS "reports_select" ON radiology_reports;
DROP POLICY IF EXISTS "reports_insert" ON radiology_reports;
DROP POLICY IF EXISTS "reports_update" ON radiology_reports;
DROP POLICY IF EXISTS "reports_delete" ON radiology_reports;

CREATE POLICY "reports_select" ON radiology_reports FOR SELECT USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = radiology_reports.organization_id
     AND user_id = auth.uid()
   )
  )
);

CREATE POLICY "reports_insert" ON radiology_reports FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "reports_update" ON radiology_reports FOR UPDATE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = radiology_reports.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin', 'clinician')
   )
  )
);

CREATE POLICY "reports_delete" ON radiology_reports FOR DELETE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = radiology_reports.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin')
   )
  )
);

-- Update treatment_records RLS
DROP POLICY IF EXISTS "treatments_select" ON treatment_records;
DROP POLICY IF EXISTS "treatments_insert" ON treatment_records;
DROP POLICY IF EXISTS "treatments_update" ON treatment_records;
DROP POLICY IF EXISTS "treatments_delete" ON treatment_records;

CREATE POLICY "treatments_select" ON treatment_records FOR SELECT USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = treatment_records.organization_id
     AND user_id = auth.uid()
   )
  )
);

CREATE POLICY "treatments_insert" ON treatment_records FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "treatments_update" ON treatment_records FOR UPDATE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = treatment_records.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin', 'clinician')
   )
  )
);

CREATE POLICY "treatments_delete" ON treatment_records FOR DELETE USING (
  auth.uid() = created_by OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = treatment_records.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin')
   )
  )
);

-- Update audit_logs RLS to support org-scoped viewing
DROP POLICY IF EXISTS "audit_select_own" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;

CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT USING (
  auth.uid() = user_id OR
  (organization_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_id = audit_logs.organization_id
     AND user_id = auth.uid()
     AND role IN ('owner', 'admin')
   )
  )
);

CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
