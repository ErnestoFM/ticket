'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const {
  processMockPayment,
  processMockPaymentValidation,
} = require('../controllers/payment.controller');

const router = Router();

router.post('/mock/process', authMiddleware, processMockPaymentValidation, processMockPayment);

module.exports = router;
