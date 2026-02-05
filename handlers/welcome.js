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
    .setTitle("🌟 Bienvenue sur ༒ Blood Ascend ༒ 🌟")
    .setDescription(
      `Salut ${member} 👋\nContent de te voir ! Voici comment commencer :`,
    )
    .addFields(
      {
        name: "🚪 Commence ici",
        value: [
          `• Lis les règles : <#${RULES_CHANNEL_ID}>`,
        ].join("\n"),
      },
      {
        name: "🎮 Explore et partage",
        value: [
          `• Discute avec tout le monde : <#${GENERAL_CHAT_ID}>`,
          `• Poste tes highlights : <#${SCREENSHOTS_CHANNEL_ID}>`,
          `• Découvre des astuces : <#${DIVINE_TIPS_CHANNEL_ID}>`,
        ].join("\n"),
      },
      
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage("attachment://intro.gif")
    .setTimestamp();

  const embed2 = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(
      `Tu veux **rejoindre le syndicat** ? Poste ton **ID Joueur** et tes **captures d'écran** (stats/héros), ou un **lien officiel de stats** dans ${joinUsMention}.\n\n`
    );

  return {
    content: `🎉 Bienvenue ${member} ! Fais comme chez toi.`,
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
