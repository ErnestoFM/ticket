'use strict';

function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map((e) => e.message) : [err.message];
    return res.status(422).json({ error: 'Validation error', details: messages });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(422).json({ error: 'Referenced resource does not exist' });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({ error: 'Database error' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: err.message });
  }

  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    return res.status(status).json({ error: err.message || 'Request error' });
  }

  const status = err.httpStatus || 500;
  const message = err.expose ? err.message : 'Internal server error';

  return res.status(status).json({ error: message });
}

module.exports = errorHandler;
