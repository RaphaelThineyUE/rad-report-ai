import request from 'supertest';
import express from 'express';

describe('Patients API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
  });

  describe('POST /api/patients', () => {
    it('should validate full_name is required', async () => {
      const response = await request(app)
        .post('/api/patients')
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
