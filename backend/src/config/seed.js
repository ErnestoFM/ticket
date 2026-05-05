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
      // 5 Original Events
      { venueId: vTeatro.id, title: 'El Lago de los Cisnes', description: 'Ballet clásico en dos actos.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), duration: 120, basePrice: 500.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Avengers: Secret Wars', description: 'Estreno mundial de Marvel.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), duration: 180, basePrice: 150.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Noche de Museos: Frida Kahlo', description: 'Recorrido nocturno y exposición especial.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), duration: 90, basePrice: 100.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Stand Up Comedy Tour', description: 'Las mejores risas de la temporada.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), duration: 100, basePrice: 400.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Inception - 15th Anniversary', description: 'Reestreno de la película clásica de Nolan.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), duration: 150, basePrice: 120.00, createdBy: admin.id },
      
      // 20 New Events
      // Teatro
      { venueId: vTeatro.id, title: 'El Fantasma de la Ópera', description: 'El aclamado musical de Broadway.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12), duration: 150, basePrice: 800.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Romeo y Julieta', description: 'Clásico de Shakespeare en vivo.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 16), duration: 130, basePrice: 450.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Los Miserables', description: 'Un musical inolvidable que tocará tu corazón.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), duration: 160, basePrice: 750.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Improvisa2', description: 'Show de improvisación teatral interactivo.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25), duration: 90, basePrice: 200.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Cats', description: 'El espectacular musical de Andrew Lloyd Webber.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), duration: 140, basePrice: 600.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Hamlet', description: 'Ser o no ser, la eterna duda sobre el escenario.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35), duration: 120, basePrice: 350.00, createdBy: admin.id },
      { venueId: vTeatro.id, title: 'Monólogo de la Vida', description: 'Una reflexión profunda y divertida sobre la existencia.', type: 'teatro', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40), duration: 80, basePrice: 250.00, createdBy: admin.id },
      
      // Cine
      { venueId: vCine.id, title: 'Spider-Man: Beyond the Spider-Verse', description: 'El asombroso final de la trilogía animada.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), duration: 140, basePrice: 150.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Dune: Part Three', description: 'La épica conclusión de la saga de Arrakis.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8), duration: 170, basePrice: 160.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Star Wars: New Jedi Order', description: 'El esperado regreso de Rey Skywalker.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), duration: 150, basePrice: 140.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Oppenheimer', description: 'Proyección especial en formato IMAX 70mm.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18), duration: 180, basePrice: 200.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Maratón: El Señor de los Anillos', description: 'Versiones extendidas de la trilogía completa.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22), duration: 720, basePrice: 400.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Interstellar - Reestreno', description: 'El aclamado clásico de ciencia ficción de Christopher Nolan.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28), duration: 169, basePrice: 130.00, createdBy: admin.id },
      { venueId: vCine.id, title: 'Festival de Cortos Independientes', description: 'Selección exclusiva de cine de autor internacional.', type: 'cine', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 32), duration: 120, basePrice: 90.00, createdBy: admin.id },
      
      // Museo
      { venueId: vMuseo.id, title: 'Exposición: Leonardo Da Vinci', description: 'Diseños, inspiración y maquinaria del genio.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), duration: 120, basePrice: 120.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Van Gogh Inmersivo', description: 'Vive sus maravillosas obras desde adentro.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9), duration: 60, basePrice: 250.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Arte Contemporáneo 2026', description: 'Descubre las nuevas voces del arte mundial.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13), duration: 90, basePrice: 80.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Taller de Pintura Surrealista', description: 'Aprende a pintar y expresarte como Salvador Dalí.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 19), duration: 180, basePrice: 300.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Exposición: Civilizaciones Perdidas', description: 'Maravillosos restos y piezas de culturas antiguas.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 24), duration: 120, basePrice: 150.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Fotografía Nacional', description: 'Exposición de paisajes y retratos de todo México.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 27), duration: 60, basePrice: 50.00, createdBy: admin.id },
      { venueId: vMuseo.id, title: 'Esculturas de Hielo', description: 'Arte efímero internacional en salas climatizadas.', type: 'museo', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 33), duration: 45, basePrice: 100.00, createdBy: admin.id }
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
