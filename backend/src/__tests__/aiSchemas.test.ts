import {
  ReportAnalysisSchema,
  ConsolidationSchema,
  ComparisonSchema,
  BiradsTrendSchema,
} from '../services/aiSchemas.js';

describe('aiSchemas', () => {
  describe('ReportAnalysisSchema', () => {
    const valid = {
      summary: 'Stable benign findings.',
      exam_date: '2025-06-01',
      modality: 'mammography',
      contrast: 'not_applicable',
      exam_type: 'screening',
      laterality: 'bilateral',
      breast_density: 'B',
      birads_value: 2,
      birads_confidence: 'high',
      clinical_history: 'Routine screening.',
      risk_factors: [],
      prior_exam_date: '2025-01-01',
      comparison_dates: ['2025-01-01'],
      findings: [
        {
          laterality: 'left',
          location: 'upper outer quadrant',
          description: 'stable cyst',
          assessment: 'benign',
          evidence: ['simple cyst noted'],
          finding_type: 'mass',
          size_mm: 5,
          per_finding_birads: 2,
          interval_change: 'stable',
          clock_position: null,
          distance_from_nipple_cm: null,
          quadrant: null,
          depth: null,
          shape: null,
          margin: null,
          calcification_morphology: null,
          calcification_distribution: null,
          ultrasound_features: null,
          mri_features: null,
        },
      ],
      lymph_nodes: [],
      skin_nipple_changes: [],
      implants: null,
      post_surgical_changes: [],
      multifocal: false,
      multicentric: false,
      bilateral_disease: false,
      disease_extent: null,
      recommendations: [
        { action: 'routine screening', timeframe: '12 months', evidence: [] },
      ],
      management: {
        biopsy_recommended: false,
        recommended_modality: null,
        follow_up_interval: '12 months',
      },
      pathology_correlation: null,
      red_flags: [],
    };

    it('parses a well-formed analysis payload', () => {
      const result = ReportAnalysisSchema.parse(valid);
      expect(result.birads_value).toBe(2);
      expect(result.findings).toHaveLength(1);
    });

    it('accepts a null prior_exam_date', () => {
      expect(() =>
        ReportAnalysisSchema.parse({ ...valid, prior_exam_date: null })
      ).not.toThrow();
    });

    it('rejects an invalid birads_confidence enum value', () => {
      const res = ReportAnalysisSchema.safeParse({
        ...valid,
        birads_confidence: 'maybe',
      });
      expect(res.success).toBe(false);
    });

    it('rejects a non-numeric birads_value', () => {
      const res = ReportAnalysisSchema.safeParse({
        ...valid,
        birads_value: 'two',
      });
      expect(res.success).toBe(false);
    });

    it('rejects a missing required field', () => {
      const { summary, ...withoutSummary } = valid;
      void summary;
      const res = ReportAnalysisSchema.safeParse(withoutSummary);
      expect(res.success).toBe(false);
    });
  });

  describe('ConsolidationSchema', () => {
    it('parses a well-formed consolidation payload', () => {
      const result = ConsolidationSchema.parse({
        overall_summary: 'No interval change.',
        key_trends: ['stable density'],
        overall_birads: 2,
        clinical_implications: 'Continue routine screening.',
        timeline: [
          {
            exam_date: '2025-01-01',
            modality: 'mammography',
            birads: 2,
            key_change: 'stable',
          },
        ],
        pathology_correlation: null,
      });
      expect(result.key_trends).toContain('stable density');
    });

    it('rejects key_trends that is not an array of strings', () => {
      const res = ConsolidationSchema.safeParse({
        overall_summary: 'x',
        key_trends: 'stable',
        overall_birads: 2,
        clinical_implications: 'y',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('ComparisonSchema', () => {
    it('parses a well-formed comparison payload', () => {
      const result = ComparisonSchema.parse({
        treatment_responses: [
          { treatment_type: 'chemotherapy', assessment: 'partial response' },
        ],
        recommendations: ['continue current regimen'],
        evidence_summary: 'Decreased mass size on imaging.',
      });
      expect(result.treatment_responses[0].treatment_type).toBe('chemotherapy');
    });

    it('rejects a treatment_response missing assessment', () => {
      const res = ComparisonSchema.safeParse({
        treatment_responses: [{ treatment_type: 'chemotherapy' }],
        recommendations: [],
        evidence_summary: '',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('BiradsTrendSchema', () => {
    it('parses a well-formed trend payload', () => {
      const result = BiradsTrendSchema.parse({
        trend: 'worsening',
        direction: 'up',
        significance: 'high',
        clinical_note: 'BI-RADS increased from 2 to 4.',
      });
      expect(result.trend).toBe('worsening');
    });

    it('rejects an out-of-range trend value', () => {
      const res = BiradsTrendSchema.safeParse({
        trend: 'unknown',
        direction: 'up',
        significance: 'high',
        clinical_note: '',
      });
      expect(res.success).toBe(false);
    });

    it('rejects an out-of-range direction value', () => {
      const res = BiradsTrendSchema.safeParse({
        trend: 'stable',
        direction: 'sideways',
        significance: 'low',
        clinical_note: '',
      });
      expect(res.success).toBe(false);
    });
  });
});
