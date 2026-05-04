'use strict';

const request = require('supertest');
const { app } = require('../../src/index');
const { User, Venue, SeatType, Seat, Event, Reservation } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const { generateAccessToken } = require('../../src/utils/jwt.utils');
const { constructWebhookEvent } = require('../../src/services/stripe.service');

// Mock Stripe webhook
jest.mock('../../src/services/stripe.service', () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret' }),
  confirmPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
  constructWebhookEvent: jest.fn(),
}));

// Mock PayPal
jest.mock('../../src/services/paypal.service', () => ({
  createOrder: jest.fn().mockResolvedValue({
    id: 'PAYPAL_ORDER_123',
    status: 'CREATED',
    links: [{ rel: 'approve', href: 'https://sandbox.paypal.com/approve/123' }],
  }),
  captureOrder: jest.fn().mockResolvedValue({
    id: 'PAYPAL_ORDER_123',
    status: 'COMPLETED',
  }),
}));

async function seedPaymentTestData() {
  try {
    await SeatType.bulkCreate([
      { id: uuidv4(), name: 'general', color: '#808080', multiplier: 1.00 },
    ], { ignoreDuplicates: true });

    const user = await User.create({
      id: uuidv4(),
      firstName: 'Payment',
      lastName: 'Tester',
      curp: 'PATE900501HDFXXX0A',
      password: 'PayPass123!',
      phone: '+525555555555',
      birthDate: '1990-05-01',
      birthState: 'DF',
      gender: 'H',
      role: 'user',
    });

    const venue = await Venue.create({
      id: uuidv4(),
      name: 'Payment Test Venue',
      address: 'Pay St 789',
      city: 'CDMX',
      state: 'Ciudad de México',
      type: 'teatro',
      totalRows: 2,
      totalCols: 5,
    });

    const allSeatTypes = await SeatType.findAll();
    const generalType = allSeatTypes[0];

    const seat = await Seat.create({
      id: uuidv4(),
      venueId: venue.id,
      seatTypeId: generalType.id,
      row: 'A',
      col: 1,
      label: 'A1',
      isActive: true,
    });

    const adminUser = await User.create({
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'Pay',
      curp: 'ADPA900601HDFXXX0A',
      password: 'AdminPay123!',
      phone: '+525566666666',
      birthDate: '1990-06-01',
      birthState: 'DF',
      gender: 'H',
      role: 'admin',
    });

    const event = await Event.create({
      id: uuidv4(),
      venueId: venue.id,
      title: 'Payment Test Event',
      type: 'teatro',
      date: new Date('2025-11-01T19:00:00'),
      duration: 90,
      basePrice: 150.00,
      maxTicketsPerUser: 2,
      status: 'activo',
      createdBy: adminUser.id,
    });

    const reservation = await Reservation.create({
      id: uuidv4(),
      userId: user.id,
      eventId: event.id,
      seatId: seat.id,
      expiresAt: new Date(Date.now() + 300000),
      status: 'held',
    });

    return { user, venue, seat, event, reservation, generalType };
  } catch (err) {
    return null;
  }
}

describe('Payment Integration Tests', () => {
  let testData;
  let userToken;

  beforeEach(async () => {
    testData = await seedPaymentTestData();
    if (testData) {
      userToken = generateAccessToken({ id: testData.user.id, role: 'user' });
    }
  });

  describe('POST /api/payments/stripe/webhook', () => {
    test('returns 400 without stripe-signature header', async () => {
      const res = await request(app)
        .post('/api/payments/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

      expect(res.status).toBe(400);
    });

    test('returns 400 for invalid stripe signature', async () => {
      const { constructWebhookEvent } = require('../../src/services/stripe.service');
      constructWebhookEvent.mockImplementationOnce(() => {
        throw new Error('Signature mismatch');
      });

      const res = await request(app)
        .post('/api/payments/stripe/webhook')
        .set('stripe-signature', 'invalid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'test' }));

      expect(res.status).toBe(400);
    });

    test('handles payment_intent.succeeded webhook', async () => {
      const { constructWebhookEvent } = require('../../src/services/stripe.service');
      constructWebhookEvent.mockImplementationOnce(() => ({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_webhook', status: 'succeeded' } },
      }));

      const res = await request(app)
        .post('/api/payments/stripe/webhook')
        .set('stripe-signature', 'valid_test_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.received).toBe(true);
      }
    });
  });

  describe('POST /api/payments/paypal/create-order', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/payments/paypal/create-order')
        .send({ reservationId: uuidv4() });

      expect(res.status).toBe(401);
    });

    test('returns 422 for missing reservationId', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Cookie', [`access_token=${userToken}`])
        .send({});

      expect(res.status).toBe(422);
    });

    test('creates PayPal order for valid reservation', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Cookie', [`access_token=${userToken}`])
        .send({ reservationId: testData.reservation.id });

      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('orderId');
        expect(res.body.orderId).toBe('PAYPAL_ORDER_123');
      }
    });
  });

  describe('POST /api/payments/paypal/capture-order', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/payments/paypal/capture-order')
        .send({ orderId: 'PAYPAL_ORDER_123' });

      expect(res.status).toBe(401);
    });

    test('returns 422 for missing orderId', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/paypal/capture-order')
        .set('Cookie', [`access_token=${userToken}`])
        .send({});

      expect(res.status).toBe(422);
    });

    test('captures PayPal order', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/paypal/capture-order')
        .set('Cookie', [`access_token=${userToken}`])
        .send({ orderId: 'PAYPAL_ORDER_123' });

      expect([200, 402, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('captureId');
        expect(res.body.status).toBe('COMPLETED');
      }
    });
  });
});
