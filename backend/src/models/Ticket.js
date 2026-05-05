'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'user_id',
  },
  eventId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'event_id',
  },
  seatId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'seat_id',
  },
  reservationId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    unique: true,
    field: 'reservation_id',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  paymentMethod: {
    type: DataTypes.ENUM('stripe', 'paypal', 'mock'),
    allowNull: false,
    field: 'payment_method',
  },
  paymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'payment_intent_id',
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code',
  },
  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_path',
  },
  whatsappSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'whatsapp_sent',
  },
}, {
  tableName: 'tickets',
  underscored: true,
});

module.exports = Ticket;
