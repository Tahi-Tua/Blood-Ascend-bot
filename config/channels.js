module.exports = {
  // ═══════════════════════════════════════════════════════════════
  // CHANNELS
  // ═══════════════════════════════════════════════════════════════
  RULES_CHANNEL_ID: "1466538910665539769",
  HELLO_CHANNEL_ID: "1466538752351666400",
  GENERAL_CHAT_ID: "1466540302566297693",
  SCREENSHOTS_CHANNEL_ID: "1466565301217919068",
  DIVINE_TIPS_CHANNEL_ID: "1466564951471558888",
  JOIN_US_CHANNEL_ID: "1466539015544111300",
  STAFF_LOG_CHANNEL_ID: "1466535478907113585",
  MODERATION_LOG_CHANNEL_ID: "1466535478907113585", // Salon pour les logs de modération
  SVS_REMINDER_CHANNEL_ID: "1466912367324561530", // Salon pour les rappels SVS
  BUG_REPORTS_CHANNEL_ID: null, // TODO: Remplacer si utilisé

  // ═══════════════════════════════════════════════════════════════
  // ROLES - IDs
  // ═══════════════════════════════════════════════════════════════
  LEADER_ROLE_ID: "1466555828025692447",
  STAFF_ROLE_ID: "1466557112711778466",
  APPLICANT_ROLE_ID: "1466556832557433077",
  UNVERIFIED_ROLE_ID: "1466556881802629378",
  PENDING_ROLE_ID: "1466556918277013554", // TODO: Vérifier si correct
  MEMBER_ROLE_ID: "1466557032654962820", // TODO: Remplacer avec l'ID du rôle Member
  GUEST_ROLE_ID: "1466584401512239306", // TODO: Remplacer si utilisé
  SVS_ROLE_ID: "1466557032654962820", // Rôle à mentionner pour les rappels SVS

  // ═══════════════════════════════════════════════════════════════
  // ROLES - Names (pour recherche par nom si ID non défini)
  // ═══════════════════════════════════════════════════════════════
  MEMBER_ROLE_NAME: "Member",
  MOD_ROLE_NAME: "Staff",
  READ_ONLY_ROLE_NAME: "Read Only",
  VISITOR_ROLE_NAME: "Visitor",

  // ═══════════════════════════════════════════════════════════════
  // BYPASS & FILTERS (modération)
  // ═══════════════════════════════════════════════════════════════
  // Rôles exemptés des filtres anti-spam/badwords (IDs)
  BYPASS_ROLE_IDS: [
    "1466555828025692447", // Leader
    "1466557112711778466", // Staff
  ],
  // Salons exemptés des filtres
  FILTER_EXEMPT_CHANNEL_IDS: [],
  // Catégories où les filtres sont forcés
  FILTER_ENFORCED_CATEGORY_IDS: [],
  // Users autorisés à @everyone/@here
  ALLOWED_GLOBAL_MENTION_IDS: [
    "1466555828025692447", // Leader
  ],

  // ═══════════════════════════════════════════════════════════════
  // THRESHOLDS & SETTINGS
  // ═══════════════════════════════════════════════════════════════
  READ_ONLY_THRESHOLD: 10, // Nombre de violations avant mode lecture seule

  // ═══════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════
  ADMIN_USER_ID: "1466083089590784236", // TODO: Remplacer avec ton ID Discord
};
