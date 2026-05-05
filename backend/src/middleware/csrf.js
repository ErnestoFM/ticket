'use strict';

const env = require('../config/env');

/**
 * CSRF protection via Origin / Referer header validation.
 * For state-changing API requests we verify the Origin header matches
 * the allowed frontend URL, which prevents cross-origin form POST attacks.
 * GET requests are safe-methods and are not checked.
 */
function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }



  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    return res.status(403).json({ error: 'CSRF validation failed: missing origin' });
  }

  const allowedOrigins = [
    env.app.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));

  if (!isAllowed) {
    return res.status(403).json({ error: 'CSRF validation failed: origin not allowed' });
  }

  next();
}

module.exports = csrfProtection;
