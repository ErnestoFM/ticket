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

  const messageBody = [
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

  const messageOptions = {
    body: messageBody,
    from: env.twilio.whatsappFrom,
    to: `whatsapp:${user.phone}`,
  };

  if (pdfUrl) {
    messageOptions.mediaUrl = [pdfUrl];
  }

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

  const message = await client.messages.create({
    body: messageBody,
    from: env.twilio.whatsappFrom,
    to: `whatsapp:${user.phone}`,
  });

  return { sid: message.sid };
}

module.exports = { sendTicketWhatsApp, sendCancellationWhatsApp };
