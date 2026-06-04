/**
 * Configuration du contenu des règles
 * Modifiez ce fichier pour mettre à jour les règles du serveur.
 * Le bot détectera automatiquement les changements et mettra à jour le message.
 */

const RULES_BANNER_FILENAME = "rules-banner.jpg";

const RULES_TITLE = "📜 ༒ Blood Ascend ༒ RÈGLES / SERVER RULES";

const RULES_DESCRIPTION = `Bienvenue dans le salon des règles et directives du serveur 📝
Welcome to the server rules and guidelines channel 📝

Blood Ascend est un serveur **FR/EN** : le français et l'anglais sont officiellement autorisés.
Blood Ascend is a **FR/EN** server: French and English are officially allowed.

Ces règles garantissent un environnement respectueux et inclusif pour tous. Elles s'appliquent à **tous les messages** publiés sur le serveur ainsi qu'à votre **profil Discord**.
These rules keep the server respectful and inclusive for everyone. They apply to **all messages** posted on the server and to your **Discord profile**.

⚠️ **L'acceptation des règles est OBLIGATOIRE.** Vous devez cliquer sur le bouton ci-dessous pour accéder au serveur. Sans cela, vous ne pourrez ni lire ni écrire dans les autres salons.
⚠️ **Accepting the rules is REQUIRED.** You must click the button below to access the server. Without this, you cannot read or write in the other channels.`;

const RULES_FIELDS = [
  {
    name: "🌍 Langues / Languages",
    value: "Blood Ascend est une communauté francophone ouverte à l'international. Le **français** et l'**anglais** sont autorisés dans les salons généraux.\n\nBlood Ascend is a French-speaking community open to international members. **French** and **English** are allowed in general channels.\n\nMerci de rester clair, respectueux et compréhensible dans les deux langues.\nPlease stay clear, respectful and understandable in both languages.",
    inline: false,
  },
  {
    name: "💬 Langage approprié / Appropriate Language",
    value: "Utilisez un langage respectueux et courtois. Certains mots peuvent être offensants selon le contexte.\n\nUse respectful and courteous language. Some words can be offensive depending on context.",
    inline: false,
  },
  {
    name: "⚠️ Sujets sensibles / Sensitive Topics",
    value: "Évitez les débats sensibles comme la **politique**, la **religion** ou les sujets pouvant créer des conflits.\n\nAvoid sensitive debates such as **politics**, **religion**, or topics that can create conflicts.",
    inline: false,
  },
  {
    name: "😀 Réactions / Reactions",
    value: "Soyez prudent avec les réactions emoji. Un contenu interdit reste interdit même s'il est exprimé avec des réactions.\n\nBe careful with emoji reactions. Restricted content remains restricted even when expressed through reactions.",
    inline: false,
  },
  {
    name: "🔊 Salons vocaux / Voice Channels",
    value: "Gardez un comportement correct en vocal. Évitez les sons forts, la musique non demandée, les modificateurs de voix abusifs et les changements de salon pour déranger.\n\nKeep proper behavior in voice channels. Avoid loud sounds, unwanted music, abusive voice changers, and switching channels to disturb others.",
    inline: false,
  },
  {
    name: "🤖 Surveillance du bot / Bot Moderation",
    value: "Les messages de spam et les expressions inappropriées sont automatiquement enregistrés par le bot. Les violations répétées peuvent entraîner des avertissements, des mutes ou des bannissements.\n\nSpam and inappropriate expressions are automatically logged by the bot. Repeated violations may lead to warnings, mutes or bans.",
    inline: false,
  },
];

const RULES_FOOTER = "༒ Blood Ascend ༒ • OBLIGATOIRE / REQUIRED : Cliquez pour accepter les règles / Click to accept the rules";

const RULES_COLOR = 0x2b2d31; // Couleur thème sombre

module.exports = {
  RULES_BANNER_FILENAME,
  RULES_TITLE,
  RULES_DESCRIPTION,
  RULES_FIELDS,
  RULES_FOOTER,
  RULES_COLOR,
};