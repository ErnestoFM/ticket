'use strict';

// Mexican state INEGI codes for CURP generation
const STATE_CODES = {
  AS: 'AS', // Aguascalientes
  BC: 'BC', // Baja California
  BS: 'BS', // Baja California Sur
  CC: 'CC', // Campeche
  CS: 'CS', // Chiapas
  CH: 'CH', // Chihuahua
  DF: 'DF', // Ciudad de México
  DG: 'DG', // Durango
  GT: 'GT', // Guanajuato
  GR: 'GR', // Guerrero
  HG: 'HG', // Hidalgo
  JC: 'JC', // Jalisco
  MC: 'MC', // Estado de México
  MN: 'MN', // Michoacán
  MS: 'MS', // Morelos
  NT: 'NT', // Nayarit
  NL: 'NL', // Nuevo León
  OC: 'OC', // Oaxaca
  PL: 'PL', // Puebla
  QT: 'QT', // Querétaro
  QR: 'QR', // Quintana Roo
  SP: 'SP', // San Luis Potosí
  SL: 'SL', // Sinaloa
  SR: 'SR', // Sonora
  TC: 'TC', // Tabasco
  TS: 'TS', // Tamaulipas
  TL: 'TL', // Tlaxcala
  VZ: 'VZ', // Veracruz
  YN: 'YN', // Yucatán
  ZS: 'ZS', // Zacatecas
  CL: 'CL', // Colima
  NE: 'NE', // Nacido en el Extranjero
};

// Inconvenient words filter per official CURP rules
const INCONVENIENT_WORDS = [
  'BACA','BAKA','BUEI','BUEY','CACA','CACO','CAGA','CAGO','CAKA','CAKO',
  'COGE','COGI','COJA','COJE','COJI','COJO','COLA','CULO','FALO','FETO',
  'GETA','GUEI','GUEY','JETA','JOTO','KACA','KACO','KAGA','KAGO','KAKA',
  'KAKO','KOGE','KOGI','KOJA','KOJE','KOJI','KOJO','KOLA','KULO','LELO',
  'LOCA','LOCO','LOKA','LOKO','MAME','MAMO','MEAR','MEAS','MEON','MIAR',
  'MION','MOCO','MOKO','MULA','MULO','NACA','NACO','PEDA','PEDO','PENE',
  'PIPI','PITO','POPO','PUTA','PUTO','QULO','RATA','ROBA','ROBE','ROBO',
  'RUIN','SENO','TETA','VACA','VAGA','VAGO','VAKA','VUEI','VUEY','WUEI',
  'WUEY',
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const CONSONANTS = new Set([
  'B','C','D','F','G','H','J','K','L','M','N','Ñ','P','Q','R','S','T','V','W','X','Y','Z',
]);

// Normalize string: remove accents, special characters, convert to uppercase
function normalize(str) {
  if (!str) return '';
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'X') // temporary placeholder
    .replace(/[^A-Z]/g, '');
}

// Normalize preserving Ñ for consonant extraction
function normalizeKeepN(str) {
  if (!str) return '';
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-ZÑ]/g, '');
}

// Common particles to ignore in names
const PARTICLES = new Set([
  'DE','DEL','LA','LAS','LOS','Y','MAC','MC','VON','VAN','DA','DAS','DO',
  'DOS','DI','DU','MI','SAN','SANTA','SANTO','FRAY','SOR','JOSE','MARIA',
]);

function cleanNameParts(parts) {
  const cleaned = parts
    .map((p) => p.toUpperCase().trim())
    .filter((p) => p.length > 0 && !PARTICLES.has(p));
  return cleaned;
}

function getFirstInternalVowel(word) {
  const w = normalize(word);
  for (let i = 1; i < w.length; i++) {
    if (VOWELS.has(w[i])) return w[i];
  }
  return 'X';
}

function getFirstInternalConsonant(word) {
  const w = normalizeKeepN(word).replace(/Ñ/g, 'X');
  for (let i = 1; i < w.length; i++) {
    if (!VOWELS.has(w[i]) && w[i] !== 'X') {
      return w[i];
    }
  }
  return 'X';
}

function replaceInconvenientWord(word4) {
  if (INCONVENIENT_WORDS.includes(word4)) {
    return word4[0] + 'X' + word4[2] + word4[3];
  }
  return word4;
}

/**
 * Generate a CURP from user data.
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.secondName (optional, ignored for CURP)
 * @param {string} params.lastName - paternal last name
 * @param {string} params.motherLastName - maternal last name
 * @param {Date|string} params.birthDate
 * @param {string} params.gender - 'H' or 'M'
 * @param {string} params.birthState - 2-letter INEGI state code
 * @returns {string} 18-character CURP
 */
function generateCURP({ firstName, lastName, motherLastName, birthDate, gender, birthState }) {
  const paternalParts = cleanNameParts(lastName.split(/\s+/));
  const maternalParts = motherLastName ? cleanNameParts(motherLastName.split(/\s+/)) : [];
  const firstNameParts = cleanNameParts(firstName.split(/\s+/));

  const paternal = paternalParts[0] || 'X';
  const maternal = maternalParts[0] || 'X';

  // Use compound name: skip "JOSE" / "MARIA" if present as first element
  let nameWord = firstNameParts[0] || 'X';
  if (
    (nameWord === 'JOSE' || nameWord === 'MARIA') &&
    firstNameParts.length > 1
  ) {
    nameWord = firstNameParts[1];
  }

  const normalPaternal = normalize(paternal);
  const normalMaternal = normalize(maternal);
  const normalName = normalize(nameWord);

  // Part 1: First letter of paternal last name + first internal vowel of paternal last name
  const p1 = (normalPaternal[0] || 'X') + getFirstInternalVowel(paternal);

  // Part 2: First letter of maternal last name
  const p2 = normalMaternal[0] || 'X';

  // Part 3: First letter of first name
  const p3 = normalName[0] || 'X';

  // Part 4: Birth date YYMMDD
  const date = new Date(birthDate);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const p4 = yy + mm + dd;

  // Part 5: Gender H or M
  const p5 = gender.toUpperCase() === 'H' ? 'H' : 'M';

  // Part 6: State code
  const stateCode = STATE_CODES[birthState.toUpperCase()] || 'NE';
  const p6 = stateCode;

  // Part 7: First internal consonant of paternal last name
  const p7 = getFirstInternalConsonant(paternal);

  // Part 8: First internal consonant of maternal last name
  const p8 = getFirstInternalConsonant(maternal);

  // Part 9: First internal consonant of first name
  const p9 = getFirstInternalConsonant(nameWord);

  // Part 10: Century character (0 for born before 2000, A for 2000 or after)
  const fullYear = date.getFullYear();
  const p10 = fullYear >= 2000 ? 'A' : '0';

  const rawCurp17 = (p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10).toUpperCase();

  // Replace inconvenient word in first 4 characters
  const first4 = replaceInconvenientWord(rawCurp17.slice(0, 4));
  const curp17 = first4 + rawCurp17.slice(4);

  // Part 11: Verification digit (18th character)
  const verificationDigit = computeVerificationDigit(curp17);

  return curp17 + verificationDigit;
}

// Character value table for verification digit computation
const CHAR_VALUES = {};
'0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  CHAR_VALUES[c] = i;
});

/**
 * Compute the RENAPO verification digit for a 17-character CURP.
 * @param {string} curp17 - 17-character CURP string
 * @returns {string} single digit (0-9)
 */
function computeVerificationDigit(curp17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const val = CHAR_VALUES[curp17[i]] !== undefined ? CHAR_VALUES[curp17[i]] : 0;
    sum += val * (18 - i);
  }
  const remainder = sum % 10;
  return String((10 - remainder) % 10);
}

/**
 * Validate CURP format.
 * @param {string} curp
 * @returns {boolean}
 */
function validateCURP(curp) {
  if (!curp || typeof curp !== 'string') return false;
  const upper = curp.toUpperCase();
  if (upper !== curp) return false; // Must already be uppercase
  const pattern = /^[A-Z]{4}\d{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
  return pattern.test(curp);
}

module.exports = { generateCURP, validateCURP, STATE_CODES };
