/**
 * Shared utilities for moderation handlers (badwords, spam, etc.)
 * Centralizes common functions to avoid code duplication.
 */

// Zero-width characters that can be used to obfuscate text
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

/**
 * Strip diacritics (accents) from text for normalization.
 * @param {string} str - Input string
 * @returns {string} String without diacritics
 */
function stripDiacritics(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
}

/**
 * Normalize symbols and whitespace in text.
 * Replaces common obfuscation symbols with spaces.
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
function normalizeSymbols(str) {
  return str
    .replace(/[\u00A0]/g, " ") // non-breaking space
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(/\*/g, "") // remove stars (for p**n -> pn)
    .replace(/[\-_. ,/\\+~=`'"()\[\]{}<>^%$#@!?;:|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert leetspeak characters to normal letters.
 * @param {string} str - Input string
 * @returns {string} String with leetspeak converted
 */
function normalizeLeetspeak(str) {
  return str
    .replace(/0/g, "o")
    .replace(/[1l!|]/g, "i")
    .replace(/[3?]/g, "e")
    .replace(/4|@/g, "a")
    .replace(/5|\$/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g");
}

/**
 * Compress repeated characters to a maximum count.
 * Helps detect stretched text like "heeeeello" -> "heello"
 * @param {string} str - Input string
 * @param {number} maxRepeats - Maximum allowed consecutive repeats (default: 2)
 * @returns {string} Compressed string
 */
function compressRepeats(str, maxRepeats = 2) {
  return str.replace(/(.)\1{2,}/g, (_, ch) => ch.repeat(maxRepeats));
}

/**
 * Full content normalization for spam detection.
 * Applies all normalization steps including leetspeak conversion.
 * @param {string} text - Input text
 * @returns {string} Fully normalized text
 */
function normalizeContentForSpam(text) {
  const lowered = (text || "").toLowerCase();
  const noDiacritics = stripDiacritics(lowered);
  const noSymbols = normalizeSymbols(noDiacritics);
  const leetFixed = normalizeLeetspeak(noSymbols);
  return leetFixed.trim();
}

/**
 * Content normalization for badword detection.
 * Does NOT apply leetspeak conversion to reduce false positives.
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
function normalizeContentForBadwords(text) {
  const lowered = text.toLowerCase();
  const withoutDiacritics = stripDiacritics(lowered);
  const withoutSymbols = normalizeSymbols(withoutDiacritics);
  return withoutSymbols;
}

module.exports = {
  ZERO_WIDTH_REGEX,
  stripDiacritics,
  normalizeSymbols,
  normalizeLeetspeak,
  compressRepeats,
  normalizeContentForSpam,
  normalizeContentForBadwords,
};
