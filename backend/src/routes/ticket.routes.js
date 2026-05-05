'use strict';

const { Router } = require('express');
const { generalLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const {
  confirm, confirmValidation,
  myTickets,
  getOne,
  resendWhatsApp,
} = require('../controllers/ticket.controller');

const router = Router();

router.post('/confirm', authMiddleware, confirmValidation, confirm);
router.get('/my', authMiddleware, generalLimiter, myTickets);
router.get('/:id', authMiddleware, generalLimiter, getOne);
router.post('/:id/resend-whatsapp', authMiddleware, generalLimiter, resendWhatsApp);

module.exports = router;
