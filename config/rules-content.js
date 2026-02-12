/**
 * Configuration du contenu des règles
 * Modifiez ce fichier pour mettre à jour les règles du serveur.
 * Le bot détectera automatiquement les changements et mettra à jour le message.
 */

const RULES_BANNER_FILENAME = "rules-banner.jpg";

const RULES_TITLE = "📜 ༒ Blood Ascend ༒ RÈGLES DU SERVEUR";

const RULES_DESCRIPTION = `Bienvenue dans le salon des règles et directives du serveur 📝

Ces règles sont en place pour garantir un environnement respectueux et inclusif pour tous. Elles s'appliquent à **tous les messages** que vous publiez sur le serveur ainsi qu'à votre **profil Discord**.

⚠️ **L'acceptation des règles est OBLIGATOIRE.** Vous devez cliquer sur le bouton ci-dessous pour accéder au serveur. Sans cela, vous ne pourrez ni lire ni écrire dans les autres salons.`;

const RULES_FIELDS = [
  {
    name: "🌐 Langue",
    value: "Ce serveur représente une **communauté francophone** et accueille des joueurs de tous les pays. Veuillez utiliser le français et n'essayez pas de contourner nos filtres ; ils sont là pour une bonne raison.",
    inline: false,
  },
  {
    name: "💬 Langage Approprié",
    value: "Utilisez un langage respectueux et courtois. N'oubliez pas que certains mots peuvent être offensants s'ils sont utilisés dans un mauvais contexte.",
    inline: false,
  },
  {
    name: "⚠️ Sujets Sensibles",
    value: "Évitez de discuter de sujets sérieux tels que la **politique**, la **religion** ou d'autres sujets sensibles.",
    inline: false,
  },
  {
    name: "😀 Réactions",
    value: "Soyez prudent avec les réactions. Tout contenu restreint décrit ci-dessus, créé avec des réactions emoji, est également interdit. Gardez à l'esprit que certaines réactions peuvent être aussi offensantes que certains mots dans un mauvais contexte.",
    inline: false,
  },
  {
    name: "🔊 Salons Vocaux",
    value: "Maintenez un comportement correct dans les salons vocaux. Évitez d'utiliser des modificateurs de voix ou de diffuser des sons forts ou de la musique. Changer fréquemment de salon vocal pour causer des perturbations n'est pas non plus autorisé.",
    inline: false,
  },
  {
    name: "🤖 Surveillance du Bot",
    value: "**Note :** Les messages de spam et les expressions inappropriées seront automatiquement enregistrés dans votre historique du serveur par notre bot. Des violations répétées peuvent entraîner des avertissements, des mutes ou des bannissements.",
    inline: false,
  },
];

const RULES_FOOTER = "༒ Blood Ascend ༒ • ⚠️ OBLIGATOIRE : Cliquez sur le bouton pour accepter les règles et accéder au serveur";

const RULES_COLOR = 0x2b2d31; // Couleur thème sombre

module.exports = {
  RULES_BANNER_FILENAME,
  RULES_TITLE,
  RULES_DESCRIPTION,
  RULES_FIELDS,
  RULES_FOOTER,
  RULES_COLOR,
};
