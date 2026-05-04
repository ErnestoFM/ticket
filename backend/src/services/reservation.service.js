'use strict';

const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');
const { Reservation, Ticket } = require('../models');
const { Op } = require('sequelize');

const REDIS_KEY_PREFIX = 'seat_hold:';

function seatKey(eventId, seatId) {
  return `${REDIS_KEY_PREFIX}${eventId}:${seatId}`;
}

/**
 * Hold a seat for a user during checkout.
 * @param {string} userId
 * @param {string} eventId
 * @param {string} seatId
 * @param {number} ttl - seconds (default 300)
 * @returns {{ reservationId: string, expiresAt: Date }}
 */
async function holdSeat(userId, eventId, seatId, ttl = 300) {
  const key = seatKey(eventId, seatId);

  // Check if seat is already held in Redis
  const existingHolder = await redis.get(key);
  if (existingHolder) {
    const err = new Error('Seat is already held by another user');
    err.status = 409;
    throw err;
  }

  // Check if seat is already sold (confirmed ticket)
  const existingTicket = await Ticket.findOne({
    where: { eventId, seatId },
  });
  if (existingTicket) {
    const err = new Error('Seat has already been sold');
    err.status = 409;
    throw err;
  }

  // Check for active reservation in DB
  const existingReservation = await Reservation.findOne({
    where: {
      eventId,
      seatId,
      status: 'held',
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  if (existingReservation) {
    const err = new Error('Seat is already reserved');
    err.status = 409;
    throw err;
  }

  const reservationId = uuidv4();
  const expiresAt = new Date(Date.now() + ttl * 1000);

  // Store in Redis with TTL
  await redis.set(key, JSON.stringify({ userId, reservationId }), 'EX', ttl);

  // Create reservation in MySQL
  await Reservation.create({
    id: reservationId,
    userId,
    eventId,
    seatId,
    expiresAt,
    status: 'held',
  });

  return { reservationId, expiresAt };
}

/**
 * Confirm a reservation (called after successful payment).
 * @param {string} reservationId
 * @param {string} userId
 * @returns {Reservation}
 */
async function confirmReservation(reservationId, userId) {
  const reservation = await Reservation.findOne({
    where: { id: reservationId, userId, status: 'held' },
  });

  if (!reservation) {
    const err = new Error('Reservation not found or already processed');
    err.status = 404;
    throw err;
  }

  if (new Date() > reservation.expiresAt) {
    await reservation.update({ status: 'expired' });
    const key = seatKey(reservation.eventId, reservation.seatId);
    await redis.del(key);
    const err = new Error('Reservation has expired');
    err.status = 410;
    throw err;
  }

  const key = seatKey(reservation.eventId, reservation.seatId);
  const redisData = await redis.get(key);

  if (!redisData) {
    const err = new Error('Reservation hold has expired');
    err.status = 410;
    throw err;
  }

  await reservation.update({ status: 'confirmed' });
  await redis.del(key);

  return reservation;
}

/**
 * Find and expire all held reservations past their expiresAt timestamp.
 * @returns {number} count of expired reservations
 */
async function expireReservations() {
  const expired = await Reservation.findAll({
    where: {
      status: 'held',
      expiresAt: { [Op.lte]: new Date() },
    },
  });

  let count = 0;
  for (const reservation of expired) {
    try {
      await reservation.update({ status: 'expired' });
      const key = seatKey(reservation.eventId, reservation.seatId);
      await redis.del(key);
      count++;
    } catch (err) {
      console.error('[ReservationService] Error expiring reservation:', reservation.id, err.message);
    }
  }

  if (count > 0) {
    console.log(`[ReservationService] Expired ${count} reservations`);
  }

  return count;
}

/**
 * Cancel a held reservation.
 * @param {string} reservationId
 * @param {string} userId
 * @returns {Reservation}
 */
async function cancelReservation(reservationId, userId) {
  const reservation = await Reservation.findOne({
    where: { id: reservationId, userId, status: 'held' },
  });

  if (!reservation) {
    const err = new Error('Reservation not found or cannot be cancelled');
    err.status = 404;
    throw err;
  }

  await reservation.update({ status: 'cancelled' });
  const key = seatKey(reservation.eventId, reservation.seatId);
  await redis.del(key);

  return reservation;
}

module.exports = {
  holdSeat,
  confirmReservation,
  expireReservations,
  cancelReservation,
};
