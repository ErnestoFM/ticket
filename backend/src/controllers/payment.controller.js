'use strict';

const { body, validationResult } = require('express-validator');
const { Reservation, Event, Seat, SeatType } = require('../models');
const { processPayment } = require('../services/mockPayment.service');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation failed:', errors.array());
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

const processMockPaymentValidation = [
  body('reservationId').isUUID().withMessage('Valid reservation ID required'),
  body('cardNumber').optional({ checkFalsy: true }).isString().isLength({ min: 16, max: 16 }).withMessage('16-digit card number required'),
  body('expirationDate').optional({ checkFalsy: true }).isString().matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('Valid expiration date required (MM/YY)'),
  body('cvv').optional({ checkFalsy: true }).isString().isLength({ min: 3, max: 4 }).withMessage('Valid CVV required'),
];

async function processMockPayment(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { reservationId, cardNumber, expirationDate, cvv } = req.body;
    const userId = req.user.id;

    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId, status: 'held' },
      include: [
        { model: Event, as: 'event' },
        { model: Seat, as: 'seat', include: [{ model: SeatType, as: 'seatType' }] },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Active reservation not found' });
    }

    if (new Date() > reservation.expiresAt) {
      return res.status(410).json({ error: 'Reservation has expired' });
    }

    const multiplier = reservation.seat?.seatType
      ? parseFloat(reservation.seat.seatType.multiplier)
      : 1.0;
    const amount = parseFloat(reservation.event.basePrice) * multiplier;

    // Process payment using the mock service
    const result = await processPayment({ cardNumber, expirationDate, cvv, amount });

    return res.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      amount,
      currency: 'MXN',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processMockPayment,
  processMockPaymentValidation,
};
