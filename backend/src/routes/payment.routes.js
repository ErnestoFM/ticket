'use strict';

const { Router } = require('express');
const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  stripeWebhook,
  createPaypalOrder, createPaypalOrderValidation,
  capturePaypalOrder, capturePaypalOrderValidation,
} = require('../controllers/payment.controller');

const router = Router();

// Stripe webhook needs raw body for signature verification
router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

router.post('/paypal/create-order', authMiddleware, createPaypalOrderValidation, createPaypalOrder);
router.post('/paypal/capture-order', authMiddleware, capturePaypalOrderValidation, capturePaypalOrder);

module.exports = router;
