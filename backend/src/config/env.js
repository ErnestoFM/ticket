'use strict';

const requiredVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const varName of requiredVars) {
  if (!process.env[varName] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.NODE_ENV === 'test'
      ? (process.env.DB_NAME_TEST || 'ticketmaster_test')
      : (process.env.DB_NAME || 'ticketmaster'),
    user: process.env.DB_USER || 'ticketmaster',
    pass: process.env.DB_PASS || 'ticketmaster_pass',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_key_at_least_32_chars_long!',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_at_least_32!',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development',
    reservationTtl: parseInt(process.env.RESERVATION_TTL || '300', 10),
  },
};
