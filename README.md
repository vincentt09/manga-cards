# Manga Cards

Jeu autonome de collection de cartes manga construit avec React, Vite et un serveur Node.js natif. Il ne dépend plus de Base44.

## Démarrage

```powershell
npm install
npm run dev
```

Le client démarre sur `http://127.0.0.1:5173` et l’API locale sur `http://127.0.0.1:8787`. Les comptes, profils et cartes sont enregistrés dans `data/database.json`.

Le premier compte créé reçoit le rôle administrateur et un profil de départ.

## Connexion Google facultative

Copier `.env.example` vers `.env`, créer un client OAuth dans Google Cloud puis renseigner `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`. L’URL de redirection locale est :

```text
http://127.0.0.1:8787/api/auth/google/callback
```

## Production

```powershell
npm run build
npm start
```

Le serveur Node sert alors l’API et les fichiers compilés de `dist/`. Définir `APP_URL`, `API_URL` et `PORT` selon le domaine d’hébergement.

## Vérifications

```powershell
npm run lint
npm run typecheck
npm run build
```
