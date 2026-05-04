'use strict';

// Mock dependencies before requiring the service
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisKeys = jest.fn();

jest.mock('../../src/config/redis', () => ({
  get: mockRedisGet,
  set: mockRedisSet,
  del: mockRedisDel,
  keys: mockRedisKeys,
  on: jest.fn(),
}));

const mockReservationFindOne = jest.fn();
const mockReservationFindAll = jest.fn();
const mockReservationCreate = jest.fn();
const mockReservationUpdate = jest.fn();

const mockTicketFindOne = jest.fn();

jest.mock('../../src/models', () => ({
  Reservation: {
    findOne: mockReservationFindOne,
    findAll: mockReservationFindAll,
    create: mockReservationCreate,
  },
  Ticket: {
    findOne: mockTicketFindOne,
  },
}));

const {
  holdSeat,
  confirmReservation,
  expireReservations,
  cancelReservation,
} = require('../../src/services/reservation.service');

const MOCK_USER_ID = 'user-uuid-1234';
const MOCK_EVENT_ID = 'event-uuid-5678';
const MOCK_SEAT_ID = 'seat-uuid-9012';
const MOCK_RESERVATION_ID = 'reservation-uuid-abcd';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReservationService - holdSeat', () => {
  test('successfully holds an available seat', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockTicketFindOne.mockResolvedValue(null);
    mockReservationFindOne.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
    mockReservationCreate.mockResolvedValue({
      id: MOCK_RESERVATION_ID,
      userId: MOCK_USER_ID,
      eventId: MOCK_EVENT_ID,
      seatId: MOCK_SEAT_ID,
    });

    const result = await holdSeat(MOCK_USER_ID, MOCK_EVENT_ID, MOCK_SEAT_ID, 300);

    expect(result).toHaveProperty('reservationId');
    expect(result).toHaveProperty('expiresAt');
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(mockReservationCreate).toHaveBeenCalledTimes(1);
  });

  test('throws 409 if seat is held in Redis', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ userId: 'other-user', reservationId: 'other-res' }));

    await expect(holdSeat(MOCK_USER_ID, MOCK_EVENT_ID, MOCK_SEAT_ID)).rejects.toMatchObject({
      status: 409,
    });
  });

  test('throws 409 if seat already has a ticket', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockTicketFindOne.mockResolvedValue({ id: 'existing-ticket' });

    await expect(holdSeat(MOCK_USER_ID, MOCK_EVENT_ID, MOCK_SEAT_ID)).rejects.toMatchObject({
      status: 409,
    });
  });

  test('throws 409 if active DB reservation exists', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockTicketFindOne.mockResolvedValue(null);
    mockReservationFindOne.mockResolvedValue({ id: 'existing-reservation' });

    await expect(holdSeat(MOCK_USER_ID, MOCK_EVENT_ID, MOCK_SEAT_ID)).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('ReservationService - confirmReservation', () => {
  test('successfully confirms a valid reservation', async () => {
    const mockReservation = {
      id: MOCK_RESERVATION_ID,
      userId: MOCK_USER_ID,
      eventId: MOCK_EVENT_ID,
      seatId: MOCK_SEAT_ID,
      expiresAt: new Date(Date.now() + 60000),
      status: 'held',
      update: jest.fn().mockResolvedValue(true),
    };

    mockReservationFindOne.mockResolvedValue(mockReservation);
    mockRedisGet.mockResolvedValue(JSON.stringify({ userId: MOCK_USER_ID, reservationId: MOCK_RESERVATION_ID }));
    mockRedisDel.mockResolvedValue(1);

    const result = await confirmReservation(MOCK_RESERVATION_ID, MOCK_USER_ID);

    expect(mockReservation.update).toHaveBeenCalledWith({ status: 'confirmed' });
    expect(mockRedisDel).toHaveBeenCalled();
  });

  test('throws 404 if reservation not found', async () => {
    mockReservationFindOne.mockResolvedValue(null);

    await expect(confirmReservation(MOCK_RESERVATION_ID, MOCK_USER_ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  test('throws 410 if reservation is expired', async () => {
    const expiredReservation = {
      id: MOCK_RESERVATION_ID,
      userId: MOCK_USER_ID,
      eventId: MOCK_EVENT_ID,
      seatId: MOCK_SEAT_ID,
      expiresAt: new Date(Date.now() - 1000),
      status: 'held',
      update: jest.fn().mockResolvedValue(true),
    };

    mockReservationFindOne.mockResolvedValue(expiredReservation);
    mockRedisDel.mockResolvedValue(1);

    await expect(confirmReservation(MOCK_RESERVATION_ID, MOCK_USER_ID)).rejects.toMatchObject({
      status: 410,
    });
  });

  test('throws 410 if Redis key is missing', async () => {
    const validReservation = {
      id: MOCK_RESERVATION_ID,
      userId: MOCK_USER_ID,
      eventId: MOCK_EVENT_ID,
      seatId: MOCK_SEAT_ID,
      expiresAt: new Date(Date.now() + 60000),
      status: 'held',
      update: jest.fn().mockResolvedValue(true),
    };

    mockReservationFindOne.mockResolvedValue(validReservation);
    mockRedisGet.mockResolvedValue(null);

    await expect(confirmReservation(MOCK_RESERVATION_ID, MOCK_USER_ID)).rejects.toMatchObject({
      status: 410,
    });
  });
});

describe('ReservationService - expireReservations', () => {
  test('expires held reservations past expiresAt', async () => {
    const mockExpired = [
      {
        id: 'res-1',
        eventId: MOCK_EVENT_ID,
        seatId: MOCK_SEAT_ID,
        update: jest.fn().mockResolvedValue(true),
      },
      {
        id: 'res-2',
        eventId: MOCK_EVENT_ID,
        seatId: 'seat-2',
        update: jest.fn().mockResolvedValue(true),
      },
    ];

    mockReservationFindAll.mockResolvedValue(mockExpired);
    mockRedisDel.mockResolvedValue(1);

    const count = await expireReservations();

    expect(count).toBe(2);
    expect(mockExpired[0].update).toHaveBeenCalledWith({ status: 'expired' });
    expect(mockExpired[1].update).toHaveBeenCalledWith({ status: 'expired' });
  });

  test('returns 0 when no expired reservations', async () => {
    mockReservationFindAll.mockResolvedValue([]);

    const count = await expireReservations();
    expect(count).toBe(0);
  });
});

describe('ReservationService - cancelReservation', () => {
  test('successfully cancels a held reservation', async () => {
    const mockReservation = {
      id: MOCK_RESERVATION_ID,
      userId: MOCK_USER_ID,
      eventId: MOCK_EVENT_ID,
      seatId: MOCK_SEAT_ID,
      update: jest.fn().mockResolvedValue(true),
    };

    mockReservationFindOne.mockResolvedValue(mockReservation);
    mockRedisDel.mockResolvedValue(1);

    const result = await cancelReservation(MOCK_RESERVATION_ID, MOCK_USER_ID);

    expect(mockReservation.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mockRedisDel).toHaveBeenCalled();
  });

  test('throws 404 if reservation not found or not in held status', async () => {
    mockReservationFindOne.mockResolvedValue(null);

    await expect(cancelReservation(MOCK_RESERVATION_ID, MOCK_USER_ID)).rejects.toMatchObject({
      status: 404,
    });
  });
});
