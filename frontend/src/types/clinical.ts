/**
 * Frontend-only clinical display types for the worklist table view.
 * PatientRow is a flattened view model combining patient and report data for tabular display.
 * Finding is an individual imaging result detail.
 * These types are distinct from the shared/ API types and are used for UI presentation only.
 */
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
  filename: string;
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
