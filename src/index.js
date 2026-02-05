require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Required for welcome messages and role management
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Load all handlers from ./handlers directory
const handlersPath = path.join(__dirname, "../handlers");
const handlerFiles = fs
  .readdirSync(handlersPath)
  .filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
  try {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === "function") {
      handler(client);
      console.log(`✅ Loaded handler: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error loading handler ${file}:`, error.message);
  }
}

// Ready event
client.once("ready", () => {
  console.log(`\n🤖 Bot logged in as ${client.user.tag}`);
  console.log(`📊 Watching ${client.guilds.cache.size} server(s)\n`);
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLERS - Prevent silent crashes
// ═══════════════════════════════════════════════════════════════

client.on("error", (error) => {
  console.error("❌ Discord client error:", error.message);
});

client.on("warn", (warning) => {
  console.warn("⚠️ Discord client warning:", warning);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit - let the bot continue running if possible
});

// Login
client.login(process.env.DISCORD_TOKEN);
