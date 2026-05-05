'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  listUsers, listUsersValidation,
  updateUserStatus, updateUserStatusValidation,
  userTickets, userTicketsValidation,
  reportSummary,
  exportReport,
} = require('../controllers/admin.controller');

const router = Router();

router.get('/users', authMiddleware, adminMiddleware, listUsersValidation, listUsers);
router.patch('/users/:id/status', authMiddleware, adminMiddleware, updateUserStatusValidation, updateUserStatus);
router.get('/users/:id/tickets', authMiddleware, adminMiddleware, userTicketsValidation, userTickets);

router.get('/reports', authMiddleware, adminMiddleware, reportSummary);
router.get('/reports/export', authMiddleware, adminMiddleware, exportReport);

module.exports = router;
