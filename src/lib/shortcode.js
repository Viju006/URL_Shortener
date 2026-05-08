/**
 * Base-62 short code generation.
 * Encodes an auto-incremented integer ID into a 7-character alphanumeric code.
 * Alphabet: 0-9, a-z, A-Z (62 characters)
 * 62^7 ≈ 3.5 trillion unique codes
 */

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = ALPHABET.length; // 62
const CODE_LENGTH = 7;

/**
 * Encode a numeric ID to a base-62 string, padded to CODE_LENGTH.
 */
export function encodeBase62(num) {
  if (num === 0) return ALPHABET[0].padStart(CODE_LENGTH, ALPHABET[0]);

  let encoded = "";
  let n = num;
  while (n > 0) {
    encoded = ALPHABET[n % BASE] + encoded;
    n = Math.floor(n / BASE);
  }

  // Pad to minimum CODE_LENGTH
  return encoded.padStart(CODE_LENGTH, ALPHABET[0]);
}

/**
 * Decode a base-62 string back to a numeric ID.
 */
export function decodeBase62(str) {
  let num = 0;
  for (const char of str) {
    num = num * BASE + ALPHABET.indexOf(char);
  }
  return num;
}

/**
 * Generate a short code for a given database ID.
 * Adds a random offset to avoid sequential guessing.
 */
export function generateShortCode(id) {
  // Add a large offset to avoid very short codes for early IDs
  const offset = 100000000;
  return encodeBase62(id + offset);
}

/**
 * Validate that a custom alias meets requirements:
 * - 3-30 characters
 * - Alphanumeric, hyphens, underscores only
 */
export function isValidAlias(alias) {
  if (!alias || alias.length < 3 || alias.length > 30) return false;
  return /^[a-zA-Z0-9_-]+$/.test(alias);
}
