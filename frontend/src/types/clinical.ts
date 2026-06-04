export interface Finding {
  region: string;
  type: string;
  measure: string;
  conf: number;
}

export interface PatientRow {
  id: string;
  name: string;
  age: number;
  sex: string;
  initials: string;
  accession: string;
  modality: string;
  birads: string;
  status: string;
  date: string;
  size: string;
  side: string;
  density: string;
  impression: string;
  findings: Finding[];
}

export const SAMPLE_PATIENTS: PatientRow[] = [
  {
    id: 'PT-04827-RR', name: 'Dana Whitfield', age: 54, sex: 'F', initials: 'DW',
    accession: 'ACC-9931204', modality: 'Mammography', birads: '4B', status: 'followup',
    date: '2026-05-21', size: '14.2 mm', side: 'Left', density: 'C — heterogeneous',
    impression: 'Irregular spiculated mass in the left upper outer quadrant. Features are suspicious; tissue diagnosis recommended.',
    findings: [
      { region: 'Left UOQ',    type: 'Spiculated mass',          measure: '14.2 mm', conf: 0.96 },
      { region: 'Left axilla', type: 'Enlarged node',            measure: '9.1 mm',  conf: 0.81 },
      { region: 'Bilateral',   type: 'Scattered calcifications', measure: '—',       conf: 0.74 },
    ],
  },
  {
    id: 'PT-04791-RR', name: 'Marisol Reyes', age: 47, sex: 'F', initials: 'MR',
    accession: 'ACC-9930887', modality: 'Ultrasound', birads: '3', status: 'reviewed',
    date: '2026-05-20', size: '6.8 mm', side: 'Right', density: 'B — scattered',
    impression: 'Well-circumscribed oval hypoechoic nodule, likely fibroadenoma. Short-interval follow-up advised.',
    findings: [
      { region: "Right 10 o'clock", type: 'Oval nodule',   measure: '6.8 mm', conf: 0.93 },
      { region: 'Right breast',     type: 'Simple cyst',   measure: '4.2 mm', conf: 0.88 },
    ],
  },
  {
    id: 'PT-04763-RR', name: 'Aisha Bello', age: 61, sex: 'F', initials: 'AB',
    accession: 'ACC-9930541', modality: 'MRI', birads: '5', status: 'urgent',
    date: '2026-05-20', size: '22.5 mm', side: 'Left', density: 'D — extremely dense',
    impression: 'Rim-enhancing mass with washout kinetics, highly suspicious for malignancy. Urgent biopsy.',
    findings: [
      { region: 'Left lower inner', type: 'Enhancing mass',  measure: '22.5 mm', conf: 0.98 },
      { region: 'Left chest wall',  type: 'Skin thickening', measure: '—',       conf: 0.79 },
    ],
  },
  {
    id: 'PT-04802-RR', name: 'Joan Petrakis', age: 58, sex: 'F', initials: 'JP',
    accession: 'ACC-9931102', modality: 'Mammography', birads: '2', status: 'reviewed',
    date: '2026-05-19', size: '—', side: '—', density: 'A — fatty',
    impression: 'Benign calcifications, stable compared to prior. Routine screening interval.',
    findings: [
      { region: 'Right breast', type: 'Benign calcifications', measure: '—', conf: 0.91 },
    ],
  },
  {
    id: 'PT-04755-RR', name: 'Teresa Lindqvist', age: 49, sex: 'F', initials: 'TL',
    accession: 'ACC-9930498', modality: 'Mammography', birads: '4A', status: 'processing',
    date: '2026-05-19', size: '8.0 mm', side: 'Right', density: 'C — heterogeneous',
    impression: 'Focal asymmetry with associated microcalcifications. Low suspicion; biopsy to confirm.',
    findings: [
      { region: 'Right UOQ', type: 'Focal asymmetry',       measure: '8.0 mm',  conf: 0.84 },
      { region: 'Right UOQ', type: 'Microcalcifications',   measure: 'cluster', conf: 0.77 },
    ],
  },
  {
    id: 'PT-04710-RR', name: 'Grace Okonkwo', age: 52, sex: 'F', initials: 'GO',
    accession: 'ACC-9930233', modality: 'Ultrasound', birads: '3', status: 'draft',
    date: '2026-05-18', size: '5.1 mm', side: 'Left', density: 'B — scattered',
    impression: 'Probably benign hypoechoic focus. Six-month follow-up ultrasound.',
    findings: [
      { region: "Left 2 o'clock", type: 'Hypoechoic focus', measure: '5.1 mm', conf: 0.86 },
    ],
  },
];
