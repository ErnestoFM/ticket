'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
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
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  status: {
    type: DataTypes.ENUM('held', 'confirmed', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'held',
  },
}, {
  tableName: 'reservations',
  underscored: true,
});

module.exports = Reservation;
