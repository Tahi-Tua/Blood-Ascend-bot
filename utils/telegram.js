/**
 * Telegram Notifier Utility
 * Sends notifications to a Telegram chat (optional)
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // Telegram not configured, skip silently
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      console.warn("⚠️ Telegram notification failed:", response.statusText);
    }
  } catch (error) {
    console.warn("⚠️ Error sending Telegram notification:", error.message);
  }
}

module.exports = { sendToTelegram };
