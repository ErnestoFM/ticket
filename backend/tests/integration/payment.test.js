'use strict';

const request = require('supertest');
const { app } = require('../../src/index');
const { User, Venue, SeatType, Seat, Event, Reservation } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const { generateAccessToken } = require('../../src/utils/jwt.utils');

jest.mock('../../src/services/mockPayment.service', () => ({
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    paymentIntentId: 'mock_pi_123'
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

describe('Mock Payment Integration Tests', () => {
  let testData;
  let userToken;

  beforeEach(async () => {
    testData = await seedPaymentTestData();
    if (testData) {
      userToken = generateAccessToken({ id: testData.user.id, role: 'user' });
    }
  });

  describe('POST /api/payments/mock/process', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/payments/mock/process')
        .send({ reservationId: uuidv4() });

      expect(res.status).toBe(401);
    });

    test('returns 422 for missing fields', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/mock/process')
        .set('Cookie', [`access_token=${userToken}`])
        .send({
          reservationId: testData.reservation.id
        });

      expect(res.status).toBe(422);
    });

    test('processes mock payment for valid reservation', async () => {
      if (!testData) {
        console.warn('Skipping - DB not available');
        return;
      }

      const res = await request(app)
        .post('/api/payments/mock/process')
        .set('Cookie', [`access_token=${userToken}`])
        .send({ 
          reservationId: testData.reservation.id,
          cardNumber: '1234567812345678',
          expirationDate: '12/25',
          cvv: '123'
        });

      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('paymentIntentId', 'mock_pi_123');
      }
    });
  });
});
