/**
 * Moderation Log Utility
 * Centralized function to send moderation logs to avoid circular dependencies.
 */

const { MODERATION_LOG_CHANNEL_ID, MOD_ROLE_NAME } = require("../config/channels");

// Store message IDs for updating existing logs per user
const memberModLogMessages = new Map();

/**
 * Send or update a moderation log embed in the moderation channel.
 * @param {Guild} guild - The Discord guild
 * @param {EmbedBuilder} embed - The embed to send
 * @param {User} user - The user this log is about (for tracking updates)
 */
async function sendModerationLog(guild, embed, user) {
  if (!MODERATION_LOG_CHANNEL_ID) {
    console.warn("⚠️ MODERATION_LOG_CHANNEL_ID not configured");
    return;
  }

  const channel = guild.channels.cache.get(MODERATION_LOG_CHANNEL_ID);
  if (!channel) {
    console.log(`❌ Moderation channel ${MODERATION_LOG_CHANNEL_ID} not found in cache`);
    return;
  }

  const userId = user?.id;
  const oldMessageId = userId ? memberModLogMessages.get(userId) : null;
  const staffRole = guild.roles.cache.find((r) => r.name === MOD_ROLE_NAME);

  try {
    // Try to update existing message
    if (oldMessageId) {
      try {
        const oldMessage = await channel.messages.fetch(oldMessageId).catch(() => null);
        if (oldMessage) {
          await oldMessage.edit({
            content: staffRole ? `${staffRole}` : "",
            embeds: [embed],
          }).catch(() => null);
          console.log(`✅ Updated existing mod log message for ${user?.tag || "unknown"}`);
          return;
        }
      } catch (err) {
        console.error(`Failed to update old message:`, err.message);
      }
    }

    // If update failed or no old message, send new one
    const newMessage = await channel.send({
      content: staffRole ? `${staffRole}` : "",
      embeds: [embed],
    }).catch((err) => {
      console.log(`❌ Error sending to moderation channel: ${err.message}`);
      return null;
    });

    if (newMessage && userId) {
      memberModLogMessages.set(userId, newMessage.id);
      console.log(`✅ Sent new mod log message for ${user?.tag || "unknown"}`);
    }
  } catch (err) {
    console.error(`Error in sendModerationLog:`, err.message);
  }
}

/**
 * Get the stored message ID for a user's mod log.
 * @param {string} userId - The user ID
 * @returns {string|undefined} The message ID if exists
 */
function getModLogMessageId(userId) {
  return memberModLogMessages.get(userId);
}

/**
 * Set the stored message ID for a user's mod log.
 * @param {string} userId - The user ID
 * @param {string} messageId - The message ID
 */
function setModLogMessageId(userId, messageId) {
  memberModLogMessages.set(userId, messageId);
}

module.exports = {
  sendModerationLog,
  getModLogMessageId,
  setModLogMessageId,
};
