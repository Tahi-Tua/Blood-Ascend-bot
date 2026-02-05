require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Valider les variables d'environnement requises
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN est requis. Définissez-le dans votre fichier .env.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Requis pour les messages de bienvenue et la gestion des rôles
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Charger tous les handlers depuis le dossier ./handlers
const handlersPath = path.join(__dirname, "../handlers");
const handlerFiles = fs
  .readdirSync(handlersPath)
  .filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
  try {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === "function") {
      handler(client);
      console.log(`✅ Handler chargé : ${file}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du chargement du handler ${file}:`, error.message);
  }
}

// Événement Ready
client.once("ready", () => {
  console.log(`\n🤖 Bot connecté en tant que ${client.user.tag}`);
  console.log(`📊 Surveillance de ${client.guilds.cache.size} serveur(s)\n`);
});

// ═══════════════════════════════════════════════════════════════
// GESTIONNAIRES D'ERREURS - Prévenir les crashs silencieux
// ═══════════════════════════════════════════════════════════════

client.on("error", (error) => {
  console.error("❌ Erreur client Discord:", error.message);
});

client.on("warn", (warning) => {
  console.warn("⚠️ Avertissement client Discord:", warning);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Rejet de Promise non géré:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Exception non capturée:", error);
  // Ne pas quitter - laisser le bot continuer à fonctionner si possible
});

// Connexion
client.login(process.env.DISCORD_TOKEN);
