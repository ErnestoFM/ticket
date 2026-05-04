'use strict';

const { Op } = require('sequelize');
const { body, query, param, validationResult } = require('express-validator');
const { Event, Venue, Seat, Ticket, User } = require('../models');
const { sendTicketWhatsApp } = require('../services/whatsapp.service');
const env = require('../config/env');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

async function list(req, res, next) {
  try {
    const { type, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = new Date(dateFrom);
      if (dateTo) where.date[Op.lte] = new Date(dateTo);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city', 'state'] }],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        { model: Venue, as: 'venue' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const totalSeats = await Seat.count({ where: { venueId: event.venueId, isActive: true } });
    const soldSeats = await Ticket.count({ where: { eventId: id } });

    return res.json({
      ...event.toJSON(),
      availability: {
        total: totalSeats,
        sold: soldSeats,
        available: totalSeats - soldSeats,
      },
    });
  } catch (err) {
    next(err);
  }
}

const createValidation = [
  body('venueId').isUUID().withMessage('Valid venue ID required'),
  body('title').trim().notEmpty().isLength({ max: 300 }),
  body('description').optional().trim(),
  body('type').isIn(['teatro', 'cine', 'museo']),
  body('date').isISO8601().withMessage('Valid date required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be positive integer'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be non-negative'),
  body('maxTicketsPerUser').optional().isInt({ min: 1, max: 10 }),
];

async function create(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { venueId, title, description, type, date, duration, basePrice, maxTicketsPerUser, posterUrl, bannerUrl } = req.body;

    const venue = await Venue.findByPk(venueId);
    if (!venue || !venue.isActive) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const event = await Event.create({
      venueId,
      title,
      description: description || null,
      type,
      date,
      duration: parseInt(duration),
      basePrice: parseFloat(basePrice),
      maxTicketsPerUser: maxTicketsPerUser ? parseInt(maxTicketsPerUser) : 4,
      posterUrl: posterUrl || null,
      bannerUrl: bannerUrl || null,
      status: 'activo',
      createdBy: req.user.id,
    });

    return res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

const updateValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('description').optional().trim(),
  body('date').optional().isISO8601(),
  body('duration').optional().isInt({ min: 1 }),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('maxTicketsPerUser').optional().isInt({ min: 1, max: 10 }),
  body('status').optional().isIn(['activo', 'cancelado', 'agotado', 'finalizado']),
];

async function update(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const allowedFields = ['title', 'description', 'date', 'duration', 'basePrice', 'maxTicketsPerUser', 'status', 'posterUrl', 'bannerUrl'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await event.update(updates);
    return res.json(event);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, {
      include: [{ model: Venue, as: 'venue' }],
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'cancelado') {
      return res.status(409).json({ error: 'Event is already cancelled' });
    }

    await event.update({ status: 'cancelado' });

    // Notify ticket buyers via WhatsApp
    const tickets = await Ticket.findAll({
      where: { eventId: id },
      include: [
        { model: User, as: 'user' },
        { model: Seat, as: 'seat' },
      ],
    });

    const notifyPromises = tickets.map(async (ticket) => {
      try {
        await sendTicketWhatsApp(ticket, ticket.user, event, null);
      } catch (err) {
        console.error('[EventController] WhatsApp notification failed:', err.message);
      }
    });

    await Promise.allSettled(notifyPromises);

    return res.json({ message: 'Event cancelled and buyers notified', event });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  createValidation,
  update,
  updateValidation,
  cancel,
};
