'use strict';

const { Seat, SeatType, Ticket, Reservation } = require('../models');
const redis = require('../config/redis');
const { Op } = require('sequelize');

const REDIS_KEY_PREFIX = 'seat_hold:';

async function getEventSeats(req, res, next) {
  try {
    const { eventId } = req.params;

    const seats = await Seat.findAll({
      include: [{ model: SeatType, as: 'seatType' }],
      order: [['row', 'ASC'], ['col', 'ASC']],
    });

    // Get sold seat IDs from DB (confirmed tickets)
    const soldTickets = await Ticket.findAll({
      where: { eventId },
      attributes: ['seatId'],
    });
    const soldSeatIds = new Set(soldTickets.map((t) => t.seatId));

    // Get held seat IDs from Redis
    const redisKeys = await redis.keys(`${REDIS_KEY_PREFIX}${eventId}:*`);
    const heldSeatIds = new Set(
      redisKeys.map((key) => key.replace(`${REDIS_KEY_PREFIX}${eventId}:`, ''))
    );

    const seatsWithStatus = seats.map((seat) => {
      let status = 'available';
      if (!seat.isActive) {
        status = 'inactive';
      } else if (soldSeatIds.has(seat.id)) {
        status = 'sold';
      } else if (heldSeatIds.has(seat.id)) {
        status = 'held';
      }

      return {
        ...seat.toJSON(),
        status,
      };
    });

    return res.json(seatsWithStatus);
  } catch (err) {
    next(err);
  }
}

module.exports = { getEventSeats };
