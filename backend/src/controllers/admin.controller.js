'use strict';

const { body, param, query, validationResult } = require('express-validator');
const { fn, col } = require('sequelize');
const { User, Ticket, Event, Seat, Venue, SeatType } = require('../models');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

async function listUsers(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      data: rows.map((u) => u.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

const updateUserStatusValidation = [
  param('id').isUUID().withMessage('Valid user ID required'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
];

async function updateUserStatus(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isActive });
    return res.json({ message: 'User status updated', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

const userTicketsValidation = [
  param('id').isUUID().withMessage('Valid user ID required'),
];

async function userTickets(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { id } = req.params;
    const tickets = await Ticket.findAll({
      where: { userId: id },
      include: [
        { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
        { model: Seat, as: 'seat', include: [{ model: SeatType, as: 'seatType' }] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json(tickets);
  } catch (err) {
    next(err);
  }
}

async function reportSummary(req, res, next) {
  try {
    const sales = await Ticket.findAll({
      attributes: [
        'eventId',
        [fn('COUNT', col('id')), 'tickets'],
        [fn('SUM', col('price')), 'revenue'],
      ],
      group: ['eventId'],
    });

    const events = await Event.findAll({ include: [{ model: Venue, as: 'venue' }] });
    const salesByEvent = sales.map((row) => {
      const event = events.find((e) => e.id === row.eventId);
      return {
        eventId: row.eventId,
        title: event ? event.title : 'Unknown',
        venue: event?.venue ? event.venue.name : null,
        tickets: parseInt(row.get('tickets'), 10),
        revenue: parseFloat(row.get('revenue') || 0),
      };
    });

    const paymentMethods = await Ticket.findAll({
      attributes: [
        'paymentMethod',
        [fn('COUNT', col('id')), 'tickets'],
        [fn('SUM', col('price')), 'revenue'],
      ],
      group: ['paymentMethod'],
    });

    const revenueByPaymentMethod = paymentMethods.map((row) => ({
      paymentMethod: row.paymentMethod,
      tickets: parseInt(row.get('tickets'), 10),
      revenue: parseFloat(row.get('revenue') || 0),
    }));

    const occupancyByEvent = await Promise.all(events.map(async (event) => {
      const totalSeats = await Seat.count({ where: { venueId: event.venueId, isActive: true } });
      const soldSeats = await Ticket.count({ where: { eventId: event.id } });
      const occupancy = totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0;
      return {
        eventId: event.id,
        title: event.title,
        venue: event.venue ? event.venue.name : null,
        totalSeats,
        soldSeats,
        occupancy: parseFloat(occupancy.toFixed(2)),
      };
    }));

    return res.json({
      salesByEvent,
      occupancyByEvent,
      revenueByPaymentMethod,
    });
  } catch (err) {
    next(err);
  }
}

async function exportReport(req, res, next) {
  try {
    const sales = await Ticket.findAll({
      attributes: [
        'eventId',
        [fn('COUNT', col('id')), 'tickets'],
        [fn('SUM', col('price')), 'revenue'],
      ],
      group: ['eventId'],
    });

    const events = await Event.findAll();
    const lines = ['event_id,event_title,tickets,revenue_mxn'];

    for (const row of sales) {
      const event = events.find((e) => e.id === row.eventId);
      const title = event ? event.title.replace(/"/g, '""') : 'Unknown';
      lines.push(`${row.eventId},"${title}",${row.get('tickets')},${parseFloat(row.get('revenue') || 0)}`);
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ticketmaster_report.csv"');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  listUsersValidation,
  updateUserStatus,
  updateUserStatusValidation,
  userTickets,
  userTicketsValidation,
  reportSummary,
  exportReport,
};
