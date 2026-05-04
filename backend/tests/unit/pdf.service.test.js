'use strict';

const path = require('path');
const fs = require('fs');

// Mock fs to avoid actual file system writes
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn().mockImplementation(() => {
    const { EventEmitter } = require('events');
    const ws = new EventEmitter();
    ws.write = jest.fn();
    ws.end = jest.fn(() => ws.emit('finish'));
    return ws;
  }),
}));

const { generateTicketPDF } = require('../../src/services/pdf.service');

const mockTicket = {
  id: 'ticket-uuid-1234',
  price: 250.00,
  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

const mockEvent = {
  id: 'event-uuid-5678',
  title: 'Concierto de Prueba',
  date: new Date('2025-06-15T20:00:00'),
  duration: 120,
  basePrice: 200.00,
  toJSON: () => ({ id: 'event-uuid-5678', title: 'Concierto de Prueba' }),
};

const mockSeat = {
  id: 'seat-uuid-9012',
  row: 'A',
  col: 5,
  label: 'A5',
  seatType: {
    name: 'vip',
    color: '#FFD700',
    multiplier: 2.50,
  },
  toJSON: () => ({ id: 'seat-uuid-9012', row: 'A', col: 5 }),
};

const mockUser = {
  id: 'user-uuid-abcd',
  firstName: 'Juan',
  secondName: null,
  lastName: 'García',
  motherLastName: 'López',
  curp: 'GALJ900515HDFRLX06',
};

const mockVenue = {
  id: 'venue-uuid-efgh',
  name: 'Teatro Nacional',
  address: 'Av. Principal 123, CDMX',
  totalRows: 10,
  totalCols: 20,
  logoUrl: null,
};

describe('PDF Service - generateTicketPDF', () => {
  test('generates a PDF and returns a file path', async () => {
    const filePath = await generateTicketPDF(mockTicket, mockEvent, mockSeat, mockUser, mockVenue);

    expect(filePath).toBeTruthy();
    expect(typeof filePath).toBe('string');
    expect(filePath).toContain(mockTicket.id);
    expect(filePath).toContain('.pdf');
  });

  test('returned path is inside uploads/tickets directory', async () => {
    const filePath = await generateTicketPDF(mockTicket, mockEvent, mockSeat, mockUser, mockVenue);

    expect(filePath).toContain('uploads');
    expect(filePath).toContain('tickets');
  });

  test('handles ticket without QR code gracefully', async () => {
    const ticketWithoutQR = { ...mockTicket, qrCode: null };

    const filePath = await generateTicketPDF(ticketWithoutQR, mockEvent, mockSeat, mockUser, mockVenue);
    expect(filePath).toBeTruthy();
  });

  test('handles event with null venue logo', async () => {
    const venueNoLogo = { ...mockVenue, logoUrl: null };

    const filePath = await generateTicketPDF(mockTicket, mockEvent, mockSeat, mockUser, venueNoLogo);
    expect(filePath).toBeTruthy();
  });

  test('handles seat without seatType', async () => {
    const seatNoType = { ...mockSeat, seatType: null };

    const filePath = await generateTicketPDF(mockTicket, mockEvent, seatNoType, mockUser, mockVenue);
    expect(filePath).toBeTruthy();
  });

  test('handles user with all name fields', async () => {
    const fullNameUser = {
      ...mockUser,
      firstName: 'Juan',
      secondName: 'Carlos',
      lastName: 'García',
      motherLastName: 'López',
    };

    const filePath = await generateTicketPDF(mockTicket, mockEvent, mockSeat, fullNameUser, mockVenue);
    expect(filePath).toBeTruthy();
  });

  test('handles user with minimal name fields', async () => {
    const minimalUser = {
      ...mockUser,
      secondName: null,
      motherLastName: null,
    };

    const filePath = await generateTicketPDF(mockTicket, mockEvent, mockSeat, minimalUser, mockVenue);
    expect(filePath).toBeTruthy();
  });
});
