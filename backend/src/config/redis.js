'use strict';

const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  retryStrategy(times) {
    if (times > 10) {
      console.error('[Redis] Max reconnection attempts reached');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

redis.on('reconnecting', (delay) => {
  console.warn(`[Redis] Reconnecting in ${delay}ms`);
});

module.exports = redis;
