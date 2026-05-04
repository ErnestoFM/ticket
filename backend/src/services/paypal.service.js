'use strict';

const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const env = require('../config/env');

function getEnvironment() {
  if (env.paypal.mode === 'production') {
    return new checkoutNodeJssdk.core.LiveEnvironment(
      env.paypal.clientId,
      env.paypal.clientSecret
    );
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(
    env.paypal.clientId,
    env.paypal.clientSecret
  );
}

function getClient() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(getEnvironment());
}

/**
 * Create a PayPal order.
 * @param {number} amount - Amount as decimal string e.g. "250.00"
 * @param {string} currency - ISO currency code
 * @returns {Object} PayPal order response
 */
async function createOrder(amount, currency = 'MXN') {
  const client = getClient();
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.headers['prefer'] = 'return=representation';
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: parseFloat(amount).toFixed(2),
        },
      },
    ],
  });

  const response = await client.execute(request);
  return response.result;
}

/**
 * Capture an approved PayPal order.
 * @param {string} orderId
 * @returns {Object} PayPal capture response
 */
async function captureOrder(orderId) {
  const client = getClient();
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const response = await client.execute(request);

  if (response.result.status !== 'COMPLETED') {
    const err = new Error(`PayPal capture failed. Status: ${response.result.status}`);
    err.status = 402;
    throw err;
  }

  return response.result;
}

module.exports = { createOrder, captureOrder };
