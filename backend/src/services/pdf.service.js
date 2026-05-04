'use strict';

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/tickets');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function resolveLogoPath(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return null;
  }
  if (path.isAbsolute(logoUrl)) {
    return fs.existsSync(logoUrl) ? logoUrl : null;
  }
  const normalized = logoUrl.startsWith('/uploads') ? logoUrl.slice(1) : logoUrl;
  const candidate = path.join(__dirname, '../../', normalized);
  return fs.existsSync(candidate) ? candidate : null;
}

/**
 * Generate a ticket PDF and save it to disk.
 * @param {Object} ticket - Ticket model instance
 * @param {Object} event - Event model instance
 * @param {Object} seat - Seat model instance with seatType
 * @param {Object} user - User model instance
 * @param {Object} venue - Venue model instance
 * @returns {string} - PDF file path
 */
async function generateTicketPDF(ticket, event, seat, user, venue) {
  ensureUploadsDir();

  const filePath = path.join(UPLOADS_DIR, `${ticket.id}.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header background
      doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e');

      const logoPath = resolveLogoPath(venue.logoUrl);
      if (logoPath) {
        try {
          doc.image(logoPath, 30, 18, { width: 40, height: 40 });
        } catch (_) {}
      }

      // Title
      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('TICKETMASTER MX', 30, 20, { align: 'center' });

      doc
        .fillColor('#e0e0e0')
        .fontSize(10)
        .font('Helvetica')
        .text('Tu boleto oficial', 30, 50, { align: 'center' });

      // Event title
      doc
        .fillColor('#1a1a2e')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(event.title, 30, 100, { align: 'center' });

      // Divider
      doc.moveTo(30, 130).lineTo(doc.page.width - 30, 130).strokeColor('#cccccc').stroke();

      // Event details
      doc.fillColor('#333333').fontSize(10).font('Helvetica');

      const dateObj = new Date(event.date);
      const dateStr = dateObj.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const timeStr = dateObj.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit',
      });

      const leftCol = 30;
      const rightCol = doc.page.width / 2 + 10;
      let yPos = 145;
      const lineHeight = 18;

      doc.font('Helvetica-Bold').text('Fecha:', leftCol, yPos);
      doc.font('Helvetica').text(dateStr, leftCol + 50, yPos, { width: doc.page.width / 2 - 60 });
      yPos += lineHeight;

      doc.font('Helvetica-Bold').text('Hora:', leftCol, yPos);
      doc.font('Helvetica').text(timeStr, leftCol + 50, yPos);
      yPos += lineHeight;

      doc.font('Helvetica-Bold').text('Duración:', leftCol, yPos);
      doc.font('Helvetica').text(`${event.duration} min`, leftCol + 60, yPos);
      yPos += lineHeight;

      doc.font('Helvetica-Bold').text('Venue:', leftCol, yPos);
      doc.font('Helvetica').text(venue.name, leftCol + 50, yPos, { width: doc.page.width / 2 - 60 });
      yPos += lineHeight;

      doc.font('Helvetica-Bold').text('Dirección:', leftCol, yPos);
      doc.font('Helvetica').text(venue.address, leftCol + 65, yPos, { width: doc.page.width / 2 - 70 });
      yPos += lineHeight;

      // Divider
      doc.moveTo(30, yPos + 5).lineTo(doc.page.width - 30, yPos + 5).strokeColor('#cccccc').stroke();
      yPos += 20;

      // Seat info
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e').text('INFORMACIÓN DEL ASIENTO', leftCol, yPos);
      yPos += 18;

      const seatTypeName = seat.seatType ? seat.seatType.name : 'general';
      const seatColor = seat.seatType ? seat.seatType.color : '#9E9E9E';

      doc.rect(leftCol, yPos, 10, 10).fill(seatColor);
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(`Fila: ${seat.row}  |  Asiento: ${seat.col}  |  Etiqueta: ${seat.label}  |  Zona: ${seatTypeName.toUpperCase()}`, leftCol + 15, yPos);
      yPos += 20;

      doc.font('Helvetica-Bold').text('Precio:', leftCol, yPos);
      doc.font('Helvetica').text(`$${parseFloat(ticket.price).toFixed(2)} MXN`, leftCol + 50, yPos);
      yPos += 20;

      // Buyer info
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e').text('COMPRADOR', leftCol, yPos);
      yPos += 18;
      const fullName = [user.firstName, user.secondName, user.lastName, user.motherLastName]
        .filter(Boolean)
        .join(' ');
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(fullName, leftCol, yPos);
      yPos += 15;
      doc.text(`CURP: ${user.curp}`, leftCol, yPos);
      yPos += 20;

      // QR Code
      if (ticket.qrCode) {
        const qrBase64 = ticket.qrCode.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        const qrX = doc.page.width - 30 - 100;
        const qrY = 145;
        doc.image(qrBuffer, qrX, qrY, { width: 100, height: 100 });
        doc.font('Helvetica').fontSize(8).fillColor('#666666')
          .text('Código QR', qrX, qrY + 105, { width: 100, align: 'center' });
      }

      // Mini seat map
      doc.moveTo(30, yPos).lineTo(doc.page.width - 30, yPos).strokeColor('#cccccc').stroke();
      yPos += 10;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a2e').text('UBICACIÓN EN EL VENUE', leftCol, yPos);
      yPos += 12;

      const mapCols = Math.min(venue.totalCols || 10, 20);
      const mapRows = Math.min(venue.totalRows || 10, 10);
      const cellSize = Math.min(12, (doc.page.width - 60) / mapCols);

      for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
          const rowLabel = String.fromCharCode(65 + r);
          const isCurrentSeat = rowLabel === seat.row && (c + 1) === seat.col;
          const x = leftCol + c * cellSize;
          const y = yPos + r * cellSize;
          doc.rect(x, y, cellSize - 1, cellSize - 1)
            .fill(isCurrentSeat ? '#ff0000' : '#dddddd');
        }
      }

      yPos += mapRows * cellSize + 15;

      // Footer
      doc.moveTo(30, doc.page.height - 50).lineTo(doc.page.width - 30, doc.page.height - 50).strokeColor('#cccccc').stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#888888')
        .text(`Confirmación: ${ticket.id}`, 30, doc.page.height - 40, { align: 'center' });
      doc.text('Este boleto es personal e intransferible. Preséntalo al ingresar al evento.', 30, doc.page.height - 28, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateTicketPDF };
