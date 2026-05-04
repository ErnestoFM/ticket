'use strict';

const QRCode = require('qrcode');

async function generateQR(data) {
  const qrString = typeof data === 'string' ? data : JSON.stringify(data);
  const base64 = await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    width: 256,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  return base64;
}

module.exports = { generateQR };
