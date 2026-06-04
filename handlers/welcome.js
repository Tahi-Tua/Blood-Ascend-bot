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
    .setTitle("🌟 Welcome / Bienvenue sur ༒ Blood Ascend ༒ 🌟")
    .setDescription(
      `Salut ${member} 👋\nContent de te voir ! Blood Ascend est un serveur **FR/EN** : français et anglais sont autorisés.\n\n` +
        `Hi ${member} 👋\nGlad to see you! Blood Ascend is a **FR/EN** server: French and English are allowed.`,
    )
    .addFields(
      {
        name: "✅ Règles acceptées / Rules accepted",
        value: [
          `• Tu as accès aux salons du serveur.`,
          `• You now have access to the server channels.`,
        ].join("\n"),
      },
      {
        name: "🎮 Explore et partage / Explore and share",
        value: [
          `• Discussion générale / General chat : <#${GENERAL_CHAT_ID}>`,
          `• Highlights : <#${SCREENSHOTS_CHANNEL_ID}>`,
          `• Astuces / Tips : <#${DIVINE_TIPS_CHANNEL_ID}>`,
        ].join("\n"),
      },
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage("attachment://intro.gif")
    .setTimestamp();

  const embed2 = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(
      `Tu veux **rejoindre le syndicat** ? Poste ton **ID Joueur** et tes **captures d'écran** (stats/héros), ou un **lien officiel de stats** dans ${joinUsMention}.\n\n` +
        `Want to **join the syndicate**? Post your **Player ID** and your **account/hero screenshots**, or an **official stats link**, in ${joinUsMention}.\n\n` +
        `La candidature au syndicat est optionnelle pour être membre du serveur.\n` +
        `Applying to the syndicate is optional for server membership.`
    );

  return {
    content:
      `🎉 Bienvenue ${member} ! Tu as accepté les règles et tu as maintenant accès au serveur. Français et anglais sont autorisés.\n` +
      `🎉 Welcome ${member}! You accepted the rules and now have access to the server. French and English are allowed.`,
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

      // Le message de bienvenue est envoyé UNIQUEMENT après l'acceptation des règles (voir rules.js)
      // Ici on assigne juste le rôle Unverified pour bloquer l'accès
      console.log(`🔒 ${member.user.tag} a rejoint le serveur — en attente d'acceptation des règles`);
    } catch (err) {
      console.error(`❌ Error in welcome handler for ${member.user?.tag}:`, err.message);
    }
  });
};

// Export getWelcomePayload for use by other modules if needed
module.exports.getWelcomePayload = getWelcomePayload;