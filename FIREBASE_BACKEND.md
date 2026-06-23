# Backend Firebase Functions

Ce projet utilise Firebase Functions pour envoyer les messages Discord sans exposer les webhooks dans les fichiers HTML publics.

## Installation

Depuis le dossier du projet :

```powershell
cd functions
npm install
cd ..
```

Connecte-toi ensuite a Firebase :

```powershell
firebase login
firebase use skylixfm-shop-df92f
```

## Secrets a configurer

Ne mets jamais les webhooks Discord dans le HTML. Mets-les dans les secrets Firebase :

```powershell
firebase functions:secrets:set ORDER_WEBHOOK_URL
firebase functions:secrets:set ORDER_WEBHOOK_50_URL
firebase functions:secrets:set ORDER_WEBHOOK_500_URL
firebase functions:secrets:set STOCK_WEBHOOK_URL
firebase functions:secrets:set NEW_PRODUCT_WEBHOOK_URL
```

Colle le bon webhook quand Firebase le demande.

## Deploiement

```powershell
firebase deploy --only functions
```

Les pages appellent ensuite :

- `sendOrderWebhook` pour les commandes
- `sendAdminShopWebhook` pour le stock et les nouveaux produits

## Important

Comme les anciens webhooks ont deja ete visibles dans le code HTML et sur GitHub, il faut les regenerer dans Discord. Supprime les anciens webhooks, cree-en de nouveaux, puis remets les nouvelles URLs dans les secrets Firebase.

Les webhooks seront proteges apres ca, mais les produits, orders et keys restent encore dans le navigateur via `localStorage`. Pour une vraie boutique publique, la prochaine etape propre est de passer aussi ces donnees dans Firestore avec des regles admin.
