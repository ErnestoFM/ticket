'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  venueId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'venue_id',
  },
  seatTypeId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'seat_type_id',
  },
  row: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: { notEmpty: true },
  },
  col: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  label: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: { notEmpty: true },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'seats',
  underscored: true,
  timestamps: false,
});

module.exports = Seat;
