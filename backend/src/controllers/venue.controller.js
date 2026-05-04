'use strict';

const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Venue, Seat, SeatType } = require('../models');

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
    const venues = await Venue.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    return res.json(venues);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const venue = await Venue.findByPk(id, {
      include: [
        {
          model: Seat,
          as: 'seats',
          where: { isActive: true },
          required: false,
          include: [{ model: SeatType, as: 'seatType' }],
        },
      ],
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    return res.json(venue);
  } catch (err) {
    next(err);
  }
}

const createValidation = [
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty().isLength({ max: 100 }),
  body('state').trim().notEmpty().isLength({ max: 100 }),
  body('type').isIn(['teatro', 'cine', 'museo']),
  body('totalRows').isInt({ min: 1, max: 100 }).withMessage('Rows must be between 1 and 100'),
  body('totalCols').isInt({ min: 1, max: 100 }).withMessage('Columns must be between 1 and 100'),
  body('zoneConfig').optional().isArray().withMessage('zoneConfig must be an array'),
];

async function create(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { name, address, city, state, type, totalRows, totalCols, logoUrl, zoneConfig } = req.body;

    const venue = await Venue.create({
      name,
      address,
      city,
      state,
      type,
      totalRows: parseInt(totalRows),
      totalCols: parseInt(totalCols),
      logoUrl: logoUrl || null,
      isActive: true,
    });

    // Fetch all seat types for assignment
    const seatTypes = await SeatType.findAll();
    const seatTypeMap = {};
    for (const st of seatTypes) {
      seatTypeMap[st.name] = st.id;
    }

    // Default: if no zoneConfig, all seats are 'general'
    // zoneConfig: [{ rowStart, rowEnd, seatType }]
    const getZoneForRow = (rowIndex) => {
      if (!zoneConfig || !Array.isArray(zoneConfig) || zoneConfig.length === 0) {
        return 'general';
      }
      for (const zone of zoneConfig) {
        if (rowIndex >= zone.rowStart && rowIndex <= zone.rowEnd) {
          return zone.seatType || 'general';
        }
      }
      return 'general';
    };

    const seatsToCreate = [];
    const rows = parseInt(totalRows);
    const cols = parseInt(totalCols);

    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      const zoneName = getZoneForRow(r);
      const seatTypeId = seatTypeMap[zoneName] || seatTypeMap['general'];

      for (let c = 1; c <= cols; c++) {
        seatsToCreate.push({
          id: uuidv4(),
          venueId: venue.id,
          seatTypeId,
          row: rowLabel,
          col: c,
          label: `${rowLabel}${c}`,
          isActive: true,
        });
      }
    }

    await Seat.bulkCreate(seatsToCreate);

    return res.status(201).json({ ...venue.toJSON(), seatsCreated: seatsToCreate.length });
  } catch (err) {
    next(err);
  }
}

const updateValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('address').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty().isLength({ max: 100 }),
  body('state').optional().trim().notEmpty().isLength({ max: 100 }),
  body('type').optional().isIn(['teatro', 'cine', 'museo']),
];

async function update(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { id } = req.params;
    const venue = await Venue.findByPk(id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const allowedFields = ['name', 'address', 'city', 'state', 'type', 'logoUrl'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await venue.update(updates);
    return res.json(venue);
  } catch (err) {
    next(err);
  }
}

async function softDelete(req, res, next) {
  try {
    const { id } = req.params;
    const venue = await Venue.findByPk(id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    await venue.update({ isActive: false });
    return res.json({ message: 'Venue deactivated successfully' });
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
  delete: softDelete,
};
