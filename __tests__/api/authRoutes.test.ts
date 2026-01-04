import request from 'supertest';
import express from 'express';
import authRoutes from '../backend/api/authRoutes';

// This is a simplified backend test
// In production, you'd use a test database

describe('Auth API Endpoints', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
    });

    describe('POST /api/auth/send-otp', () => {
        test('should reject request without mobile number', async () => {
            const response = await request(app)
                .post('/api/auth/send-otp')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });

        test('should reject invalid mobile format', async () => {
            const response = await request(app)
                .post('/api/auth/send-otp')
                .send({ mobile: '123' });

            expect(response.status).toBe(400);
            expect(response.body.errors).toHaveProperty('mobile');
        });

        test('should accept valid Indian mobile number', async () => {
            const response = await request(app)
                .post('/api/auth/send-otp')
                .send({ mobile: '919876543210' });

            // May be 429 due to rate limiting or 200
            expect([200, 429]).toContain(response.status);
        });
    });

    describe('POST /api/auth/verify-otp', () => {
        test('should require both mobile and OTP', async () => {
            const response = await request(app)
                .post('/api/auth/verify-otp')
                .send({ mobile: '919876543210' });

            expect(response.status).toBe(400);
        });

        test('should validate OTP format', async () => {
            const response = await request(app)
                .post('/api/auth/verify-otp')
                .send({ mobile: '919876543210', otp: '12' });

            expect(response.status).toBe(400);
            expect(response.body.errors).toHaveProperty('otp');
        });
    });
});
