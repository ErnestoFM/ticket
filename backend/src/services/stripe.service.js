'use strict';

const Stripe = require('stripe');
const env = require('../config/env');

function getStripe() {
  return new Stripe(env.stripe.secretKey, { apiVersion: '2023-10-16' });
}

/**
 * Create a Stripe PaymentIntent.
 * @param {number} amount - Amount in cents (MXN)
 * @param {string} currency
 * @param {Object} metadata
 * @returns {Stripe.PaymentIntent}
 */
async function createPaymentIntent(amount, currency = 'mxn', metadata = {}) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
}

/**
 * Retrieve a PaymentIntent and confirm its status.
 * @param {string} paymentIntentId
 * @returns {Stripe.PaymentIntent}
 */
async function confirmPaymentIntent(paymentIntentId) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    const err = new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    err.status = 402;
    throw err;
  }
  return paymentIntent;
}

/**
 * Construct a Stripe webhook event.
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - Stripe-Signature header
 * @returns {Stripe.Event}
 */
function constructWebhookEvent(payload, signature) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
}

module.exports = { createPaymentIntent, confirmPaymentIntent, constructWebhookEvent };
