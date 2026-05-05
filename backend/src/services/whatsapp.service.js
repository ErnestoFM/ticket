'use strict';

const twilio = require('twilio');
const env = require('../config/env');

function getClient() {
  return twilio(env.twilio.accountSid, env.twilio.authToken);
}

/**
 * Send a WhatsApp message with ticket details.
 * @param {Object} ticket
 * @param {Object} user
 * @param {Object} event
 * @param {string|null} pdfUrl - publicly accessible PDF URL
 * @returns {Object} Twilio message SID
 */
async function sendTicketWhatsApp(ticket, user, event, pdfUrl = null) {
  const client = getClient();

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });

  const fullName = [user.firstName, user.secondName, user.lastName, user.motherLastName]
    .filter(Boolean)
    .join(' ');

  let messageBody = [
    `🎭 *TICKETMASTER MX - Tu Boleto*`,
    ``,
    `Hola ${fullName},`,
    `Tu compra fue exitosa. Aquí están los detalles:`,
    ``,
    `🎪 *Evento:* ${event.title}`,
    `📅 *Fecha:* ${dateStr}`,
    `🕐 *Hora:* ${timeStr}`,
    `💺 *Asiento:* ${ticket.seat ? `Fila ${ticket.seat.row}, Lugar ${ticket.seat.col}` : 'N/A'}`,
    `💰 *Precio:* $${parseFloat(ticket.price).toFixed(2)} MXN`,
    ``,
    `📋 *Número de confirmación:* ${ticket.id}`,
    ``,
    `Por favor presenta este mensaje o el PDF adjunto al ingresar al evento.`,
    `¡Disfruta el evento!`,
  ].join('\n');

  let formattedPhone = user.phone;
  // WhatsApp y Twilio para México requieren a menudo el prefijo '+52 1' en lugar de solo '+52'
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+521${formattedPhone}`;
  } else if (formattedPhone.startsWith('+52') && !formattedPhone.startsWith('+521') && formattedPhone.length === 13) {
    formattedPhone = `+521${formattedPhone.slice(3)}`;
  }

  // Como Ngrok bloquea las URLs locales, usaremos un generador público de QR
  // para que Twilio pueda descargar la imagen sin ser bloqueado.
  const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.id)}`;

  if (pdfUrl && pdfUrl.includes('ngrok-free.dev')) {
    messageBody += `\n\n📄 *Descarga tu PDF completo aquí:* ${pdfUrl}`;
  }

  const messageOptions = {
    body: messageBody,
    from: env.twilio.whatsappFrom,
    to: `whatsapp:${formattedPhone}`,
  };

  console.log(`[Twilio] Sending WhatsApp to: ${messageOptions.to}`);
  
  // Siempre adjuntamos el QR generado públicamente para que Twilio no falle
  messageOptions.mediaUrl = [publicQrUrl];
  console.log(`[Twilio] Attaching QR as media: ${publicQrUrl}`);

  const message = await client.messages.create(messageOptions);
  return { sid: message.sid };
}

async function sendCancellationWhatsApp(ticket, user, event) {
  const client = getClient();

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const fullName = [user.firstName, user.secondName, user.lastName, user.motherLastName]
    .filter(Boolean)
    .join(' ');

  const messageBody = [
    `⚠️ *TICKETMASTER MX - Evento Cancelado*`,
    ``,
    `Hola ${fullName},`,
    `Lamentamos informarte que el evento ha sido cancelado:`,
    ``,
    `🎪 *Evento:* ${event.title}`,
    `📅 *Fecha:* ${dateStr}`,
    `📋 *Confirmación:* ${ticket.id}`,
    ``,
    `El equipo de Ticketmaster MX se pondrá en contacto contigo para el reembolso correspondiente.`,
  ].join('\n');

  let formattedPhone = user.phone;
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+52${formattedPhone}`;
  }

  const message = await client.messages.create({
    body: messageBody,
    from: env.twilio.whatsappFrom,
    to: `whatsapp:${formattedPhone}`,
  });

  return { sid: message.sid };
}

module.exports = { sendTicketWhatsApp, sendCancellationWhatsApp };
