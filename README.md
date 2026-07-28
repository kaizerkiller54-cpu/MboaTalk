# mboaTalk — Messagerie sécurisée & transferts d'argent

**mboaTalk** est une application web moderne tout-en-un combinant messagerie instantanée chiffrée de bout en bout et transferts d'argent simulés. Interface inspirée de WhatsApp / Telegram avec design glassmorphism, thème clair/sombre et support bilingue français/anglais.

## ✨ Fonctionnalités

- **Authentification par email + mot de passe** — Inscription et connexion sécurisées
- **Messagerie instantanée** — Discussions privées avec messages texte, images, vidéos, GIFs, documents et messages vocaux
- **Chiffrement de bout en bout** — Badge visuel sur toutes les conversations
- **Groupes & salons d'appels** — Création de groupes, publications sociales, invitations, notifications
- **Portefeuille & transferts** — Simulation de transferts d'argent, historique des transactions, programme de parrainage
- **Appels audio/vidéo** — Interface d'appel simulée avec réactions en direct
- **Actualités & statuts 24h** — Publication de statuts éphémères texte/image/vidéo/GIF/document
- **Chaînes de diffusion** — Création et abonnement à des chaînes d'actualité
- **Bilingue FR/EN** — Sélecteur de langue dans l'interface
- **Thème clair/sombre** — Bascule en un clic
- **Générateur de mots de passe sécurisés** — 24 caractères, 5 jeux de caractères, CSPRNG
- **Design adaptatif** — Desktop (split-panel) et mobile (stacked)

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + TypeScript + Vite |
| Animation | Motion (ex Framer Motion) |
| Icônes | Lucide React |
| Design | Tailwind CSS, Glassmorphism, dégradés |
| Backend | Node.js + Express + TypeScript |
| Base de données | Fichier JSON local (`server/data/`) |
| i18n | Système maison via React Context (~250 clés par langue) |

## 🚀 Installation & démarrage

```bash
# 1. Cloner le dépôt
git clone <votre-repo>
cd mboatalk

# 2. Installer les dépendances
npm install

# 3. Lancer le backend (port 5000)
npm run server

# 4. Dans un autre terminal, lancer le frontend (port 3000)
npm run dev
```

Ou utilisez le script automatisé : `demarrer.bat` (Windows).

## 📦 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le frontend en mode développement (port 3000) |
| `npm run server` | Lance le backend Express (port 5000) |
| `npm run build` | Compile l'application pour la production |
| `npm run lint` | Vérifie le code avec TypeScript/ESLint |
| `npm run clean` | Supprime les fichiers de build |

## 🔐 Notes de sécurité

- Les mots de passe sont générés côté client avec `crypto.getRandomValues`
- Le chiffrement est visuellement indiqué dans l'interface (badge "Chiffré de bout en bout")
- L'accès au portefeuille est protégé par un code PIN à 4 chiffres
- Aucune donnée sensible n'est exposée via l'API

## 🌍 Internationalisation

Le système de traduction se trouve dans `src/i18n/translations.ts`. Deux langues sont supportées :
- **Français** (`fr`) — langue par défaut
- **Anglais** (`en`)

Pour basculer : bouton `FR`/`EN` dans l'écran de connexion ou dans la barre latérale.

## 📁 Structure du projet

```
mboatalk/
├── src/
│   ├── components/       # Composants React (tabs, modaux, etc.)
│   ├── i18n/             # Traductions FR/EN et contexte React
│   ├── services/         # API client (appels backend)
│   ├── types.ts          # Types TypeScript
│   ├── data.ts           # Données initiales
│   ├── App.tsx           # Composant principal
│   └── main.tsx          # Point d'entrée
├── server/
│   ├── server.ts         # Serveur Express
│   └── db.ts             # Base de données JSON
├── public/
├── dist/                 # Build de production
├── demarrer.bat          # Lancement one-click (Windows)
├── arreter.bat           # Arrêt des processus
└── rebuild.bat           # Réinstallation complète
```
