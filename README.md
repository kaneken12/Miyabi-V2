# 🎀 Miyabi Bot v2 — WhatsApp AI Assistant

> *"Je réponds pas parce que j'aime ça, hein !"*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5--flash-blue)](https://deepmind.google)
[![Baileys](https://img.shields.io/badge/Baileys-6.7-purple)](https://github.com/WhiskeySockets/Baileys)

---

## ✨ Nouveautés v2

- ✅ **Intentions naturelles** — plus de commandes avec préfixe, tu parles normalement
- ✅ **Gemini 1.5 Flash** — plus rapide, plus précis
- ✅ **Mémoire par utilisateur** — le bot se souvient du contexte
- ✅ **Téléchargement audio/vidéo** via yt-dlp
- ✅ **Recherche web** en temps réel (DuckDuckGo + Wikipedia)
- ✅ **Gestion de groupe** complète
- ✅ **Conversion vidéo → audio**
- ✅ **Message de bienvenue** automatique

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- Python 3 + yt-dlp installé (`pip install yt-dlp`)
- ffmpeg installé (`sudo apt install ffmpeg` sur Linux)
- Clé API Google Gemini (gratuite sur [aistudio.google.com](https://aistudio.google.com))

### Étapes

```bash
# 1. Clone le repo
git clone https://github.com/tonpseudo/miyabi-bot.git
cd miyabi-bot

# 2. Installe les dépendances
npm install

# 3. Configure les variables
cp .env.example .env
# Édite .env avec ta clé Gemini et ton numéro

# 4. (Optionnel) Ajoute tes stickers dans /stickers/
# Noms attendus: happy.webp, annoyed.webp, sarcastic.webp,
#                cold.webp, tsundere.webp, angry.webp, bored.webp

# 5. Lance le bot
npm start
```

---

## 🧠 Comment ça fonctionne

Tu parles naturellement, Miyabi comprend :

| Ce que tu dis | Ce que Miyabi fait |
|---|---|
| "télécharge Afro B Joanna" | Cherche et envoie le MP3 |
| "je veux la vidéo de Drake God's Plan" | Télécharge et envoie la vidéo |
| "cherche les news au Cameroun aujourd'hui" | Recherche web et résume |
| "kick @untel" (en groupe) | Expulse le membre |
| "c'est quoi l'IA ?" | Répond en mode Miyabi |
| (envoie une vidéo avec caption "mp3") | Convertit en audio |

---

## ⚙️ Variables d'environnement

```env
GEMINI_API_KEY=ta_cle_ici
MOTHER_NUMBER=237XXXXXXXXX   # Numéro avec douceur spéciale
OWNER_NUMBER=237XXXXXXXXX    # Numéro admin (commandes !)
BOT_NAME=Miyabi
```

---

## 🔧 Commandes admin (owner uniquement, préfixe !)

| Commande | Effet |
|---|---|
| `!reset` | Efface la mémoire de la conversation |
| `!humeur froide` | Change l'humeur de Miyabi |
| `!humeur heureuse` | Change l'humeur |

---

## 📁 Structure du projet

```
miyabi-bot/
├── index.js
├── src/
│   ├── core/
│   │   ├── whatsapp.js      # Connexion Baileys
│   │   ├── gemini.js        # IA + détection d'intentions
│   │   └── personality.js   # Système d'humeurs
│   ├── handlers/
│   │   ├── messageHandler.js  # Orchestrateur principal
│   │   └── stickerHandler.js
│   ├── services/
│   │   ├── downloadService.js # Audio/Vidéo via yt-dlp
│   │   ├── searchService.js   # Recherche web
│   │   └── groupService.js    # Gestion de groupe
│   └── utils/
│       └── logger.js
├── stickers/   # Tes stickers .webp
├── temp/       # Fichiers temporaires (auto-nettoyé)
├── data/       # Données persistantes
└── auth_info/  # Session WhatsApp (gitignored)
```
