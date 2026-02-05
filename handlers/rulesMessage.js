/**
 * Rules Message Handler
 * Posts and maintains the server rules message in the rules channel.
 * Uses hash-based change detection to avoid re-posting on every restart.
 */

const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const { RULES_CHANNEL_ID } = require("../config/channels");
const {
  RULES_BANNER_FILENAME,
  RULES_TITLE,
  RULES_DESCRIPTION,
  RULES_FIELDS,
  RULES_FOOTER,
  RULES_COLOR,
} = require("../config/rules-content");

const stateFile = path.join(__dirname, "../data/rulesState.json");
const bannerPath = path.join(__dirname, "../attached_assets", RULES_BANNER_FILENAME);

// Queue to serialize async writes
let rulesSaveQueue = Promise.resolve();

function loadState() {
  try {
    const data = fs.readFileSync(stateFile, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveState(state) {
  rulesSaveQueue = rulesSaveQueue
    .then(async () => {
      try {
        await fsPromises.writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
      } catch (err) {
        console.warn("⚠️ Could not save rules state:", err.message);
      }
    })
    .catch((err) => {
      console.warn("⚠️ Unexpected error in rules save queue:", err.message);
    });
  return rulesSaveQueue;
}

function rulesHash() {
  // Hash based on all configurable content
  return JSON.stringify({
    title: RULES_TITLE,
    description: RULES_DESCRIPTION,
    fields: RULES_FIELDS,
    footer: RULES_FOOTER,
    color: RULES_COLOR,
    banner: RULES_BANNER_FILENAME,
  });
}

function createRulesEmbed() {
  return new EmbedBuilder()
    .setColor(RULES_COLOR)
    .setTitle(RULES_TITLE)
    .setDescription(RULES_DESCRIPTION)
    .addFields(RULES_FIELDS)
    .setFooter({ text: RULES_FOOTER })
    .setTimestamp();
}

function createAcceptButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept_rules")
      .setLabel("✅ Accepter les Règles")
      .setStyle(ButtonStyle.Success)
  );
}

module.exports = (client) => {
  client.rulesMessagePosted = false;

  client.on(Events.ClientReady, async () => {
    if (client.rulesMessagePosted) return;

    try {
      const channel = client.channels.cache.get(RULES_CHANNEL_ID);
      if (!channel) {
        console.log("❌ Salon des règles introuvable :", RULES_CHANNEL_ID);
        return;
      }

      const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
      if (!messages) {
        console.log("⚠️ Impossible d'accéder au salon des règles. Vérifiez les permissions du bot.");
        return;
      }

      const state = loadState();
      const currentHash = rulesHash();

      // --- 1. Chercher les messages existants du bot dans le salon ---
      const botMessages = messages
        .filter((m) => m.author.id === client.user.id)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      // Trouver le message avec le bouton accept_rules (c'est le message des règles)
      const existingRulesMsg = botMessages.find(
        (m) => m.components?.length > 0 &&
          m.components.some((row) =>
            row.components.some((c) => c.customId === "accept_rules")
          )
      );

      // Trouver le message bannière (message du bot avec une image mais sans embed)
      const existingBannerMsg = botMessages.find(
        (m) => m.attachments.size > 0 && m.embeds.length === 0
      );

      // --- 2. Hash identique → rien à faire ---
      if (state.hash === currentHash && existingRulesMsg) {
        console.log("✅ Règles : aucun changement, le message existant est conservé.");
        // Mettre à jour les IDs dans le state au cas où
        state.messageId = existingRulesMsg.id;
        if (existingBannerMsg) state.bannerMsgId = existingBannerMsg.id;
        await saveState(state);
        client.rulesMessagePosted = true;
        return;
      }

      // --- 3. Le message existe déjà → éditer au lieu de re-poster ---
      const embed = createRulesEmbed();
      const row = createAcceptButton();

      if (existingRulesMsg) {
        await existingRulesMsg.edit({ embeds: [embed], components: [row] });
        console.log("✏️ Règles : message existant mis à jour.");

        state.hash = currentHash;
        state.messageId = existingRulesMsg.id;
        if (existingBannerMsg) state.bannerMsgId = existingBannerMsg.id;
        await saveState(state);
        client.rulesMessagePosted = true;
        return;
      }

      // --- 4. Aucun message trouvé → poster pour la première fois ---
      // Supprimer les anciens messages référencés dans le state (nettoyage)
      if (state.bannerMsgId) {
        const oldBanner = messages.get(state.bannerMsgId);
        if (oldBanner) await oldBanner.delete().catch(() => {});
      }
      if (state.messageId) {
        const oldMsg = messages.get(state.messageId);
        if (oldMsg) await oldMsg.delete().catch(() => {});
      }

      // Envoyer la bannière d'abord
      let bannerMsgId = null;
      if (fs.existsSync(bannerPath)) {
        const attachment = new AttachmentBuilder(bannerPath, { name: RULES_BANNER_FILENAME });
        const bannerMsg = await channel.send({ files: [attachment] });
        bannerMsgId = bannerMsg.id;
        console.log("🖼️ Bannière des règles postée");
      } else {
        console.log("⚠️ Bannière introuvable :", bannerPath);
      }

      // Puis envoyer l'embed avec les règles
      const newMsg = await channel.send({
        embeds: [embed],
        components: [row],
      });

      state.hash = currentHash;
      state.messageId = newMsg.id;
      state.bannerMsgId = bannerMsgId;
      await saveState(state);

      console.log("📜 Message des règles posté avec succès !");
      client.rulesMessagePosted = true;
    } catch (err) {
      console.error("❌ Erreur dans le handler des règles :", err.message);
    }
  });
};
