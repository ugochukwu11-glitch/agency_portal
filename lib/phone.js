export function normalizePhone(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  let stripped = raw.replace(/^=+/, '');
  stripped = stripped.replace(/\s+/g, '');
  let digits = stripped.replace(/\D+/g, '');

  // Nigeria convenience normalization: 0XXXXXXXXXX -> 234XXXXXXXXXX
  if (digits.startsWith('0') && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }

  return digits;
}
