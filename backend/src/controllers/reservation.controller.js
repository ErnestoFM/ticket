'use strict';

const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Event, Seat, Reservation, Ticket } = require('../models');
const { holdSeat, cancelReservation } = require('../services/reservation.service');
const env = require('../config/env');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

const holdValidation = [
  body('eventId').isUUID().withMessage('Valid event ID required'),
  body('seatId').isUUID().withMessage('Valid seat ID required'),
];

async function hold(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { eventId, seatId } = req.body;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event || event.status !== 'activo') {
      return res.status(404).json({ error: 'Event not found or inactive' });
    }

    const seat = await Seat.findByPk(seatId);
    if (!seat || !seat.isActive) {
      return res.status(404).json({ error: 'Seat not found or inactive' });
    }

    if (seat.venueId !== event.venueId) {
      return res.status(422).json({ error: 'Seat does not belong to event venue' });
    }

    const [ticketCount, reservationCount] = await Promise.all([
      Ticket.count({ where: { eventId, userId } }),
      Reservation.count({
        where: {
          eventId,
          userId,
          status: 'held',
          expiresAt: { [Op.gt]: new Date() },
        },
      }),
    ]);

    if (ticketCount + reservationCount >= event.maxTicketsPerUser) {
      return res.status(409).json({ error: 'Maximum tickets per user reached for this event' });
    }

    const { reservationId, expiresAt } = await holdSeat(
      userId,
      eventId,
      seatId,
      env.app.reservationTtl
    );

    return res.status(201).json({
      reservationId,
      expiresAt,
      ttl: env.app.reservationTtl,
    });
  } catch (err) {
    next(err);
  }
}

const cancelValidation = [
  body('reservationId').isUUID().withMessage('Valid reservation ID required'),
];

async function cancel(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { reservationId } = req.body;
    const reservation = await cancelReservation(reservationId, req.user.id);

    return res.json({ message: 'Reservation cancelled', reservation });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  hold,
  holdValidation,
  cancel,
  cancelValidation,
};
