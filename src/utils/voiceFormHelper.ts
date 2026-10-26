/**
 * Voice form helpers for speech parsing:
 * - Digit recognition in Urdu, Punjabi, and English (including words like صفر، ایک، دو، تین سو)
 * - Formatting to 03XX-XXXXXXX
 * - Spoken email parsing (at the rate -> @, ڈاٹ کام -> .com)
 */

// Digit mapping for spoken numbers
const digitWords: Record<string, string> = {
  // English
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  // Urdu / Shahmukhi
  'صفر': '0',
  'ایک': '1',
  'اک': '1',
  'دو': '2',
  'تین': '3',
  'ترے': '3',
  'چار': '4',
  'پانچ': '5',
  'پنج': '5',
  'چھ': '6',
  'چھی': '6',
  'سات': '7',
  'ست': '7',
  'آٹھ': '8',
  'اٹھ': '8',
  'نو': '9',
  // Punjabi Gurmukhi
  'ਸਿਫ਼ਰ': '0',
  'ਇੱਕ': '1',
  'ਦੋ': '2',
  'ਤਿੰਨ': '3',
  'ਚਾਰ': '4',
  'ਪੰਜ': '5',
  'ਛੇ': '6',
  'ਸੱਤ': '7',
  'ਅੱਠ': '8',
  'ਨੌਂ': '9',
};

// Convert spoken phone sentence or digit sequence to cleaned 11-digit Pakistani phone
export function parseSpokenPhoneNumber(spoken: string): string {
  if (!spoken) return '';
  let text = spoken.toLowerCase().trim();

  // Replace common spoken bundle words
  text = text.replace(/تین سو/g, '300');
  text = text.replace(/تین سو ایک/g, '301');
  text = text.replace(/تین سو دو/g, '302');
  text = text.replace(/تین سو تین/g, '303');
  text = text.replace(/تین سو چار/g, '304');
  text = text.replace(/تین سو پانچ/g, '305');
  text = text.replace(/تین سو چھ/g, '306');
  text = text.replace(/تین سو سات/g, '307');
  text = text.replace(/تین سو آٹھ/g, '308');
  text = text.replace(/تین سو نو/g, '309');
  text = text.replace(/three hundred/g, '300');

  // Convert individual words to digits
  const words = text.split(/\s+/);
  const converted = words
    .map((w) => digitWords[w] || w)
    .join('');

  // Extract all digit characters
  const rawDigits = converted.replace(/\D/g, '');

  // Normalize Pakistani mobile to 03XXXXXXXXX (11 digits)
  let cleanDigits = rawDigits;
  if (cleanDigits.startsWith('923') && cleanDigits.length === 12) {
    cleanDigits = '0' + cleanDigits.slice(2);
  } else if (cleanDigits.startsWith('3') && cleanDigits.length === 10) {
    cleanDigits = '0' + cleanDigits;
  }

  // Format as 03XX-XXXXXXX if length is sufficient
  if (cleanDigits.length >= 4) {
    const prefix = cleanDigits.slice(0, 4);
    const rest = cleanDigits.slice(4, 11);
    return `${prefix}-${rest}`.replace(/-$/, '');
  }

  return cleanDigits;
}

// Convert spoken email to clean valid email address
export function parseSpokenEmail(spoken: string): string {
  if (!spoken) return '';
  let text = spoken.toLowerCase().trim();

  // Normalize "at the rate", "ایٹ", "@"
  text = text.replace(/\s*(at the rate|at rate|@|ایٹ دی ریٹ|ایٹ)\s*/g, '@');

  // Normalize "dot com", "ڈاٹ کام", "ڈاٹ"
  text = text.replace(/\s*(dot com|ڈاٹ کام|\.com)\s*/g, '.com');
  text = text.replace(/\s*(dot net|ڈاٹ نیٹ|\.net)\s*/g, '.net');
  text = text.replace(/\s*(dot pk|ڈاٹ پی کے|\.pk)\s*/g, '.pk');
  text = text.replace(/\s*(dot|ڈاٹ|\.)\s*/g, '.');

  // Remove spaces
  text = text.replace(/\s+/g, '');

  // If user spoke only username without domain, append @gmail.com as helpful default
  if (!text.includes('@') && text.length > 0) {
    text = `${text}@gmail.com`;
  }

  return text;
}
