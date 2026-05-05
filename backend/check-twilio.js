const twilio = require('twilio');
const env = require('./src/config/env');

const client = twilio(env.twilio.accountSid, env.twilio.authToken);

async function check() {
  try {
    const messages = await client.messages.list({ limit: 5 });
    console.log("=== ÚLTIMOS 5 MENSAJES DE TWILIO ===");
    for (const msg of messages) {
      console.log(`To: ${msg.to}`);
      console.log(`From: ${msg.from}`);
      console.log(`Status: ${msg.status}`);
      console.log(`Error Code: ${msg.errorCode}`);
      console.log(`Error Message: ${msg.errorMessage}`);
      console.log('---------------------------');
    }
  } catch (err) {
    console.error("Twilio API Error:", err.message);
  }
}

check();
