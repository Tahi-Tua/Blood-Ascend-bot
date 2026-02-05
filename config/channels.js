module.exports = {
  // ═══════════════════════════════════════════════════════════════
  // SALONS
  // ═══════════════════════════════════════════════════════════════
  RULES_CHANNEL_ID: "1466538910665539769",
  HELLO_CHANNEL_ID: "1466538752351666400",
  GENERAL_CHAT_ID: "1466540302566297693",
  SCREENSHOTS_CHANNEL_ID: "1466565301217919068",
  DIVINE_TIPS_CHANNEL_ID: "1466564951471558888",
  JOIN_US_CHANNEL_ID: "1466539015544111300",
  TEAM_SEARCH_CHANNEL_ID: "1381575870468198460",
  CLIPS_CHANNEL_ID: "1381581265542844496",
  BALANCE_CHANGES_CHANNEL_ID: "1427088947871223848",
  MEMES_CHANNEL_ID: "1381575710942167101",
  STAFF_LOG_CHANNEL_ID: "1466535478907113585",
  MODERATION_LOG_CHANNEL_ID: "1466535478907113585",
  SVS_REMINDER_CHANNEL_ID: "1466912367324561530",
  SVS_CHANNEL_ID: "1466912367324561530",
  BUG_REPORTS_CHANNEL_ID: null,

  // ═══════════════════════════════════════════════════════════════
  // RÔLES - IDs
  // ═══════════════════════════════════════════════════════════════
  LEADER_ROLE_ID: "1466555828025692447",
  STAFF_ROLE_ID: "1466557112711778466",
  APPLICANT_ROLE_ID: "1466556832557433077",
  UNVERIFIED_ROLE_ID: "1466556881802629378",
  PENDING_ROLE_ID: "1466556918277013554",
  MEMBER_ROLE_ID: "1466557032654962820",
  GUEST_ROLE_ID: "1466584401512239306",
  SVS_ROLE_ID: "1466557032654962820",

  // ═══════════════════════════════════════════════════════════════
  // RÔLES - Noms (pour recherche par nom si ID non défini)
  // ═══════════════════════════════════════════════════════════════
  MEMBER_ROLE_NAME: "Member",
  READ_ONLY_ROLE_NAME: "Read Only",
  VISITOR_ROLE_NAME: "Visitor",

  // ═══════════════════════════════════════════════════════════════
  // BYPASS & FILTRES (modération)
  // ═══════════════════════════════════════════════════════════════
  BYPASS_ROLE_IDS: [
    "1466555828025692447", // Leader
    "1466557112711778466", // Staff
  ],
  FILTER_EXEMPT_CHANNEL_IDS: [],
  FILTER_ENFORCED_CATEGORY_IDS: [],
  ALLOWED_GLOBAL_MENTION_IDS: [
    "1466555828025692447", // Leader
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEUILS & PARAMÈTRES
  // ═══════════════════════════════════════════════════════════════
  READ_ONLY_THRESHOLD: 10,

  // ═══════════════════════════════════════════════════════════════
  // DÉLAIS (ms)
  // ═══════════════════════════════════════════════════════════════
  TICKET_CLOSE_DELAY_MS: 5000,         // Délai avant fermeture d'un ticket
  SVS_POLL_TIMEOUT_MS: 20 * 60 * 1000, // Durée du sondage SVS (20 min)

  // ═══════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════
  ADMIN_USER_ID: "1466083089590784236",
};
