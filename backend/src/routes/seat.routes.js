'use strict';

const { Router } = require('express');
const { generalLimiter } = require('../middleware/rateLimiter');
const { getEventSeats } = require('../controllers/seat.controller');

const router = Router();

router.get('/event/:eventId', generalLimiter, getEventSeats);

module.exports = router;
