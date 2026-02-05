const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const { JOIN_US_CHANNEL_ID, LEADER_ROLE_ID, STAFF_ROLE_ID, PENDING_ROLE_ID, ADMIN_USER_ID } = require("../config/channels");
const { runJoinUsTicketDecision } = require("../utils/joinUsDecision");

// Track ticket creation in progress for each user to prevent race conditions
const creatingTickets = new Set();

module.exports = (client) => {
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (message.author.bot || !message.inGuild()) return;
      if (message.channel.id !== JOIN_US_CHANNEL_ID) return;

      // Prevent concurrent ticket creation for the same user.  If a ticket
      // creation is already underway, ignore subsequent messages until it
      // completes.  This helps avoid multiple tickets being created for the
      // same applicant due to race conditions.  We *only* add the user to
      // the `creatingTickets` set once we know we actually need to create
      // a ticket (i.e. after validation and duplicate checks) to avoid
      // blocking legitimate follow‑up messages when the first message was
      // invalid.
      if (creatingTickets.has(message.author.id)) {
        // Optionally notify the user that their application is being processed
        await message.author
          .send(
            "⚠️ Ta candidature est déjà en cours de traitement. Merci de patienter."
          )
          .catch(() => {});
        return;
      }

      const hasAttachment = message.attachments.size > 0;
      const hasHttpLink = /(https?:\/\/[\S]+)/gi.test(message.content);
      const hasImageEmbed =
        message.embeds.length > 0 &&
        message.embeds.some((e) => e.type === "image" || e.thumbnail || e.image);

      const isValid = hasAttachment || hasHttpLink || hasImageEmbed;
      if (!isValid) {
        // If the message is invalid we don't want to lock the user in the
        // `creatingTickets` set.  Just delete the message and notify the user.
        await message.delete().catch(() => {});
        return message.author
          .send(
            "❌ Ton message dans **Join-Us** a été supprimé.\n" +
              "Envoie uniquement des **captures d'écran** ou un **lien officiel de stats**.",
          )
          .catch(() => {});
      }

      // Acquire lock IMMEDIATELY after validation, BEFORE any async operations.
      // This is critical to prevent race conditions where multiple valid messages
      // from the same user arrive in quick succession (<100ms). Without this early
      // lock, both messages would pass the initial `creatingTickets.has()` check
      // and create duplicate tickets.
      creatingTickets.add(message.author.id);

      // Double-check for existing ticket AFTER acquiring lock to handle edge case
      // where a previous ticket creation just completed.
      // Use fetch() instead of cache.find() to ensure we see recently created channels.
      const allChannels = await message.guild.channels.fetch().catch(() => null);
      const existingTicketEarly = allChannels
        ? allChannels.find((c) => c?.topic === message.author.id)
        : message.guild.channels.cache.find((c) => c.topic === message.author.id);
      
      if (existingTicketEarly) {
        creatingTickets.delete(message.author.id);
        return message.author
          .send(`⚠️ Tu as déjà un ticket ouvert : ${existingTicketEarly}.`)
          .catch(() => {});
      }

      const botReply = await message.channel.send({
        content:
          "🙏 Merci pour tes informations !\n" +
          "**Nos administrateurs examinent maintenant ta candidature.**",
        allowedMentions: { users: [message.author.id] },
      });

      const admin = await client.users.fetch(ADMIN_USER_ID).catch(() => null);
      if (admin) {
        await admin
          .send(
            `📥 **Nouvelle candidature Join-Us**\n` +
              `De : **${message.author.tag}**\n` +
              `Salon : ${message.channel}\n` +
              `Date : ${new Date().toLocaleString()}`,
          )
          .catch(() => {});
      }

      const originalMessageId = message.id;
      const botReplyId = botReply.id;

      const guild = message.guild;
      const member = message.member;

      const pendingRole = guild.roles.cache.get(PENDING_ROLE_ID);
      if (pendingRole && !member.roles.cache.has(pendingRole.id)) {
        await member.roles.add(pendingRole).catch(() => {});
      }

      const leaderRole = guild.roles.cache.get(LEADER_ROLE_ID);
      const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
      if (!leaderRole && !staffRole) {
        console.log("❌ ERROR: Neither Leader nor Staff role found");
        // Lock will be released by finally block
        return;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept_app").setLabel("ACCEPTER").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny_app").setLabel("REFUSER").setStyle(ButtonStyle.Danger),
      );

      // Build permission overwrites for the ticket
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        // Explicitly deny the applicant from viewing the ticket
        { 
          id: message.author.id, 
          deny: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ] 
        },
        {
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
          ],
        },
      ];
      // Add leader role permissions if exists
      if (leaderRole) {
        permissionOverwrites.push({
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        });
      }
      // Add staff role permissions if exists
      if (staffRole) {
        permissionOverwrites.push({
          id: staffRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        });
      }

      const ticket = await guild.channels.create({
        name: `ticket-${message.author.username.slice(0, 10)}`,
        type: ChannelType.GuildText,
        topic: message.author.id,
        permissionOverwrites,
      });

      const roleMentions = [leaderRole ? `<@&${LEADER_ROLE_ID}>` : '', staffRole ? `<@&${STAFF_ROLE_ID}>` : ''].filter(Boolean).join(' ');
      const decisionMessage = await ticket.send({
        content: `📥 Nouvelle candidature de **${message.author.tag}**\n${roleMentions} <@${ADMIN_USER_ID}>`,
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("📝 Nouvelle Candidature")
            .setDescription(
              "Examine les captures d'écran et/ou les stats du candidat.\n\n" +
                "Une fois la décision prise, clique sur **ACCEPTER** ou **REFUSER**.",
            ),
        ],
        components: [row],
      });

      // Send attachments or stats link (no automatic image analysis)
      if (message.attachments.size > 0) {
        await ticket.send({ files: [...message.attachments.values()] });
      } else {
        await ticket.send(`🔗 Lien des stats : ${message.content}`);
      }

      await ticket.send({
        content: `META_JOINUS:${message.channel.id}:${originalMessageId}:${botReplyId}`,
        allowedMentions: { parse: [] },
      });

      // Note: AI analysis and auto-acceptance removed. Decisions are manual via buttons.
    } catch (err) {
      console.log("❌ Error in Join-Us Ticket System:", err);
    } finally {
      // Always release the lock when finishing, regardless of success/failure
      creatingTickets.delete(message.author.id);
    }
  });
};
