'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 200] },
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: { notEmpty: true },
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  type: {
    type: DataTypes.ENUM('teatro', 'cine', 'museo'),
    allowNull: false,
  },
  totalRows: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_rows',
    validate: { min: 0 },
  },
  totalCols: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_cols',
    validate: { min: 0 },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  logoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'logo_url',
  },
}, {
  tableName: 'venues',
  underscored: true,
});

module.exports = Venue;
