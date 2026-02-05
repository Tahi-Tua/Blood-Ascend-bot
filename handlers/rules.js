const { Events, EmbedBuilder, MessageFlags } = require("discord.js");
const { STAFF_LOG_CHANNEL_ID, MEMBER_ROLE_NAME, LEADER_ROLE_ID, STAFF_ROLE_ID, JOIN_US_CHANNEL_ID } = require("../config/channels");

const APPLICANT_ROLE_NAME = "Applicant"; // Role for users who accepted rules but not yet approved

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

      // Check if already a full member
      const memberRole = guild.roles.cache.find((r) => r.name === MEMBER_ROLE_NAME);
      const alreadyHasRole = memberRole && member.roles.cache.has(memberRole.id);

      // Find or check for Applicant role (intermediate role with limited access)
      let applicantRole = guild.roles.cache.find((r) => r.name === APPLICANT_ROLE_NAME);
      
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
          console.log(`⚠️ Role '${APPLICANT_ROLE_NAME}' not found. Please create it in Discord.`);
        }

        // IMPORTANT: keep the Unverified role until staff accepts the application in the ticket.
        // If we remove it here, Discord may reveal hidden channels too early.
      }

      const logChannel = await guild.channels
        .fetch(STAFF_LOG_CHANNEL_ID)
        .catch(() => null);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(alreadyHasRole ? 0xffaa00 : 0x00ff00)
          .setTitle(
            alreadyHasRole ? "🔄 Bouton Règles Cliqué" : "✅ Règles Acceptées",
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "👤 Utilisateur", value: `${member.user.tag}`, inline: true },
            { name: "🆔 ID", value: `${member.user.id}`, inline: true },
            {
              name: "📌 Statut",
              value: alreadyHasRole ? "Déjà membre" : "Règles acceptées (en attente d'approbation du staff)",
              inline: false,
            },
          )
          .setFooter({ text: "༒ Blood Ascend ༒ • Système de Vérification" })
          .setTimestamp();

        const leaderRole = guild.roles.cache.get(LEADER_ROLE_ID);
        const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
        const roleMentions = [leaderRole ? `<@&${LEADER_ROLE_ID}>` : '', staffRole ? `<@&${STAFF_ROLE_ID}>` : ''].filter(Boolean).join(' ');
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
          content: "✔ Tu as déjà accepté les règles !",
        });
      }

      // Send confirmation message
      await interaction.editReply({
        content:
          "✅ Règles acceptées !\n\n" +
          `📋 **[Salon JOIN-US](https://discord.com/channels/${guild.id}/${JOIN_US_CHANNEL_ID})**\n\n` +
          "ℹ️ Si tu veux **postuler pour rejoindre le syndicat**, envoie ton **ID Joueur** et tes **captures d'écran de compte/héros** dans le salon Join-Us.\n" +
          "Tu n'as **pas besoin** de postuler juste pour être membre de ce serveur.",
      });

      // Send notification to JOIN_US channel
      const joinUsChannel = guild.channels.cache.get(JOIN_US_CHANNEL_ID);
      if (joinUsChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00d4ff)
          .setTitle("🎯 Candidature au Syndicat (Optionnel)")
          .setDescription(
            `Bienvenue, **${member.user}** !\n\n` +
            `Ce salon est **uniquement** pour les joueurs qui veulent **postuler pour rejoindre le syndicat**.\n\n` +
            `**Ce qu'il faut envoyer (si tu postules) :**\n` +
            `🆔 Ton ID Joueur\n` +
            `📸 Captures d'écran (stats/héros) **ou** un lien officiel de stats\n\n` +
            `**Que se passe-t-il ensuite :**\n` +
            `✅ Notre staff examinera ta soumission\n` +
            `🎉 Si approuvé, un membre du staff te contactera\n` +
            `⏱️ L'examen prend généralement quelques heures`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "༒ Blood Ascend ༒ • Système de Recrutement" })
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
        content: "❌ Une erreur s'est produite. Veuillez réessayer.",
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
