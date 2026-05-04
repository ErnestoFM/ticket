'use strict';

const { Router } = require('express');
const { generalLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  list,
  getOne,
  create, createValidation,
  update, updateValidation,
  delete: softDelete,
} = require('../controllers/venue.controller');

const router = Router();

router.get('/', generalLimiter, list);
router.get('/:id', generalLimiter, getOne);
router.post('/', authMiddleware, adminMiddleware, createValidation, create);
router.put('/:id', authMiddleware, adminMiddleware, updateValidation, update);
router.delete('/:id', authMiddleware, adminMiddleware, softDelete);

module.exports = router;
