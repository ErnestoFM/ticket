'use strict';

const { Router } = require('express');
const { generalLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const {
  hold, holdValidation,
  cancel, cancelValidation,
} = require('../controllers/reservation.controller');

const router = Router();

router.post('/hold', authMiddleware, generalLimiter, holdValidation, hold);
router.post('/cancel', authMiddleware, generalLimiter, cancelValidation, cancel);

module.exports = router;
