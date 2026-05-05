'use strict';

const { v4: uuidv4 } = require('uuid');

async function processPayment(cardDetails) {
  // Simulate 2 second delay for processing
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // Return mock successful response
  return {
    success: true,
    paymentIntentId: uuidv4()
  };
}

module.exports = {
  processPayment
};
