'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_NAME_TEST = process.env.DB_NAME_TEST || 'ticketmaster_test';
process.env.DB_USER = process.env.DB_USER || 'ticketmaster';
process.env.DB_PASS = process.env.DB_PASS || 'ticketmaster_pass';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_chars!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_at_least_32!';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN = 'test_token';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.PAYPAL_CLIENT_ID = 'test_paypal_client';
process.env.PAYPAL_CLIENT_SECRET = 'test_paypal_secret';
process.env.PAYPAL_MODE = 'sandbox';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3001';
process.env.RESERVATION_TTL = '60';

// Mock Twilio globally
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'SM_test_123' }),
    },
  }));
});

// Mock PDFKit to avoid file system operations in tests
jest.mock('pdfkit', () => {
  const { EventEmitter } = require('events');
  return jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    const doc = Object.assign(emitter, {
      pipe: jest.fn(),
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      end: jest.fn(function () { this.emit('end'); }),
      page: { width: 420, height: 595 },
    });
    return doc;
  });
});

let sequelize;
let redis;

beforeAll(async () => {
  try {
    sequelize = require('../src/config/database');
    redis = require('../src/config/redis');

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('[Test Setup] Database synced');
  } catch (err) {
    console.warn('[Test Setup] DB connection failed (running in offline mode):', err.message);
  }
});

beforeEach(async () => {
  if (!sequelize) return;
  try {
    const { Ticket, Reservation, Event, Seat, Venue, User, SeatType } = require('../src/models');
    await Ticket.destroy({ where: {}, force: true });
    await Reservation.destroy({ where: {}, force: true });
    await Event.destroy({ where: {}, force: true });
    await Seat.destroy({ where: {}, force: true });
    await Venue.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await SeatType.destroy({ where: {}, force: true });
  } catch (err) {
    // Tables may not exist in offline mode
  }
});

afterAll(async () => {
  if (sequelize) {
    try {
      await sequelize.close();
    } catch (_) {}
  }
  if (redis) {
    try {
      redis.disconnect();
    } catch (_) {}
  }
});
