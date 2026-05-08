/**
 * URL validation helpers.
 */

/**
 * Validate that a string is a well-formed URL.
 * Must have http or https protocol.
 */
export function isValidUrl(str) {
  if (!str || typeof str !== "string") return false;

  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize a URL (lowercase protocol and hostname, remove trailing slash for root paths).
 */
export function normalizeUrl(str) {
  try {
    const url = new URL(str);
    // Keep the URL as-is but ensure protocol
    return url.toString();
  } catch {
    return str;
  }
}

/**
 * Get a display-friendly version of a URL (truncated).
 */
export function truncateUrl(url, maxLength = 60) {
  if (!url || url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}
