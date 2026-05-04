'use strict';

const { Seat, SeatType, Ticket, Event } = require('../models');
const redis = require('../config/redis');
const { verifyAccessToken } = require('../utils/jwt.utils');

const REDIS_KEY_PREFIX = 'seat_hold:';

async function getEventSeats(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const seats = await Seat.findAll({
      where: { venueId: event.venueId },
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
    const heldSeatIds = new Set();
    const heldByMe = new Set();
    const reservationBySeat = new Map();

    let currentUserId = null;
    const token = req.cookies && req.cookies.access_token;
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        currentUserId = payload.id;
      } catch (_) {}
    }

    if (redisKeys.length > 0) {
      const redisValues = await redis.mget(redisKeys);
      redisKeys.forEach((key, idx) => {
        const seatId = key.replace(`${REDIS_KEY_PREFIX}${eventId}:`, '');
        heldSeatIds.add(seatId);

        const raw = redisValues[idx];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.reservationId) {
              reservationBySeat.set(seatId, parsed.reservationId);
            }
            if (parsed?.userId && parsed.userId === currentUserId) {
              heldByMe.add(seatId);
            }
          } catch (_) {}
        }
      });
    }

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
        heldByMe: heldByMe.has(seat.id),
        reservationId: reservationBySeat.get(seat.id) || null,
      };
    });

    return res.json(seatsWithStatus);
  } catch (err) {
    next(err);
  }
}

module.exports = { getEventSeats };
