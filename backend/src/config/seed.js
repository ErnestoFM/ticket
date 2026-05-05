'use strict';

require('dotenv').config();
const sequelize = require('./database');
const { User, Venue, Event, Seat, SeatType, Ticket } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function runSeed() {
  try {
    console.log('Starting seed...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // Clear existing data safely
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Ticket.truncate({ cascade: true });
    await Seat.truncate({ cascade: true });
    await Event.truncate({ cascade: true });
    await Venue.truncate({ cascade: true });
    await SeatType.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Tables cleared.');

    // Create Admin and Users
    await User.create({
      firstName: 'Admin',
      lastName: 'System',
      curp: 'ADMI123456HDFABC12',
      password: 'Password123!',
      phone: '5555555550',
      birthDate: '1980-01-01',
      birthState: 'DF',
      gender: 'H',
      role: 'admin',
    });

    await User.create({
      firstName: 'Juan',
      lastName: 'Pérez',
      curp: 'USER123456HDFABC13',
      password: 'Password123!',
      phone: '5555555551',
      birthDate: '1990-05-15',
      birthState: 'DF',
      gender: 'H',
      role: 'user',
    });

    await User.create({
      firstName: 'María',
      lastName: 'González',
      curp: 'USER123456MDFABC14',
      password: 'Password123!',
      phone: '5555555552',
      birthDate: '1995-10-20',
      birthState: 'DF',
      gender: 'M',
      role: 'user',
    });
    console.log('Users created.');

    // Create SeatTypes
    const stGeneral = await SeatType.create({ name: 'general', color: '#808080', multiplier: 1.00 });
    const stPreferente = await SeatType.create({ name: 'preferente', color: '#0000FF', multiplier: 1.50 });
    const stVip = await SeatType.create({ name: 'vip', color: '#FFD700', multiplier: 2.50 });
    const stPalco = await SeatType.create({ name: 'palco', color: '#800080', multiplier: 2.00 });
    console.log('Seat types created.');

    // Create Venues
    const vTeatro = await Venue.create({
      name: 'Teatro Principal',
      address: 'Av. Siempre Viva 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      type: 'teatro',
      totalRows: 5,
      totalCols: 10,
    });

    const vCine = await Venue.create({
      name: 'Cinépolis Centro',
      address: 'Plaza Central Local 5',
      city: 'Guadalajara',
      state: 'Jalisco',
      type: 'cine',
      totalRows: 8,
      totalCols: 12,
    });

    const vMuseo = await Venue.create({
      name: 'Museo de Arte Moderno',
      address: 'Parque Chapultepec s/n',
      city: 'Ciudad de México',
      state: 'CDMX',
      type: 'museo',
      totalRows: 2,
      totalCols: 5,
    });
    console.log('Venues created.');

    // Generate Seats for Venues
    const generateSeats = async (venue) => {
      const seats = [];
      const rows = venue.totalRows;
      const cols = venue.totalCols;

      for (let r = 0; r < rows; r++) {
        const rowChar = String.fromCharCode(65 + r);
        let seatTypeId = stGeneral.id;

        if (r === 0) seatTypeId = stVip.id;
        else if (r === 1) seatTypeId = stPreferente.id;
        else if (r === rows - 1 && venue.type === 'teatro') seatTypeId = stPalco.id;
        
        for (let c = 1; c <= cols; c++) {
          seats.push({
            id: uuidv4(),
            venueId: venue.id,
            seatTypeId: seatTypeId,
            row: rowChar,
            col: c,
            label: `${rowChar}${c}`,
            isActive: true,
          });
        }
      }
      await Seat.bulkCreate(seats);
    };

    await generateSeats(vTeatro);
    await generateSeats(vCine);
    await generateSeats(vMuseo);
    console.log('Seats generated.');

    // Fetch the admin user to use as creator
    const admin = await User.findOne({ where: { curp: 'ADMI123456HDFABC12' } });

    // Create Events
    const events = [
      {
        venueId: vTeatro.id,
        title: 'El Lago de los Cisnes',
        description: 'Ballet clásico en dos actos.',
        type: 'teatro',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        duration: 120,
        basePrice: 500.00,
        createdBy: admin.id,
      },
      {
        venueId: vCine.id,
        title: 'Avengers: Secret Wars',
        description: 'Estreno mundial de Marvel.',
        type: 'cine',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        duration: 180,
        basePrice: 150.00,
        createdBy: admin.id,
      },
      {
        venueId: vMuseo.id,
        title: 'Noche de Museos: Frida Kahlo',
        description: 'Recorrido nocturno y exposición especial.',
        type: 'museo',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        duration: 90,
        basePrice: 100.00,
        createdBy: admin.id,
      },
      {
        venueId: vTeatro.id,
        title: 'Stand Up Comedy Tour',
        description: 'Las mejores risas de la temporada.',
        type: 'teatro',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        duration: 100,
        basePrice: 400.00,
        createdBy: admin.id,
      },
      {
        venueId: vCine.id,
        title: 'Inception - 15th Anniversary',
        description: 'Reestreno de la película clásica de Nolan.',
        type: 'cine',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        duration: 150,
        basePrice: 120.00,
        createdBy: admin.id,
      }
    ];

    await Event.bulkCreate(events.map(e => ({ ...e, id: uuidv4() })));
    console.log('Events created.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

runSeed();
