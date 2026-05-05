'use strict';

const { Router } = require('express');
const { authLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const {
  register, registerValidation,
  login, loginValidation,
  refresh,
  logout,
  me,
  updateProfile, updateProfileValidation,
} = require('../controllers/auth.controller');

const router = Router();

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile);

module.exports = router;
