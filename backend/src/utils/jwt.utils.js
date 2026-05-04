'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.accessExpires,
    issuer: 'ticketmaster-mx',
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
    issuer: 'ticketmaster-mx',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, {
    issuer: 'ticketmaster-mx',
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, {
    issuer: 'ticketmaster-mx',
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
