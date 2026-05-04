'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const SeatType = sequelize.define('SeatType', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.ENUM('general', 'preferente', 'vip', 'palco'),
    allowNull: false,
    unique: true,
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#808080',
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/,
    },
  },
  multiplier: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 1.00,
    validate: { min: 0.01 },
  },
}, {
  tableName: 'seat_types',
  underscored: true,
  timestamps: false,
});

module.exports = SeatType;
