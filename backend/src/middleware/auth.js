'use strict';

const { verifyAccessToken } = require('../utils/jwt.utils');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies && req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);

    const user = await User.findOne({
      where: { id: payload.id, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
}

module.exports = authMiddleware;
