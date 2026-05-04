'use strict';

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name',
    validate: { notEmpty: true, len: [1, 100] },
  },
  secondName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'second_name',
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name',
    validate: { notEmpty: true, len: [1, 100] },
  },
  motherLastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mother_last_name',
  },
  curp: {
    type: DataTypes.CHAR(18),
    allowNull: false,
    unique: true,
    validate: {
      len: [18, 18],
      is: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true },
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'birth_date',
  },
  birthState: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    field: 'birth_state',
  },
  gender: {
    type: DataTypes.ENUM('H', 'M'),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'users',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
