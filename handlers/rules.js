const { Events, EmbedBuilder, MessageFlags } = require("discord.js");
const {
  STAFF_LOG_CHANNEL_ID,
  MEMBER_ROLE_ID,
  MEMBER_ROLE_NAME,
  LEADER_ROLE_ID,
  STAFF_ROLE_ID,
  JOIN_US_CHANNEL_ID,
  UNVERIFIED_ROLE_ID,
  HELLO_CHANNEL_ID,
  APPLICANT_ROLE_ID,
} = require("../config/channels");
const { getWelcomePayload } = require("./welcome");

const APPLICANT_ROLE_NAME = "Applicant"; // Role for users who accepted rules but not yet approved

function findRoleByIdOrName(guild, roleId, roleName) {
  if (roleId) {
    const roleById = guild.roles.cache.get(roleId);
    if (roleById) return roleById;
  }

  if (roleName) {
    return guild.roles.cache.find((role) => role.name === roleName) || null;
  }

  return null;
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "accept_rules") return;

    try {
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } catch (err) {
        // If we missed the 3s interaction window (often due to rate limits/REST backlog),
        // we can't respond anymore; just stop so we don't crash trying again.
        if (err?.code === 10062) return;
        throw err;
      }

      const guild = interaction.guild;
      const member = interaction.member;

      // Check if already a full member using ID first, then name fallback.
      const memberRole = findRoleByIdOrName(guild, MEMBER_ROLE_ID, MEMBER_ROLE_NAME);
      const alreadyHasRole = memberRole && member.roles.cache.has(memberRole.id);

      // Find Applicant role using ID first, then name fallback.
      const applicantRole = findRoleByIdOrName(guild, APPLICANT_ROLE_ID, APPLICANT_ROLE_NAME);

      if (!alreadyHasRole) {
        // Give Applicant role (limited access - only Join-Us channel)
        if (applicantRole && !member.roles.cache.has(applicantRole.id)) {
          try {
            await member.roles.add(applicantRole);
            console.log(`✅ Added ${APPLICANT_ROLE_NAME} role to ${member.user.tag}`);
          } catch (err) {
            console.error("❌ Cannot add Applicant role:", err.message);
          }
        } else if (!applicantRole) {
          console.log(`⚠️ Role '${APPLICANT_ROLE_NAME}' not found. Please create it in Discord or configure APPLICANT_ROLE_ID.`);
        }

        // Retirer le rôle Unverified maintenant que les règles sont acceptées
        if (UNVERIFIED_ROLE_ID) {
          const unverifiedRole = guild.roles.cache.get(UNVERIFIED_ROLE_ID);
          if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
            try {
              await member.roles.remove(unverifiedRole);
              console.log(`✅ Rôle Unverified retiré de ${member.user.tag}`);
            } catch (err) {
              console.error(`❌ Impossible de retirer le rôle Unverified de ${member.user.tag}:`, err.message);
            }
          }
        }
      }

      const logChannel = await guild.channels
        .fetch(STAFF_LOG_CHANNEL_ID)
        .catch(() => null);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(alreadyHasRole ? 0xffaa00 : 0x00ff00)
          .setTitle(
            alreadyHasRole ? "🔄 Bouton Règles Cliqué" : "✅ Règles Acceptées / Rules Accepted",
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "👤 Utilisateur / User", value: `${member.user.tag}`, inline: true },
            { name: "🆔 ID", value: `${member.user.id}`, inline: true },
            {
              name: "📌 Statut / Status",
              value: alreadyHasRole
                ? "Déjà membre / Already a member"
                : "Règles acceptées / Rules accepted (en attente d'approbation du staff / waiting for staff approval)",
              inline: false,
            },
          )
          .setFooter({ text: "༒ Blood Ascend ༒ • Système de Vérification / Verification System" })
          .setTimestamp();

        const leaderRole = guild.roles.cache.get(LEADER_ROLE_ID);
        const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
        const roleMentions = [leaderRole ? `<@&${LEADER_ROLE_ID}>` : "", staffRole ? `<@&${STAFF_ROLE_ID}>` : ""].filter(Boolean).join(" ");
        await logChannel
          .send({
            content: roleMentions,
            embeds: [logEmbed],
          })
          .catch((err) => {
            console.error(
              "❌ Error sending log to moderator-only channel:",
              err.message,
            );
          });
        console.log("📋 Rules button click logged for", member.user.tag);
      } else {
        console.log(
          "❌ Cannot find moderator-only channel with ID:",
          STAFF_LOG_CHANNEL_ID,
        );
      }

      if (alreadyHasRole) {
        return interaction.editReply({
          content: "✔ Tu as déjà accepté les règles ! / You have already accepted the rules!",
        });
      }

      // Send confirmation message
      await interaction.editReply({
        content:
          "✅ Règles acceptées ! Bienvenue sur le serveur FR/EN.\n" +
          "✅ Rules accepted! Welcome to the FR/EN server.\n\n" +
          `📋 **[Salon JOIN-US / JOIN-US Channel](https://discord.com/channels/${guild.id}/${JOIN_US_CHANNEL_ID})**\n\n` +
          "ℹ️ Si tu veux **postuler pour rejoindre le syndicat**, envoie ton **ID Joueur** et tes **captures d'écran de compte/héros** dans le salon Join-Us.\n" +
          "ℹ️ If you want to **apply to join the syndicate**, send your **Player ID** and **account/hero screenshots** in Join-Us.\n\n" +
          "Tu n'as **pas besoin** de postuler juste pour être membre de ce serveur.\n" +
          "You do **not need** to apply just to be a member of this server.",
      });

      // Envoyer le message de bienvenue MAINTENANT (après acceptation des règles)
      if (HELLO_CHANNEL_ID) {
        const welcomeChannel = guild.channels.cache.get(HELLO_CHANNEL_ID);
        if (welcomeChannel) {
          const welcomePayload = getWelcomePayload(member);
          await welcomeChannel.send(welcomePayload).catch((err) => {
            console.error(`❌ Erreur envoi message de bienvenue pour ${member.user.tag}:`, err.message);
          });
          console.log(`👋 Message de bienvenue envoyé pour ${member.user.tag} (après acceptation des règles)`);
        }
      }

      // Send notification to JOIN_US channel
      const joinUsChannel = guild.channels.cache.get(JOIN_US_CHANNEL_ID);
      if (joinUsChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00d4ff)
          .setTitle("🎯 Candidature au Syndicat / Syndicate Application (Optional)")
          .setDescription(
            `Bienvenue, **${member.user}** ! / Welcome, **${member.user}**!\n\n` +
              `Ce salon est **uniquement** pour les joueurs qui veulent **postuler pour rejoindre le syndicat**.\n` +
              `This channel is **only** for players who want to **apply to join the syndicate**.\n\n` +
              `**Ce qu'il faut envoyer si tu postules / What to send if you apply:**\n` +
              `🆔 Ton ID Joueur / Your Player ID\n` +
              `📸 Captures d'écran (stats/héros) **ou** un lien officiel de stats / Screenshots (stats/heroes) **or** an official stats link\n\n` +
              `**Suite / Next steps:**\n` +
              `✅ Notre staff examinera ta soumission / Our staff will review your submission\n` +
              `🎉 Si approuvé, un membre du staff te contactera / If approved, a staff member will contact you\n` +
              `⏱️ L'examen prend généralement quelques heures / Review usually takes a few hours`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "༒ Blood Ascend ༒ • Recrutement / Recruitment" })
          .setTimestamp();

        await joinUsChannel
          .send({
            content: `👋 ${member}`,
            embeds: [welcomeEmbed],
          })
          .catch((err) => {
            console.error("❌ Error sending JOIN_US notification:", err.message);
          });
      }
    } catch (error) {
      console.error("Error handling accept_rules button:", error);
      // If the interaction is already expired, there's nothing we can do.
      if (error?.code === 10062) return;

      const payload = {
        content: "❌ Une erreur s'est produite. Veuillez réessayer. / An error occurred. Please try again.",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });
};