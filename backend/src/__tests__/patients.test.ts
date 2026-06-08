import request from 'supertest';
import express from 'express';

jest.mock('../services/supabaseClient', () => ({
  supabaseAdmin: {},
  createUserClient: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    req.userId = 'test-user-id';
    req.accessToken = req.headers.authorization.slice(7);
    next();
  },
}));

jest.mock('../controllers/patientController', () => {
  const { validationResult } = require('express-validator');
  return {
    createPatient: async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      res.status(201).json({ id: 'new-patient' });
    },
    listPatients: async (_req: any, res: any) => res.json([]),
    getPatient: async (_req: any, res: any) => res.json({}),
    updatePatient: async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      res.json({});
    },
    deletePatient: async (_req: any, res: any) => res.status(204).send(),
    exportPatientBundle: async (_req: any, res: any) => res.json({}),
  };
});

// eslint-disable-next-line import/first
import patientsRouter from '../routes/patients';
import { errorHandler } from '../middleware/errorHandler';

describe('Patients API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/patients', patientsRouter);
    app.use(errorHandler);
  });

  describe('POST /api/patients', () => {
    it('should validate full_name is required', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          date_of_birth: '1980-01-01',
          gender: 'Female',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate date_of_birth format', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: 'invalid-date',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate diagnosis_date format', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: '1980-01-01',
          diagnosis_date: 'invalid-date',
          cancer_type: 'Invasive Ductal Carcinoma',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate gender values', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: '1980-01-01',
          gender: 'Invalid',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate cancer_stage values', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: '1980-01-01',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
          cancer_stage: 'Stage 99',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate tumor_size_cm is positive', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: '1980-01-01',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
          tumor_size_cm: -5,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate biomarker status values', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({
          full_name: 'Jane Doe',
          date_of_birth: '1980-01-01',
          diagnosis_date: '2024-01-01',
          cancer_type: 'Invasive Ductal Carcinoma',
          er_status: 'Invalid',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PATCH /api/patients/:id', () => {
    it('should accept optional updates', async () => {
      const response = await request(app)
        .patch('/api/patients/valid-uuid-here')
        .send({
          full_name: 'Updated Name',
        })
        .set('Authorization', 'Bearer token');

      // Should not return validation error for missing fields
      expect(response.status).not.toBe(422);
    });
  });
});
