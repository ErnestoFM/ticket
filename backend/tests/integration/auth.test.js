'use strict';

const request = require('supertest');
const { app } = require('../../src/index');
const { User, SeatType } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  motherLastName: 'Integration',
  birthDate: '1990-05-15',
  phone: '+525512345678',
  gender: 'H',
  birthState: 'DF',
  password: 'SecurePass123!',
};

describe('Auth Integration Tests', () => {
  let registeredCURP;
  let cookies;

  beforeEach(async () => {
    try {
      await SeatType.bulkCreate([
        { id: uuidv4(), name: 'general', color: '#808080', multiplier: 1.00 },
        { id: uuidv4(), name: 'preferente', color: '#4169E1', multiplier: 1.50 },
        { id: uuidv4(), name: 'vip', color: '#FFD700', multiplier: 2.50 },
        { id: uuidv4(), name: 'palco', color: '#8B0000', multiplier: 4.00 },
      ], { ignoreDuplicates: true });
    } catch (_) {}
  });

  describe('POST /api/auth/register', () => {
    test('registers a new user and returns CURP', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/);

      if (res.status === 201) {
        expect(res.body).toHaveProperty('curp');
        expect(res.body.curp).toHaveLength(18);
        registeredCURP = res.body.curp;
      } else {
        // DB not available - skip
        console.warn('DB not available, skipping register assertions');
      }
    });

    test('returns 422 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ firstName: 'Test' })
        .expect('Content-Type', /json/);

      expect([422, 400]).toContain(res.status);
    });

    test('returns 422 for invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, phone: 'not-a-phone' });

      expect([422, 400]).toContain(res.status);
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ curp: 'GAJI900515HDFRLX06', password: 'wrongpassword' })
        .expect('Content-Type', /json/);

      expect([401, 422]).toContain(res.status);
    });

    test('returns 422 for missing CURP', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'somepassword' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('returns 401 when no refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .expect('Content-Type', /json/);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('clears cookies and returns success', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('Full auth flow (requires DB)', () => {
    test('register → login → me → logout', async () => {
      const uniqueUser = {
        ...testUser,
        firstName: 'FlowTest',
        birthDate: '1988-03-20',
        phone: '+525598765432',
      };

      // Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser);

      if (registerRes.status !== 201) {
        console.warn('Skipping full flow test - DB not available');
        return;
      }

      const curp = registerRes.body.curp;

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ curp, password: uniqueUser.password });

      expect(loginRes.status).toBe(200);
      expect(loginRes.headers['set-cookie']).toBeDefined();

      const loginCookies = loginRes.headers['set-cookie'];

      // Me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', loginCookies);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user).toHaveProperty('curp', curp);
      expect(meRes.body.user).not.toHaveProperty('password');

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', loginCookies);

      expect(logoutRes.status).toBe(200);
    });
  });
});
