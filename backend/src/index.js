'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const env = require('./config/env');
const sequelize = require('./config/database');
const redis = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const { expireReservations } = require('./services/reservation.service');

const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const venueRoutes = require('./routes/venue.routes');
const seatRoutes = require('./routes/seat.routes');
const reservationRoutes = require('./routes/reservation.routes');
const ticketRoutes = require('./routes/ticket.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS - allow frontend and ngrok for dev
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [env.app.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowedOrigins.includes(origin) || origin.includes('ngrok-free.dev') || origin.includes('ngrok.io')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
if (env.app.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for ticket PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// Start reservation cleanup job
let cleanupInterval;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[DB] MySQL connection established');

    if (env.app.nodeEnv !== 'test') {
      await sequelize.sync({ alter: false });
      console.log('[DB] Models synchronized');
    }

    await redis.ping();
    console.log('[Redis] Connection verified');

    // Schedule cleanup every 60 seconds
    cleanupInterval = setInterval(async () => {
      try {
        await expireReservations();
      } catch (err) {
        console.error('[Cleanup] Error expiring reservations:', err.message);
      }
    }, 60 * 1000);

    const server = app.listen(env.app.port, () => {
      console.log(`[Server] Running on port ${env.app.port} (${env.app.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}, shutting down...`);
      clearInterval(cleanupInterval);
      server.close(async () => {
        await sequelize.close();
        redis.disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
