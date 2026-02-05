const { EmbedBuilder, Events, AttachmentBuilder } = require("discord.js");
const path = require("path");
const {
  RULES_CHANNEL_ID,
  HELLO_CHANNEL_ID,
  GENERAL_CHAT_ID,
  SCREENSHOTS_CHANNEL_ID,
  DIVINE_TIPS_CHANNEL_ID,
  JOIN_US_CHANNEL_ID,
  UNVERIFIED_ROLE_ID,
  GUEST_ROLE_ID,
} = require("../config/channels");

function getWelcomePayload(member) {
  const joinUs = member.guild.channels.cache.get(JOIN_US_CHANNEL_ID);
  const joinUsMention = joinUs ? `${joinUs}` : `<#${JOIN_US_CHANNEL_ID}>`;

  // Attach intro.gif
  const introPath = path.join(__dirname, "..", "attached_assets", "intro.gif");
  const introAttachment = new AttachmentBuilder(introPath, { name: "intro.gif" });

  const embed1 = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("🌟 Welcome to ༒ Blood Ascend ༒ 🌟")
    .setDescription(
      `Hello ${member} 👋\nWe're glad you're here! Here's how to get started:`,
    )
    .addFields(
      {
        name: "🚪 Start here",
        value: [
          `• Read the rules: <#${RULES_CHANNEL_ID}>`,
        ].join("\n"),
      },
      {
        name: "🎮 Explore & share",
        value: [
          `• Chat with everyone: <#${GENERAL_CHAT_ID}>`,
          `• Post your highlights: <#${SCREENSHOTS_CHANNEL_ID}>`,
          `• Discover tips: <#${DIVINE_TIPS_CHANNEL_ID}>`,
        ].join("\n"),
      },
      
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage("attachment://intro.gif")
    .setTimestamp();

  const embed2 = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(
      `Want to **apply to join the syndicate**? Post your **Player ID** and **screenshots** (stats/heroes), or a **valid official stats link** in ${joinUsMention}.\n\n`
    );

  return {
    content: `🎉 Welcome ${member}! Make yourself at home.`,
    embeds: [embed1, embed2],
    files: [introAttachment],
  };
}

/**
 * Welcome Handler
 * Sends welcome message and manages roles when a new member joins.
 */
module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      // Skip bots
      if (member.user.bot) return;

      const guild = member.guild;

      // Add Unverified role
      if (UNVERIFIED_ROLE_ID) {
        const unverifiedRole = guild.roles.cache.get(UNVERIFIED_ROLE_ID);
        if (unverifiedRole && !member.roles.cache.has(unverifiedRole.id)) {
          await member.roles.add(unverifiedRole).catch((err) => {
            console.error(`❌ Failed to add Unverified role to ${member.user.tag}:`, err.message);
          });
          console.log(`✅ Added Unverified role to ${member.user.tag}`);
        }
      }

      // Remove Guest role if present (cleanup)
      if (GUEST_ROLE_ID) {
        const guestRole = guild.roles.cache.get(GUEST_ROLE_ID);
        if (guestRole && member.roles.cache.has(guestRole.id)) {
          await member.roles.remove(guestRole).catch(() => {});
        }
      }

      // Send welcome message to the welcome channel
      if (!HELLO_CHANNEL_ID) {
        console.warn("⚠️ HELLO_CHANNEL_ID not configured, skipping welcome message");
        return;
      }

      const welcomeChannel = guild.channels.cache.get(HELLO_CHANNEL_ID);
      if (!welcomeChannel) {
        console.warn(`⚠️ Welcome channel ${HELLO_CHANNEL_ID} not found`);
        return;
      }

      const payload = getWelcomePayload(member);
      await welcomeChannel.send(payload).catch((err) => {
        console.error(`❌ Failed to send welcome message for ${member.user.tag}:`, err.message);
      });

      console.log(`👋 Welcome message sent for ${member.user.tag}`);
    } catch (err) {
      console.error(`❌ Error in welcome handler for ${member.user?.tag}:`, err.message);
    }
  });
};

// Export getWelcomePayload for use by other modules if needed
module.exports.getWelcomePayload = getWelcomePayload;
