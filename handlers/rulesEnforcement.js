/**
 * Rules Enforcement Handler
 * Blocks messages from users who haven't accepted the rules.
 * Only the rules and welcome channels are accessible before accepting.
 */

const { Events, PermissionsBitField } = require("discord.js");
const {
  RULES_CHANNEL_ID,
  HELLO_CHANNEL_ID,
  UNVERIFIED_ROLE_ID,
  APPLICANT_ROLE_ID,
  MEMBER_ROLE_ID,
  MEMBER_ROLE_NAME,
  BYPASS_ROLE_IDS,
} = require("../config/channels");

const APPLICANT_ROLE_NAME = "Applicant";

// Cooldown map to avoid spamming DMs (userId → timestamp)
const dmCooldowns = new Map();
const COOLDOWN_MS = 60_000; // 1 minute between DM reminders

function hasRoleByIdOrName(member, roleId, roleName) {
  if (!member?.roles?.cache) return false;
  if (roleId && member.roles.cache.has(roleId)) return true;
  if (roleName) return member.roles.cache.some((role) => role.name === roleName);
  return false;
}

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

    const hasUnverified = hasRoleByIdOrName(member, UNVERIFIED_ROLE_ID);
    const hasApplicant = hasRoleByIdOrName(member, APPLICANT_ROLE_ID, APPLICANT_ROLE_NAME);
    const hasMember = hasRoleByIdOrName(member, MEMBER_ROLE_ID, MEMBER_ROLE_NAME);

    // Members accepted by ID/name must never be blocked by the Unverified gate.
    if (hasApplicant || hasMember) {
      if (hasUnverified && UNVERIFIED_ROLE_ID) {
        await member.roles.remove(UNVERIFIED_ROLE_ID).catch(() => {});
      }
      return;
    }

    // Only users explicitly carrying Unverified are blocked.
    // Existing members without this role are not rejected retroactively.
    if (!hasUnverified) return;

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
          `⚠️ **Tu dois d'abord accepter les règles / You must accept the rules first!**\n\n` +
            `Tu ne peux pas envoyer de messages sur **${message.guild.name}** tant que tu n'as pas lu et accepté les règles.\n` +
            `You cannot send messages on **${message.guild.name}** until you have read and accepted the rules.\n\n` +
            `👉 Va dans <#${RULES_CHANNEL_ID}> et clique sur **✅ Accepter les Règles**.\n` +
            `👉 Go to <#${RULES_CHANNEL_ID}> and click **✅ Accepter les Règles**.\n\n` +
            `C'est **obligatoire** pour accéder au serveur. / This is **required** to access the server.`
        )
        .catch(() => {}); // User may have DMs disabled
    }
  });
};