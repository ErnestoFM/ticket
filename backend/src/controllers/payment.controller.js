'use strict';

const { body, validationResult } = require('express-validator');
const { constructWebhookEvent } = require('../services/stripe.service');
const { createOrder, captureOrder } = require('../services/paypal.service');
const { Ticket, Reservation, Event } = require('../models');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('[StripeWebhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[StripeWebhook] PaymentIntent succeeded:', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.warn('[StripeWebhook] PaymentIntent failed:', paymentIntent.id);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('[StripeWebhook] Charge refunded:', charge.id);
        break;
      }
      default:
        console.log('[StripeWebhook] Unhandled event type:', event.type);
    }

    return res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

const createPaypalOrderValidation = [
  body('reservationId').isUUID().withMessage('Valid reservation ID required'),
];

async function createPaypalOrder(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { reservationId } = req.body;
    const userId = req.user.id;

    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId, status: 'held' },
      include: [{ model: Event, as: 'event' }],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Active reservation not found' });
    }

    if (new Date() > reservation.expiresAt) {
      return res.status(410).json({ error: 'Reservation has expired' });
    }

    const amount = parseFloat(reservation.event.basePrice);

    const order = await createOrder(amount, 'MXN');

    return res.json({
      orderId: order.id,
      status: order.status,
      approveUrl: order.links.find((l) => l.rel === 'approve')?.href,
    });
  } catch (err) {
    next(err);
  }
}

const capturePaypalOrderValidation = [
  body('orderId').trim().notEmpty().withMessage('PayPal order ID required'),
];

async function capturePaypalOrder(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { orderId } = req.body;

    const capture = await captureOrder(orderId);

    return res.json({
      captureId: capture.id,
      status: capture.status,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  stripeWebhook,
  createPaypalOrder,
  createPaypalOrderValidation,
  capturePaypalOrder,
  capturePaypalOrderValidation,
};
