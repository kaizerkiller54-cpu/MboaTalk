# mboaTalk 🇨🇲 🇨🇬 🇨🇩 🇨🇮 🇸🇳 🇫🇷

Une application web moderne de messagerie chiffrée de bout en bout et de transferts d'argent rapides (simulée avec code d'activation SMS).

## 🚀 Comment lancer l'application en local ?

L'erreur que vous rencontrez :
> `'vite' n'est pas reconnu en tant que commande interne ou externe...`

est due au fait que **les dépendances de l'application (comme Vite) ne sont pas encore installées** dans votre dossier local. Avant de charger le serveur de développement, Node.js a besoin de télécharger et d'installer l'ensemble des modules requis dans le répertoire `node_modules`.

Voici la marche à suivre pas-à-pas pour démarrer votre application en local :

### Prérequis
Avoir installé **Node.js** (recommandé : Version 18 ou supérieure) sur votre machine. Vous pouvez le télécharger sur [nodejs.org](https://nodejs.org/).

### Étape 1 : Ouvrir votre terminal
Ouvrez votre terminal (Invite de commandes, PowerShell ou Bash) et déplacez-vous à la racine du dossier de votre projet :
```bash
cd chemin/vers/votre/projet/mboaTalk
```

### Étape 2 : Installer les dépendances (Crucial)
Exécutez la commande suivante pour télécharger et configurer automatiquement tous les modules nécessaires (notamment `vite`, `react`, `lucide-react`, etc.) :
```bash
npm install
```
*Cette commande va créer un dossier `node_modules` et y installer les bibliothèques indispensables.*

### Étape 3 : Lancer le serveur de développement local
Une fois l'installation terminée avec succès, vous pouvez maintenant démarrer l'application avec la commande :
```bash
npm run dev
```

### Étape 4 : Ouvrir l'application dans votre navigateur
Le terminal affichera un lien. Ouvrez votre navigateur Web et accédez à :
👉 [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Contenu des Scripts Disponibles

Dans le fichier `package.json`, plusieurs commandes utiles sont programmées :
- `npm run dev` : Démarre l'application en mode développement local sur le port `3000`.
- `npm run build` : Compile les fichiers pour la mise en production (minimisation du CSS/JS) dans un dossier `dist/`.
- `npm run lint` : Analyse de type avec TypeScript pour s'assurer qu'il n'y a pas d'erreur de programmation solide.
- `npm run clean` : Nettoie les fichiers de build générés temporairement.

---

## 🔐 Sécurité de l'accès (Mode d'utilisation local)
1. **Connexion par Téléphone & SMS** : L'activation initiale s'effectue par l'envoi d'un mot de passe à usage unique (OTP). Un faux SMS de notification va simuler la réception réseau de l'opérateur Telecom. Vous pouvez cliquer sur la notification SMS pour le pré-remplir ou entrer le code affiché.
2. **Transferts de fonds** : Rendez-vous sur l'onglet **Portefeuille** pour simuler un envoi direct d'argent à un contact ou générer des liens de facturation.
