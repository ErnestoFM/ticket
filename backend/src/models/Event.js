'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
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
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 300] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('teatro', 'cine', 'museo'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 120,
    validate: { min: 1 },
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_price',
    validate: { min: 0 },
  },
  maxTicketsPerUser: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    field: 'max_tickets_per_user',
    validate: { min: 1 },
  },
  status: {
    type: DataTypes.ENUM('activo', 'cancelado', 'agotado', 'finalizado'),
    allowNull: false,
    defaultValue: 'activo',
  },
  posterUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'poster_url',
  },
  bannerUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'banner_url',
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'created_by',
  },
}, {
  tableName: 'events',
  underscored: true,
});

module.exports = Event;
