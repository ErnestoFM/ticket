'use strict';

const { generateCURP, validateCURP } = require('../../src/services/curp.service');

describe('CURP Service', () => {
  describe('generateCURP', () => {
    test('basic generation - male, CDMX', () => {
      const curp = generateCURP({
        firstName: 'JUAN',
        lastName: 'GARCIA',
        motherLastName: 'LOPEZ',
        birthDate: '1990-05-15',
        gender: 'H',
        birthState: 'DF',
      });
      expect(curp).toHaveLength(18);
      expect(curp.slice(0, 4)).toBe('GALJ');
      expect(curp.slice(4, 10)).toBe('900515');
      expect(curp[10]).toBe('H');
      expect(curp.slice(11, 13)).toBe('DF');
    });

    test('basic generation - female, Jalisco', () => {
      const curp = generateCURP({
        firstName: 'MARIA',
        lastName: 'HERNANDEZ',
        motherLastName: 'REYES',
        birthDate: '1985-12-01',
        gender: 'M',
        birthState: 'JC',
      });
      expect(curp).toHaveLength(18);
      expect(curp[10]).toBe('M');
      expect(curp.slice(11, 13)).toBe('JC');
      expect(curp.slice(4, 10)).toBe('851201');
    });

    test('name with JOSE prefix - uses second given name', () => {
      const curp = generateCURP({
        firstName: 'JOSE LUIS',
        lastName: 'MARTINEZ',
        motherLastName: 'SANCHEZ',
        birthDate: '1975-03-22',
        gender: 'H',
        birthState: 'NL',
      });
      expect(curp).toHaveLength(18);
      expect(curp[3]).toBe('L'); // LUIS initial at position 3
    });

    test('name with MARIA prefix - uses second given name', () => {
      const curp = generateCURP({
        firstName: 'MARIA FERNANDA',
        lastName: 'TORRES',
        motherLastName: 'VEGA',
        birthDate: '2001-07-04',
        gender: 'M',
        birthState: 'MC',
      });
      expect(curp).toHaveLength(18);
      expect(curp[3]).toBe('F'); // FERNANDA initial at position 3
    });

    test('born after 2000 - check digit is A', () => {
      const curp = generateCURP({
        firstName: 'SOFIA',
        lastName: 'RAMIREZ',
        motherLastName: 'MORALES',
        birthDate: '2005-09-30',
        gender: 'M',
        birthState: 'GT',
      });
      expect(curp[16]).toBe('A');
      expect(curp).toHaveLength(18);
    });

    test('born before 2000 - check digit is 0', () => {
      const curp = generateCURP({
        firstName: 'CARLOS',
        lastName: 'PEREZ',
        motherLastName: 'GUTIERREZ',
        birthDate: '1980-11-18',
        gender: 'H',
        birthState: 'VZ',
      });
      expect(curp[16]).toBe('0');
      expect(/\d/.test(curp[17])).toBe(true);
    });

    test('names with accents normalized correctly', () => {
      const curp = generateCURP({
        firstName: 'ANDRÉS',
        lastName: 'NÚÑEZ',
        motherLastName: 'MUÑOZ',
        birthDate: '1995-06-10',
        gender: 'H',
        birthState: 'OC',
      });
      expect(curp).toHaveLength(18);
      expect(typeof curp).toBe('string');
      expect(/^[A-Z0-9]+$/.test(curp)).toBe(true);
    });

    test('Baja California state code', () => {
      const curp = generateCURP({
        firstName: 'LUCIA',
        lastName: 'FLORES',
        motherLastName: 'CASTILLO',
        birthDate: '1992-02-28',
        gender: 'M',
        birthState: 'BC',
      });
      expect(curp.slice(11, 13)).toBe('BC');
    });

    test('Chiapas state code', () => {
      const curp = generateCURP({
        firstName: 'MIGUEL',
        lastName: 'DIAZ',
        motherLastName: 'RUIZ',
        birthDate: '1988-08-08',
        gender: 'H',
        birthState: 'CS',
      });
      expect(curp.slice(11, 13)).toBe('CS');
    });

    test('missing maternal last name defaults to X', () => {
      const curp = generateCURP({
        firstName: 'ANA',
        lastName: 'JIMENEZ',
        motherLastName: '',
        birthDate: '1970-01-01',
        gender: 'M',
        birthState: 'SP',
      });
      expect(curp).toHaveLength(18);
      expect(curp[2]).toBe('X');
    });

    test('born in foreign country - NE code', () => {
      const curp = generateCURP({
        firstName: 'PEDRO',
        lastName: 'SILVA',
        motherLastName: 'CAMPOS',
        birthDate: '1998-04-15',
        gender: 'H',
        birthState: 'NE',
      });
      expect(curp.slice(11, 13)).toBe('NE');
    });

    test('all characters are uppercase alphanumeric', () => {
      const curp = generateCURP({
        firstName: 'ROBERTO',
        lastName: 'GONZALEZ',
        motherLastName: 'HERRERA',
        birthDate: '1965-07-20',
        gender: 'H',
        birthState: 'YN',
      });
      expect(/^[A-Z0-9]+$/.test(curp)).toBe(true);
      expect(curp).toHaveLength(18);
    });
  });

  describe('validateCURP', () => {
    test('valid CURP passes validation', () => {
      // Generate valid CURPs and validate them
      const curp1 = generateCURP({
        firstName: 'JUAN', lastName: 'GARCIA', motherLastName: 'LOPEZ',
        birthDate: '1990-05-15', gender: 'H', birthState: 'DF',
      });
      const curp2 = generateCURP({
        firstName: 'ANA', lastName: 'HERNANDEZ', motherLastName: 'REYES',
        birthDate: '1985-12-01', gender: 'M', birthState: 'JC',
      });
      expect(validateCURP(curp1)).toBe(true);
      expect(validateCURP(curp2)).toBe(true);
    });

    test('wrong length fails validation', () => {
      expect(validateCURP('GAJI9005')).toBe(false);
      expect(validateCURP('GAJI900515HDFRLX060012345')).toBe(false);
    });

    test('invalid gender character fails', () => {
      expect(validateCURP('GAJI900515XDFRLX060')).toBe(false);
    });

    test('null/undefined fails validation', () => {
      expect(validateCURP(null)).toBe(false);
      expect(validateCURP(undefined)).toBe(false);
      expect(validateCURP('')).toBe(false);
    });

    test('lowercase fails validation', () => {
      const validCurp = generateCURP({
        firstName: 'PEDRO', lastName: 'SILVA', motherLastName: 'CAMPOS',
        birthDate: '1990-01-01', gender: 'H', birthState: 'DF',
      });
      expect(validateCURP(validCurp.toLowerCase())).toBe(false);
    });
  });
});
