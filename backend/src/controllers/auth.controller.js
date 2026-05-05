'use strict';

const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateCURP } = require('../services/curp.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

function parseBirthDate(input) {
  if (!input) return null;
  if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [day, month, year] = input.split('/');
    const iso = `${year}-${month}-${day}`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Paternal last name is required').isLength({ max: 100 }),
  body('motherLastName').optional().trim().isLength({ max: 100 }),
  body('secondName').optional().trim().isLength({ max: 100 }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required').isMobilePhone('es-MX').withMessage('Invalid Mexican phone number'),
  body('birthDate').custom((value) => {
    if (!parseBirthDate(value)) {
      throw new Error('Valid birth date required');
    }
    return true;
  }),
  body('birthState').trim().isLength({ min: 2, max: 2 }).withMessage('Birth state code must be 2 characters').toUpperCase(),
  body('gender').isIn(['H', 'M']).withMessage('Gender must be H or M'),
];

async function register(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { firstName, secondName, lastName, motherLastName, password, phone, birthDate, birthState, gender } = req.body;
    const parsedBirthDate = parseBirthDate(birthDate);
    if (!parsedBirthDate) {
      return res.status(422).json({ error: 'Valid birth date required' });
    }

    const curp = generateCURP({ firstName, secondName, lastName, motherLastName, birthDate: parsedBirthDate, gender, birthState });

    const existingUser = await User.findOne({ where: { curp } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this CURP already exists' });
    }

    const user = await User.create({
      firstName,
      secondName: secondName || null,
      lastName,
      motherLastName: motherLastName || null,
      curp,
      password,
      phone,
      birthDate: parsedBirthDate,
      birthState,
      gender,
      role: 'user',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      curp: user.curp,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
}

const loginValidation = [
  body('curp').trim().notEmpty().withMessage('CURP is required').isLength({ min: 18, max: 18 }),
  body('password').notEmpty().withMessage('Password is required'),
];

async function login(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { curp, password } = req.body;

    const user = await User.findOne({ where: { curp: curp.toUpperCase(), isActive: true } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    return res.json({ message: 'Login successful', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findOne({ where: { id: payload.id, isActive: true } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(newPayload);

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: 'Token refreshed' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  return res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  return res.json({ user: req.user.toJSON() });
}

const updateProfileValidation = [
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ min: 10, max: 15 }).withMessage('Invalid phone number'),
];

async function updateProfile(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { phone } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.phone = phone;
    await user.save();

    return res.json({ message: 'Profile updated successfully', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  registerValidation,
  login,
  loginValidation,
  refresh,
  logout,
  me,
  updateProfile,
  updateProfileValidation,
};
