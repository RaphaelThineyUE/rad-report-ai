-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- patients policies
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (auth.uid() = created_by);

-- radiology_reports policies
CREATE POLICY "reports_select" ON radiology_reports FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "reports_insert" ON radiology_reports FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "reports_update" ON radiology_reports FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "reports_delete" ON radiology_reports FOR DELETE USING (auth.uid() = created_by);

-- treatment_records policies
CREATE POLICY "treatments_select" ON treatment_records FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "treatments_insert" ON treatment_records FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "treatments_update" ON treatment_records FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "treatments_delete" ON treatment_records FOR DELETE USING (auth.uid() = created_by);

-- audit_logs: users see only their own
CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
