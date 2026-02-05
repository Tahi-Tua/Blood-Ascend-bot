const fs = require("fs");
const path = require("path");
const { Events, EmbedBuilder } = require("discord.js");
const { MODERATION_LOG_CHANNEL_ID, GENERAL_CHAT_ID, BUG_REPORTS_CHANNEL_ID, FILTER_EXEMPT_CHANNEL_IDS, FILTER_ENFORCED_CATEGORY_IDS } = require("../config/channels");
const { hasBypassRole } = require("../utils/bypass");
const { increment: incViolations, getCount: getViolationCount, hasReachedThreshold } = require("../utils/violationStore");
const { assignReadOnlyRole } = require("../utils/readOnlyRole");
const { READ_ONLY_THRESHOLD } = require("../config/channels");
const {
  ZERO_WIDTH_REGEX,
  stripDiacritics,
  normalizeSymbols,
  normalizeContentForBadwords,
} = require("../utils/moderationUtils");
// Import centralized modLog to break circular dependency
const { sendModerationLog } = require("../utils/modLog");

const FILTER_EXEMPT_SET = new Set(FILTER_EXEMPT_CHANNEL_IDS || []);
const FILTER_ENFORCED_CATEGORY_SET = new Set(FILTER_ENFORCED_CATEGORY_IDS || []);

const badwordsJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "utils", "badwords.json"), "utf8"),
).words;

function loadTxtBadwords() {
  const txtPath = path.join(__dirname, "..", "utils", "badwords-list.txt");
  try {
    const raw = fs.readFileSync(txtPath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter((w) => w && !w.startsWith("#"));
  } catch (err) {
    console.warn("?? badwords-list.txt not found or unreadable:", err.message);
    return [];
  }
}

const badwordsTxt = loadTxtBadwords();
const badwords = Array.from(new Set([...badwordsJson, ...badwordsTxt]));

// Split into single-word vs multi-word phrases
const singleWordList = [];
const phraseList = [];
badwords.forEach((entry) => {
  const trimmed = entry.trim();
  if (!trimmed) return;
  if (/\s+/.test(trimmed)) {
    phraseList.push(trimmed);
  } else {
    singleWordList.push(trimmed);
  }
});

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Normalize a single word/token for badword lookup.
 * This ensures consistent normalization between the lookup table and detection.
 * @param {string} word - The word to normalize
 * @returns {string} Normalized word (lowercase, no diacritics, alphanumeric only)
 */
function normalizeToken(word) {
  return stripDiacritics(word.toLowerCase())
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(/[^a-z0-9]/g, "");
}

// Exact lookup table (word -> original from file) after simple normalization
const normalizedBadwords = new Set();
const badwordLookup = new Map();
singleWordList.forEach((word) => {
  const normalized = normalizeToken(word);
  if (!normalized) return;
  normalizedBadwords.add(normalized);
  badwordLookup.set(normalized, word);
});

const normalizedPhrases = [];
const phraseLookup = new Map();
const phraseRegexes = [];
phraseList.forEach((phrase) => {
  const normalized = normalizeSymbols(stripDiacritics(phrase.toLowerCase()));
  if (!normalized) return;
  normalizedPhrases.push(normalized);
  phraseLookup.set(normalized, phrase);
  phraseRegexes.push({ regex: new RegExp(`(^|\\s)${escapeRegex(normalized)}(\\s|$)`), original: phrase });
});

const memberBadwordStats = new Map(); // Track bad word violations per member
const memberBadwordHistory = new Map(); // Track all bad word violations per member
const memberBadwordReports = new Map(); // Store report message IDs for updating in DMs
// Note: memberModLogMessages moved to utils/modLog.js to break circular dependency
const memberBadwordLastUpdated = new Map(); // Track last violation timestamp per member

// Maximum number of entries allowed in each Map to prevent memory exhaustion.
const MAX_MAP_ENTRIES = Number(process.env.BADWORD_MAX_MAP_ENTRIES ?? 5000);

// Prevent unbounded memory usage for long-running processes.
// Defaults mirror spam.js retention unless overridden via env.
const BADWORD_HISTORY_RETENTION_MS = Number(
  process.env.BADWORD_HISTORY_RETENTION_MS ?? 6 * 60 * 60 * 1000,
);
const BADWORD_HISTORY_MAX_ENTRIES = Number(process.env.BADWORD_HISTORY_MAX_ENTRIES ?? 50);
const BADWORD_CLEANUP_INTERVAL_MS = Number(
  process.env.BADWORD_CLEANUP_INTERVAL_MS ?? 5 * 60 * 1000,
);

let badwordsCleanupInterval = null;

function purgeExpiredBadwordEntries(now = Date.now()) {
  let purged = 0;

  for (const [userId, lastUpdated] of memberBadwordLastUpdated.entries()) {
    if (now - lastUpdated <= BADWORD_HISTORY_RETENTION_MS) continue;

    memberBadwordLastUpdated.delete(userId);
    memberBadwordStats.delete(userId);
    memberBadwordHistory.delete(userId);
    memberBadwordReports.delete(userId);
    purged += 1;
  }

  return purged;
}

/**
 * Enforce maximum size limit on badword Maps by evicting oldest entries (LRU).
 * This prevents memory exhaustion on high-activity servers.
 */
function enforceMapSizeLimit() {
  if (memberBadwordLastUpdated.size <= MAX_MAP_ENTRIES) return;

  // Sort by lastUpdated timestamp (oldest first)
  const entries = Array.from(memberBadwordLastUpdated.entries())
    .sort((a, b) => a[1] - b[1]);

  // Remove oldest 10% of entries
  const toRemove = Math.floor(MAX_MAP_ENTRIES * 0.1);
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    const userId = entries[i][0];
    memberBadwordLastUpdated.delete(userId);
    memberBadwordStats.delete(userId);
    memberBadwordHistory.delete(userId);
    memberBadwordReports.delete(userId);
  }
}

function getBadwordCacheStats() {
  return {
    retentionMs: BADWORD_HISTORY_RETENTION_MS,
    stats: memberBadwordStats.size,
    history: memberBadwordHistory.size,
    reports: memberBadwordReports.size,
    lastUpdated: memberBadwordLastUpdated.size,
  };
}

// Use the shared normalizeContentForBadwords function
const normalizeContent = normalizeContentForBadwords;

// Remove URLs from text to avoid false positives
function removeUrls(text) {
  // Remove common URL patterns (http, https, discord links, etc.)
  return text.replace(/https?:\/\/[^\s]+/gi, " ")
             .replace(/discord\.gg\/[^\s]+/gi, " ")
             .replace(/www\.[^\s]+/gi, " ");
}

/**
 * Tokenize text into normalized words for badword detection.
 * Uses the same normalizeToken function as the lookup table for consistency.
 * @param {string} text - The text to tokenize
 * @returns {string[]} Array of normalized tokens
 */
function tokenizeNormalizedWords(text) {
  const withoutUrls = removeUrls(text);
  const normalized = normalizeContent(withoutUrls);
  // Extract alphanumeric tokens - this matches normalizeToken's output
  return normalized.match(/[a-z0-9]+/g) || [];
}

function containsBadWord(text) {
  if (!text) return false;
  const words = tokenizeNormalizedWords(text);

  for (const word of words) {
    if (normalizedBadwords.has(word)) {
      return true; // match must be on the entire token, not a substring
    }
  }

  // Detect multi-word phrases with boundary-aware matching on normalized text
  const normalizedPhraseText = normalizeSymbols(stripDiacritics(removeUrls(text).toLowerCase()));
  for (const { regex } of phraseRegexes) {
    if (regex.test(normalizedPhraseText)) {
      return true;
    }
  }
  return false;
}

function findBadWords(text) {
  if (!text) return [];
  const matched = new Set();

  const words = tokenizeNormalizedWords(text);

  for (const word of words) {
    const exactMatch = badwordLookup.get(word);
    if (exactMatch) matched.add(exactMatch);
  }

  const normalizedPhraseText = normalizeSymbols(stripDiacritics(removeUrls(text).toLowerCase()));
  for (const { regex, original } of phraseRegexes) {
    if (regex.test(normalizedPhraseText)) {
      matched.add(original);
    }
  }
  
  return Array.from(matched);
}

// sendModerationLog is now imported from utils/modLog.js to break circular dependency

async function sendMemberBadwordReport(user, detectedWords, messageContent) {
  try {
    const userId = user.id;
    
    // Initialize or get stats
    if (!memberBadwordStats.has(userId)) {
      memberBadwordStats.set(userId, {});
      memberBadwordHistory.set(userId, []);
    }
    
    const stats = memberBadwordStats.get(userId);
    const history = memberBadwordHistory.get(userId);
    
    // Count each bad word
    let totalViolations = 0;
    detectedWords.forEach(word => {
      stats[word] = (stats[word] || 0) + 1;
      totalViolations++;
    });
    
    // Add to history
    history.push({
      type: "🔴 Bad Words/Insults",
      words: detectedWords,
      content: messageContent.substring(0, 100),
      timestamp: new Date()
    });

    // Keep only the most recent entries to avoid unbounded growth.
    if (history.length > BADWORD_HISTORY_MAX_ENTRIES) {
      history.splice(0, history.length - BADWORD_HISTORY_MAX_ENTRIES);
    }

    memberBadwordLastUpdated.set(userId, Date.now());
    
    // Enforce size limit to prevent memory exhaustion
    enforceMapSizeLimit();
    
    // Get total violations across all instances
    const totalViolationCount = Object.values(stats).reduce((a, b) => a + b, 0);
    
    const report = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("🔴 Langage Inapproprié Détecté")
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { 
          name: "👤 Membre", 
          value: `${user}`, 
          inline: true 
        },
        { 
          name: "🔢 Total Violations", 
          value: `**${totalViolationCount}**`, 
          inline: true 
        },
        { 
          name: "📅 Dernière MAJ", 
          value: new Date().toLocaleTimeString(), 
          inline: true 
        }
      );

    // Add breakdown by word
    if (Object.keys(stats).length > 0) {
      const wordBreakdown = Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => `• **${word}**: ${count} fois`)
        .join("\n");
      
      report.addFields({
        name: "📊 Détail des Mots",
        value: wordBreakdown || "Aucun",
        inline: false
      });
    }

    // Add recent violations
    if (history.length > 0) {
      const recentViolations = history
        .slice(-5)
        .reverse()
        .map((v, i) => `**${i + 1}.** ${v.words.join(", ")}\n└─ *"${v.content.substring(0, 60)}${v.content.length > 60 ? '...' : ''}"*`)
        .join("\n\n");
      
      report.addFields({
        name: "🚨 Violations Récentes",
        value: recentViolations || "Aucune",
        inline: false
      });
    }

    report
      .setFooter({ text: "Système de Modération Automatique • Canal Member-Spam" })
      .setTimestamp();

    return report;
  } catch (err) {
    console.error(`Failed to create bad word report for ${user.tag}:`, err.message);
    return null;
  }
}

module.exports = (client) => {
  if (!badwordsCleanupInterval && BADWORD_CLEANUP_INTERVAL_MS > 0) {
    badwordsCleanupInterval = setInterval(() => {
      const purged = purgeExpiredBadwordEntries();
      if (purged > 0) {
        console.log(
          `🔁 badwords cleanup purged ${purged} inactive entr${purged === 1 ? "y" : "ies"}`,
        );
      }
    }, BADWORD_CLEANUP_INTERVAL_MS);

    badwordsCleanupInterval.unref?.();
  }

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.inGuild()) return;
    if (BUG_REPORTS_CHANNEL_ID && message.channel.id === BUG_REPORTS_CHANNEL_ID) return;
    const isInEnforcedCategory =
      FILTER_ENFORCED_CATEGORY_SET.has(message.channel.parentId) ||
      FILTER_ENFORCED_CATEGORY_SET.has(message.channel.parent?.parentId);
    if (!isInEnforcedCategory && FILTER_EXEMPT_SET.has(message.channel.id)) return;
    if (hasBypassRole(message.member)) return;

    const content = message.content || "";
    if (!containsBadWord(content)) return;

    await message.delete().catch(() => {});

    // Find which bad words were used
    const detectedWords = findBadWords(content);
    
    // Build professional violation report for the moderation channel
    const reportEmbed = await sendMemberBadwordReport(message.author, detectedWords, content);

    // Send to moderation channel instead of DM
    if (reportEmbed) {
      await sendModerationLog(message.guild, reportEmbed, message.author);
    }

    // Persist violation count and check threshold
    try {
      incViolations(message.author.id, detectedWords.length);
      const total = getViolationCount(message.author.id);
      if (hasReachedThreshold(message.author.id, READ_ONLY_THRESHOLD)) {
        await assignReadOnlyRole(message.member, total);
      }
    } catch (err) {
      console.warn("⚠️ Read-only assignment after badword failed:", err.message);
    }

    console.log(
      `🚨 Bad word(s) by ${message.author.tag} in #${message.channel.name}: ${detectedWords.join(", ")}`
    );
  });
};

// Re-export sendModerationLog from utils/modLog for backward compatibility
module.exports.sendModerationLog = sendModerationLog;
module.exports.containsBadWord = containsBadWord;
module.exports.findBadWords = findBadWords;
module.exports.sendMemberBadwordReport = sendMemberBadwordReport;
module.exports.purgeExpiredBadwordEntries = purgeExpiredBadwordEntries;
module.exports.getBadwordCacheStats = getBadwordCacheStats;
