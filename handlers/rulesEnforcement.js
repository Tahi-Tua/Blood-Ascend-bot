/**
 * Rules Enforcement Handler
 * Blocks messages from users who haven't accepted the rules (no Applicant or Member role).
 * Only the rules channel is accessible without accepting.
 */

const { Events, PermissionsBitField } = require("discord.js");
const {
  RULES_CHANNEL_ID,
  HELLO_CHANNEL_ID,
  UNVERIFIED_ROLE_ID,
  MEMBER_ROLE_NAME,
  BYPASS_ROLE_IDS,
} = require("../config/channels");

const APPLICANT_ROLE_NAME = "Applicant";

// Cooldown map to avoid spamming DMs (userId → timestamp)
const dmCooldowns = new Map();
const COOLDOWN_MS = 60_000; // 1 minute between DM reminders

module.exports = (client) => {
  client.on(Events.MessageCreate, async (message) => {
    // Skip bots, DMs, and system messages
    if (message.author.bot || !message.inGuild() || message.system) return;

    // Allow messages in the rules channel (so they can interact with the button)
    if (message.channel.id === RULES_CHANNEL_ID) return;

    // Allow messages in the welcome/hello channel
    if (message.channel.id === HELLO_CHANNEL_ID) return;

    const member = message.member;
    if (!member) return;

    // Skip staff/bypass roles
    if (BYPASS_ROLE_IDS?.length > 0) {
      const hasBypass = BYPASS_ROLE_IDS.some((id) => member.roles.cache.has(id));
      if (hasBypass) return;
    }

    // Check if user has Unverified role and does NOT have Applicant or Member role
    const hasUnverified = UNVERIFIED_ROLE_ID && member.roles.cache.has(UNVERIFIED_ROLE_ID);
    const hasApplicant = member.roles.cache.some((r) => r.name === APPLICANT_ROLE_NAME);
    const hasMember = member.roles.cache.some((r) => r.name === MEMBER_ROLE_NAME);

    // If user is unverified and hasn't accepted rules (no Applicant or Member role)
    if (!hasUnverified) return; // Not unverified, let them through
    if (hasApplicant || hasMember) return; // Already accepted rules

    // --- User hasn't accepted rules → block the message ---

    const me = message.guild.members.me;
    const canDelete = me
      ?.permissionsIn(message.channel)
      .has(PermissionsBitField.Flags.ManageMessages);

    if (canDelete) {
      await message.delete().catch(() => {});
    }

    // Send DM reminder with cooldown
    const now = Date.now();
    const lastDm = dmCooldowns.get(message.author.id) || 0;

    if (now - lastDm > COOLDOWN_MS) {
      dmCooldowns.set(message.author.id, now);

      await message.author
        .send(
          `⚠️ **Tu dois d'abord accepter les règles !**\n\n` +
          `Tu ne peux pas envoyer de messages sur **${message.guild.name}** tant que tu n'as pas lu et accepté les règles.\n\n` +
          `👉 Rends-toi dans <#${RULES_CHANNEL_ID}> et clique sur le bouton **✅ Accepter les Règles**.\n\n` +
          `C'est **obligatoire** pour accéder au serveur.`
        )
        .catch(() => {}); // User may have DMs disabled
    }
  });
};
