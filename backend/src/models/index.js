'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Venue = require('./Venue');
const SeatType = require('./SeatType');
const Seat = require('./Seat');
const Event = require('./Event');
const Reservation = require('./Reservation');
const Ticket = require('./Ticket');

// Venue <-> Seat
Venue.hasMany(Seat, { foreignKey: 'venue_id', as: 'seats' });
Seat.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// SeatType <-> Seat
SeatType.hasMany(Seat, { foreignKey: 'seat_type_id', as: 'seats' });
Seat.belongsTo(SeatType, { foreignKey: 'seat_type_id', as: 'seatType' });

// Venue <-> Event
Venue.hasMany(Event, { foreignKey: 'venue_id', as: 'events' });
Event.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// User <-> Event (created_by)
User.hasMany(Event, { foreignKey: 'created_by', as: 'createdEvents' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User <-> Reservation
User.hasMany(Reservation, { foreignKey: 'user_id', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event <-> Reservation
Event.hasMany(Reservation, { foreignKey: 'event_id', as: 'reservations' });
Reservation.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Seat <-> Reservation
Seat.hasMany(Reservation, { foreignKey: 'seat_id', as: 'reservations' });
Reservation.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

// User <-> Ticket
User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event <-> Ticket
Event.hasMany(Ticket, { foreignKey: 'event_id', as: 'tickets' });
Ticket.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Seat <-> Ticket
Seat.hasMany(Ticket, { foreignKey: 'seat_id', as: 'tickets' });
Ticket.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

// Reservation <-> Ticket
Reservation.hasOne(Ticket, { foreignKey: 'reservation_id', as: 'ticket' });
Ticket.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

module.exports = {
  sequelize,
  User,
  Venue,
  SeatType,
  Seat,
  Event,
  Reservation,
  Ticket,
};
