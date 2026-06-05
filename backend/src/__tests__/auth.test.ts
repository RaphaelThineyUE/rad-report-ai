import request from 'supertest';
import express from 'express';

describe('Auth API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
  });

  describe('POST /api/auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
          full_name: 'John Doe',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          full_name: 'John Doe',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should require full_name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password is not empty', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });
  });
});
