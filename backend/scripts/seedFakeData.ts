import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? 'reports';
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env.local');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SEED_MARKER = 'SEED_FAKE_DATA_V1';
const SEED_PASSWORD = 'SeedFakeData123!';
const TODAY = new Date('2026-06-15T12:00:00.000Z');

type Gender = 'Male' | 'Female' | 'Other';
type Stage = 'Stage 0' | 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV' | 'Unknown';
type Biomarker = 'Positive' | 'Negative' | 'Unknown';
type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
type Modality = 'mammography' | 'tomosynthesis' | 'ultrasound' | 'mri' | 'other';
type Contrast = 'with' | 'without' | 'not_applicable';
type MemberRole = 'owner' | 'clinician';

interface SeedUser {
  key: 'org_owner' | 'org_clinician' | 'solo_user';
  fullName: string;
  email: string;
  role: MemberRole | 'solo';
  patientCount: number;
}

interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string;
}

interface SeedContext {
  organizationId: string;
  users: Record<SeedUser['key'], AuthUserRecord>;
}

interface ReportFinding {
  laterality: string;
  location: string;
  description: string;
  assessment: string;
  evidence: string[];
  finding_type?: string;
  size_mm?: number;
  per_finding_birads?: number;
  interval_change?: string;
  clock_position?: string;
  distance_from_nipple_cm?: number;
  quadrant?: string;
  depth?: string;
  shape?: string;
  margin?: string;
  ultrasound_features?: string;
  mri_features?: string;
}

interface ReportRecommendation {
  action: string;
  timeframe: string;
  evidence: string[];
}

interface TreatmentRecord {
  created_by: string;
  organization_id: string | null;
  patient_id: string;
  treatment_type: string;
  treatment_start_date: string;
  treatment_end_date: string | null;
  medication_details: string | null;
  treatment_outcome: string | null;
  side_effects: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

const seedUsers: SeedUser[] = [
  {
    key: 'org_owner',
    fullName: 'Dr. Maya Chen',
    email: 'seed.org.owner@radreport-ai.local',
    role: 'owner',
    patientCount: 4,
  },
  {
    key: 'org_clinician',
    fullName: 'Dr. Sofia Patel',
    email: 'seed.org.clinician@radreport-ai.local',
    role: 'clinician',
    patientCount: 3,
  },
  {
    key: 'solo_user',
    fullName: 'Dr. Elena Brooks',
    email: 'seed.solo.user@radreport-ai.local',
    role: 'solo',
    patientCount: 5,
  },
];

const firstNames = ['Amelia', 'Bianca', 'Carla', 'Diana', 'Elise', 'Farah', 'Grace', 'Helena', 'Ivy', 'Julia', 'Kara', 'Lena'];
const lastNames = ['Waters', 'Ramirez', 'Shaw', 'Nguyen', 'Bennett', 'Flores', 'Kim', 'Morgan', 'Sullivan', 'Adams', 'Perez', 'Foster'];
const ethnicities = ['Hispanic', 'White', 'Black', 'Asian', 'Middle Eastern', 'Mixed'];
const cancerTypes = [
  'Invasive Ductal Carcinoma',
  'Invasive Lobular Carcinoma',
  'DCIS',
  'Triple Negative Breast Cancer',
  'HER2-Positive Breast Cancer',
];
const stages: Stage[] = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'];
const modalities: Modality[] = ['mammography', 'tomosynthesis', 'ultrasound', 'mri'];
const densities = ['Scattered fibroglandular density', 'Heterogeneously dense', 'Extremely dense', 'Almost entirely fatty'];
const riskFactors = [
  'Family history of breast cancer',
  'Prior atypical hyperplasia',
  'Dense breast tissue',
  'Known BRCA mutation',
  'Prior chest radiation',
  'First live birth after age 30',
];
const treatmentTypes = ['Surgery', 'Chemotherapy', 'Radiation', 'Hormone Therapy', 'Targeted Therapy'];
const treatmentOutcomes = ['Complete Response', 'Partial Response', 'Stable Disease', 'Remission', 'Other'];

function mulberry32(seed: number) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260615);

function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)];
}

function pickMany<T>(items: T[], count: number): T[] {
  const copy = [...items];
  const out: T[] = [];
  while (copy.length > 0 && out.length < count) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isoTimestamp(date: Date) {
  return date.toISOString();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function makePdfBuffer(label: string) {
  const safe = label.replace(/[()]/g, '');
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 60 >>
stream
BT
/F1 12 Tf
24 96 Td
(${safe}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000351 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
421
%%EOF`;
  return Buffer.from(content, 'utf8');
}

async function listAuthUsersByEmail(emails: string[]) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;
  const wanted = new Set(emails);
  return (data.users ?? []).filter((user) => user.email && wanted.has(user.email));
}

async function cleanupExistingSeedData(emails: string[]) {
  const existingUsers = await listAuthUsersByEmail(emails);
  const userIds = existingUsers.map((user) => user.id);
  if (userIds.length === 0) return;

  const { data: organizations, error: orgLookupError } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .in('owner_id', userIds);
  if (orgLookupError) throw orgLookupError;
  const orgIds = (organizations ?? []).map((org) => org.id);

  const deleteByUserOrOrg = async (table: string) => {
    if (orgIds.length > 0) {
      const { error } = await supabaseAdmin.from(table).delete().in('organization_id', orgIds);
      if (error) throw error;
    }
    const { error } = await supabaseAdmin.from(table).delete().in('created_by', userIds);
    if (error && !error.message.includes('column')) throw error;
  };

  if (orgIds.length > 0) {
    const { error } = await supabaseAdmin.from('organization_members').delete().in('organization_id', orgIds);
    if (error) throw error;
  }

  await deleteByUserOrOrg('radiology_reports');
  await deleteByUserOrOrg('treatment_records');
  await deleteByUserOrOrg('patients');

  if (orgIds.length > 0) {
    const { error } = await supabaseAdmin.from('audit_logs').delete().in('organization_id', orgIds);
    if (error) throw error;
  }

  const { error: auditDeleteError } = await supabaseAdmin.from('audit_logs').delete().in('user_id', userIds);
  if (auditDeleteError) throw auditDeleteError;

  if (orgIds.length > 0) {
    const { error } = await supabaseAdmin.from('organizations').delete().in('id', orgIds);
    if (error) throw error;
  }

  const { error: publicUsersDeleteError } = await supabaseAdmin.from('users').delete().in('id', userIds);
  if (publicUsersDeleteError) throw publicUsersDeleteError;

  for (const user of existingUsers) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
}

async function createSeedAuthUsers(): Promise<Record<SeedUser['key'], AuthUserRecord>> {
  const users = {} as Record<SeedUser['key'], AuthUserRecord>;

  for (const seedUser of seedUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: seedUser.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: seedUser.fullName,
        seed_marker: SEED_MARKER,
      },
      app_metadata: {
        role: 'user',
        seed_marker: SEED_MARKER,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error(`Failed to create auth user for ${seedUser.email}`);
    }

    const row = {
      id: data.user.id,
      email: seedUser.email,
      fullName: seedUser.fullName,
    };

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: row.id,
      email: row.email,
      full_name: row.fullName,
      password_hash: 'managed-by-supabase-auth',
      role: 'user',
    });

    if (profileError) throw profileError;
    users[seedUser.key] = row;
  }

  return users;
}

async function createOrganization(contextUsers: Record<SeedUser['key'], AuthUserRecord>) {
  const owner = contextUsers.org_owner;
  const clinician = contextUsers.org_clinician;

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Bluebird Breast Center',
      description: 'Synthetic breast imaging team dataset for realistic demo dashboards.',
      owner_id: owner.id,
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create organization');

  const { error: memberError } = await supabaseAdmin.from('organization_members').insert([
    {
      organization_id: data.id,
      user_id: owner.id,
      role: 'owner',
    },
    {
      organization_id: data.id,
      user_id: clinician.id,
      role: 'clinician',
    },
  ]);

  if (memberError) throw memberError;
  return data.id;
}

function buildPatientName(index: number) {
  return `${pick(firstNames)} ${pick(lastNames)} ${index + 1}`;
}

function buildFindings(birads: number, laterality: string, modality: Modality): ReportFinding[] {
  const findingCount = birads >= 4 ? randInt(1, 2) : 1;
  const findings: ReportFinding[] = [];

  for (let i = 0; i < findingCount; i += 1) {
    const size = birads >= 4 ? randInt(9, 28) : randInt(4, 11);
    findings.push({
      laterality,
      location: pick(['Upper outer quadrant', 'Retroareolar region', 'Upper inner quadrant', 'Lower outer quadrant']),
      description: birads >= 4
        ? `Irregular enhancing mass with suspicious margins measuring ${size} mm.`
        : `Stable benign-appearing focal asymmetry measuring ${size} mm.`,
      assessment: birads >= 4
        ? 'Recommend tissue diagnosis due to suspicious imaging features.'
        : 'Benign or probably benign appearance on current exam.',
      evidence: ['Synthetic seeded evidence snippet'],
      finding_type: birads >= 4 ? 'mass' : 'focal_asymmetry',
      size_mm: size,
      per_finding_birads: birads,
      interval_change: birads >= 4 ? 'increased' : 'stable',
      clock_position: `${pick(['2', '4', '7', '10'])}:00`,
      distance_from_nipple_cm: randInt(1, 7),
      quadrant: pick(['UOQ', 'UIQ', 'LOQ', 'LIQ']),
      depth: pick(['anterior', 'middle', 'posterior']),
      shape: birads >= 4 ? pick(['irregular', 'round']) : pick(['oval', 'round']),
      margin: birads >= 4 ? pick(['spiculated', 'indistinct']) : pick(['circumscribed', 'obscured']),
      ultrasound_features: modality === 'ultrasound' ? 'Hypoechoic lesion with posterior shadowing.' : undefined,
      mri_features: modality === 'mri' ? 'Rapid initial enhancement with washout kinetics.' : undefined,
    });
  }

  return findings;
}

function buildRecommendations(birads: number): ReportRecommendation[] {
  if (birads >= 5) {
    return [
      { action: 'Urgent biopsy', timeframe: 'Within 1 week', evidence: ['Synthetic seeded evidence'] },
      { action: 'Surgical oncology referral', timeframe: 'Immediate', evidence: ['High suspicion imaging pattern'] },
    ];
  }

  if (birads === 4) {
    return [
      { action: 'Core needle biopsy', timeframe: 'Within 2 weeks', evidence: ['Suspicious mass characteristics'] },
    ];
  }

  if (birads === 3) {
    return [
      { action: 'Short interval follow-up imaging', timeframe: '6 months', evidence: ['Probably benign finding'] },
    ];
  }

  return [
    { action: 'Routine annual screening', timeframe: '12 months', evidence: ['No suspicious interval change'] },
  ];
}

function pickBirads(reportIndex: number, reportCount: number) {
  if (reportIndex === reportCount - 1 && rng() > 0.6) return pick([4, 5]);
  if (reportIndex === 0) return pick([1, 2, 3]);
  return pick([2, 3, 4]);
}

function buildReportStatus(reportIndex: number, reportCount: number): ReportStatus {
  if (reportIndex < Math.max(2, reportCount - 1)) return 'completed';
  return pick<ReportStatus>(['completed', 'processing', 'failed', 'pending']);
}

async function uploadFakePdf(userId: string, patientId: string, filename: string) {
  const storagePath = `${userId}/${patientId}/${filename}`;
  const pdf = makePdfBuffer(`Synthetic report: ${filename}`);
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, pdf, { contentType: 'application/pdf', upsert: true });

  if (error) throw error;
  return { storagePath, fileSize: pdf.length };
}

async function seedPatientsAndReports(context: SeedContext) {
  let patientOrdinal = 0;
  let totalPatients = 0;
  let totalReports = 0;
  let totalTreatments = 0;

  for (const seedUser of seedUsers) {
    const authUser = context.users[seedUser.key];
    const organizationId = seedUser.key === 'solo_user' ? null : context.organizationId;

    for (let patientIndex = 0; patientIndex < seedUser.patientCount; patientIndex += 1) {
      patientOrdinal += 1;
      totalPatients += 1;

      const gender = pick<Gender>(['Female', 'Female', 'Female', 'Male', 'Other']);
      const stage = pick(stages);
      const age = randInt(34, 78);
      const birthDate = addDays(TODAY, -(age * 365 + randInt(0, 200)));
      const diagnosisDate = addDays(addMonths(TODAY, -randInt(4, 46)), -randInt(0, 24));
      const patientCreatedAt = addDays(diagnosisDate, randInt(0, 12));
      const patientName = buildPatientName(patientOrdinal);
      const erStatus: Biomarker = pick(['Positive', 'Positive', 'Negative', 'Unknown']);
      const prStatus: Biomarker = pick(['Positive', 'Negative', 'Unknown']);
      const her2Status: Biomarker = pick(['Negative', 'Positive', 'Unknown']);

      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .insert({
          created_by: authUser.id,
          organization_id: organizationId,
          full_name: patientName,
          date_of_birth: isoDate(birthDate),
          gender,
          ethnicity: pick(ethnicities),
          diagnosis_date: isoDate(diagnosisDate),
          cancer_type: pick(cancerTypes),
          cancer_stage: stage,
          tumor_size_cm: Number((randInt(4, 48) / 10).toFixed(1)),
          lymph_node_positive: stage === 'Stage III' || stage === 'Stage IV' ? rng() > 0.3 : rng() > 0.75,
          er_status: erStatus,
          pr_status: prStatus,
          her2_status: her2Status,
          menopausal_status: age > 52 ? 'Postmenopausal' : pick(['Premenopausal', 'Perimenopausal']),
          initial_treatment_plan: pick([
            'Image-guided biopsy followed by multidisciplinary review.',
            'Neoadjuvant chemotherapy followed by surgery.',
            'Lumpectomy with adjuvant radiation planning.',
            'Short-interval surveillance pending biopsy correlation.',
          ]),
          created_at: isoTimestamp(patientCreatedAt),
          updated_at: isoTimestamp(patientCreatedAt),
        })
        .select('id')
        .single();

      if (patientError || !patient) throw patientError ?? new Error(`Failed to create patient ${patientName}`);

      const reportCount = randInt(2, 10);
      let latestActivityAt = patientCreatedAt;

      for (let reportIndex = 0; reportIndex < reportCount; reportIndex += 1) {
        totalReports += 1;
        const examDate = addMonths(addDays(diagnosisDate, -randInt(10, 30)), reportIndex * randInt(3, 8));
        const createdAt = addDays(examDate, randInt(0, 5));
        if (createdAt > latestActivityAt) latestActivityAt = createdAt;

        const modality = pick(modalities);
        const status = buildReportStatus(reportIndex, reportCount);
        const birads = status === 'completed' ? pickBirads(reportIndex, reportCount) : null;
        const laterality = pick(['left', 'right', 'bilateral']);
        const filename = `${slugify(patientName)}-${isoDate(examDate)}-${modality}-${reportIndex + 1}.pdf`;
        const uploaded = await uploadFakePdf(authUser.id, patient.id, filename);

        const findings = birads ? buildFindings(birads, laterality, modality) : null;
        const recommendations = birads ? buildRecommendations(birads) : null;

        const reportInsert = {
          created_by: authUser.id,
          organization_id: organizationId,
          patient_id: patient.id,
          filename,
          file_url: uploaded.storagePath,
          file_size: uploaded.fileSize,
          status,
          summary: birads
            ? `Synthetic ${modality} exam with BI-RADS ${birads}. Seeded for realistic dashboard and timeline coverage.`
            : `Synthetic ${modality} exam currently marked ${status}.`,
          exam_date: isoDate(examDate),
          modality,
          contrast: modality === 'mri' ? pick<Contrast>(['with', 'without']) : 'not_applicable',
          exam_type: pick(['Screening', 'Diagnostic Follow-up', 'Pre-op Staging', 'Post-treatment Surveillance']),
          exam_laterality: laterality,
          exam_evidence: ['Synthetic seeded exam metadata'],
          birads_value: birads,
          birads_confidence: birads ? pick(['medium', 'high']) : null,
          birads_evidence: birads ? ['Synthetic BI-RADS evidence'] : null,
          breast_density_value: birads ? pick(densities) : null,
          breast_density_evidence: birads ? ['Synthetic density evidence'] : null,
          clinical_history: pick([
            'Palpable concern with prior benign biopsy history.',
            'Short interval follow-up after prior probably benign assessment.',
            'Newly diagnosed breast cancer with staging workup.',
            'Post-lumpectomy surveillance with dense breast tissue.',
          ]),
          risk_factors: pickMany(riskFactors, randInt(1, 3)),
          comparison_prior_exam_date: isoDate(addMonths(examDate, -randInt(6, 18))),
          comparison_dates: [isoDate(addMonths(examDate, -12)), isoDate(addMonths(examDate, -24))],
          comparison_evidence: ['Compared against prior seeded studies'],
          findings,
          lymph_nodes: birads && birads >= 4 ? [{
            laterality: laterality === 'bilateral' ? 'left' : laterality,
            region: 'axillary',
            abnormal: rng() > 0.4,
            morphology: 'cortical thickening',
            size_mm: randInt(8, 16),
            evidence: ['Synthetic seeded lymph node evidence'],
          }] : [],
          skin_nipple_changes: birads && birads >= 4 && rng() > 0.55 ? ['Mild nipple retraction'] : [],
          implants: rng() > 0.88 ? { present: true, type: 'silicone', integrity: 'intact' } : null,
          post_surgical_changes: reportIndex > 1 && rng() > 0.7 ? ['Postsurgical scar in upper outer quadrant'] : [],
          multifocal: birads ? birads >= 4 && rng() > 0.6 : null,
          multicentric: birads ? birads >= 5 && rng() > 0.75 : null,
          bilateral_disease: birads ? laterality === 'bilateral' && birads >= 4 : null,
          disease_extent: birads && birads >= 4 ? pick([
            'Dominant lesion with adjacent non-mass enhancement.',
            'Single index lesion without chest wall invasion.',
            'Segmental enhancement spanning upper outer quadrant.',
          ]) : null,
          recommendations,
          management: birads ? {
            biopsy_recommended: birads >= 4,
            recommended_modality: birads >= 4 ? pick(['ultrasound', 'mri']) : 'mammography',
            follow_up_interval: birads >= 4 ? '2 weeks' : '12 months',
          } : null,
          pathology_correlation: birads && birads >= 4 ? 'Imaging-pathology correlation advised after biopsy.' : null,
          red_flags: birads && birads >= 5 ? ['Highly suspicious spiculated mass'] : [],
          processing_time_ms: status === 'completed' ? randInt(1800, 8200) : null,
          raw_text: `Synthetic seeded report narrative for ${patientName} on ${isoDate(examDate)}.`,
          analysis_json: {
            seeded: true,
            seed_marker: SEED_MARKER,
            generated_at: isoTimestamp(createdAt),
          },
          created_at: isoTimestamp(createdAt),
          updated_at: isoTimestamp(addDays(createdAt, randInt(0, 4))),
        };

        const { error: reportError } = await supabaseAdmin.from('radiology_reports').insert(reportInsert);
        if (reportError) throw reportError;
      }

      const treatmentCount = randInt(1, 3);
      for (let treatmentIndex = 0; treatmentIndex < treatmentCount; treatmentIndex += 1) {
        totalTreatments += 1;
        const treatmentStart = addMonths(diagnosisDate, treatmentIndex * randInt(2, 5));
        const treatmentEnd = addDays(treatmentStart, randInt(20, 120));
        if (treatmentEnd > latestActivityAt) latestActivityAt = treatmentEnd;

        const treatmentRecord: TreatmentRecord = {
          created_by: authUser.id,
          organization_id: organizationId,
          patient_id: patient.id,
          treatment_type: pick(treatmentTypes),
          treatment_start_date: isoDate(treatmentStart),
          treatment_end_date: rng() > 0.2 ? isoDate(treatmentEnd) : null,
          medication_details: pick([
            'Weekly paclitaxel x12 planned.',
            'Anastrozole daily after surgery.',
            'Trastuzumab maintenance per infusion schedule.',
            'Whole breast irradiation with boost planned.',
          ]),
          treatment_outcome: pick(treatmentOutcomes),
          side_effects: pick([
            'Mild fatigue and hot flashes.',
            'Expected skin erythema, improving.',
            'Transient nausea managed with antiemetics.',
            'No major toxicity reported.',
          ]),
          follow_up_date: isoDate(addDays(treatmentEnd, randInt(21, 120))),
          created_at: isoTimestamp(treatmentStart),
          updated_at: isoTimestamp(treatmentEnd),
        };

        const { error: treatmentError } = await supabaseAdmin.from('treatment_records').insert(treatmentRecord);
        if (treatmentError) throw treatmentError;
      }

      const { error: patientUpdateError } = await supabaseAdmin
        .from('patients')
        .update({ updated_at: isoTimestamp(latestActivityAt) })
        .eq('id', patient.id);
      if (patientUpdateError) throw patientUpdateError;
    }
  }

  return { totalPatients, totalReports, totalTreatments };
}

function printPlan() {
  const totalPatients = seedUsers.reduce((sum, user) => sum + user.patientCount, 0);
  console.log(`Seed marker: ${SEED_MARKER}`);
  console.log(`Users: ${seedUsers.length}`);
  console.log(`Organization users: 2`);
  console.log(`Solo users: 1`);
  console.log(`Patients planned: ${totalPatients}`);
  console.log(`Reports per patient: randomized between 2 and 10`);
  console.log(`Treatments per patient: randomized between 1 and 3`);
  console.log(`Password for seeded users: ${SEED_PASSWORD}`);
  for (const user of seedUsers) {
    console.log(`- ${user.email} (${user.fullName}) -> ${user.patientCount} patients`);
  }
}

async function main() {
  if (DRY_RUN) {
    printPlan();
    return;
  }

  console.log('Cleaning prior fake dataset...');
  await cleanupExistingSeedData(seedUsers.map((user) => user.email));

  console.log('Creating auth users + profile rows...');
  const users = await createSeedAuthUsers();

  console.log('Creating organization + memberships...');
  const organizationId = await createOrganization(users);

  console.log('Creating patients, reports, treatments, PDFs...');
  const counts = await seedPatientsAndReports({ organizationId, users });

  console.log('Seed complete.');
  console.log(`Organization: Bluebird Breast Center (${organizationId})`);
  console.log(`Users created: ${Object.keys(users).length}`);
  console.log(`Patients created: ${counts.totalPatients}`);
  console.log(`Reports created: ${counts.totalReports}`);
  console.log(`Treatments created: ${counts.totalTreatments}`);
  console.log(`Login password: ${SEED_PASSWORD}`);
  for (const user of seedUsers) {
    console.log(`- ${user.fullName}: ${user.email}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exit(1);
});
