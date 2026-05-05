'use strict';

const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Ticket, Reservation, Event, Seat, SeatType, Venue, User } = require('../models');
const { confirmReservation } = require('../services/reservation.service');
const { generateQR } = require('../utils/qr.utils');
const { generateTicketPDF } = require('../services/pdf.service');
const { sendTicketWhatsApp } = require('../services/whatsapp.service');
const env = require('../config/env');
const jwt = require('jsonwebtoken');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

const confirmValidation = [
  body('reservationId').isUUID().withMessage('Valid reservation ID required'),
  body('paymentMethod').isIn(['mock']).withMessage('Payment method must be mock'),
  body('paymentIntentId').trim().notEmpty().withMessage('Payment intent ID required'),
];

async function confirm(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { reservationId, paymentMethod, paymentIntentId } = req.body;
    const userId = req.user.id;

    // Confirm reservation (validates Redis hold + DB status)
    const reservation = await confirmReservation(reservationId, userId);

    // Verify payment
    if (paymentMethod !== 'mock') {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Fetch related data
    const seat = await Seat.findByPk(reservation.seatId, {
      include: [{ model: SeatType, as: 'seatType' }],
    });
    const event = await Event.findByPk(reservation.eventId, {
      include: [{ model: Venue, as: 'venue' }],
    });
    const user = await User.findByPk(userId);

    // Calculate price
    const multiplier = seat.seatType ? parseFloat(seat.seatType.multiplier) : 1.0;
    const price = parseFloat(event.basePrice) * multiplier;

    // Create ticket
    const ticket = await Ticket.create({
      userId,
      eventId: event.id,
      seatId: seat.id,
      reservationId,
      price,
      paymentMethod,
      paymentIntentId,
      qrCode: null,
    });

    const qrPayload = jwt.sign(
      {
        ticketId: ticket.id,
        curp: user.curp,
        eventId: event.id,
        seatId: seat.id,
      },
      env.jwt.secret,
      { issuer: 'ticketmaster-mx' }
    );

    const qrCode = await generateQR(qrPayload);
    await ticket.update({ qrCode });

    // Generate PDF
    let pdfPath = null;
    try {
      pdfPath = await generateTicketPDF({ ...ticket.toJSON(), qrCode }, event, seat, user, event.venue);
      await ticket.update({ pdfPath });
    } catch (pdfErr) {
      console.error('[TicketController] PDF generation failed:', pdfErr.message);
    }

    // Send WhatsApp notification
    let pdfUrl = null;
    if (pdfPath) {
      pdfUrl = `${env.app.frontendUrl}/uploads/tickets/${ticket.id}.pdf`;
    }

    try {
      await sendTicketWhatsApp({ ...ticket.toJSON(), seat, qrCode }, user, event, pdfUrl);
      await ticket.update({ whatsappSent: true });
    } catch (waErr) {
      console.error('[TicketController] WhatsApp send failed:', waErr.message);
    }

    return res.status(201).json({
      message: 'Ticket confirmed',
      ticket: {
        ...ticket.toJSON(),
        event: event.toJSON(),
        seat: seat.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function myTickets(req, res, next) {
  try {
    const tickets = await Ticket.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Event, as: 'event', include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }] },
        { model: Seat, as: 'seat', include: [{ model: SeatType, as: 'seatType' }] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json(tickets);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({
      where: { id, userId: req.user.id },
      include: [
        { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
        { model: Seat, as: 'seat', include: [{ model: SeatType, as: 'seatType' }] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'curp'] },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json(ticket);
  } catch (err) {
    next(err);
  }
}

module.exports = { confirm, confirmValidation, myTickets, getOne };
