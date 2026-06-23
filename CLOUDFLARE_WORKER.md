# Cloudflare Worker pour les webhooks Discord

Ce Worker remplace Firebase Functions pour cacher les webhooks Discord.

## 1. Creer le Worker

Va sur Cloudflare :

1. **Workers & Pages**
2. **Create application**
3. **Create Worker**
4. Colle le contenu de `cloudflare-worker.js`
5. Clique **Deploy**

Cloudflare te donnera une URL du style :

```text
https://nom-du-worker.ton-pseudo.workers.dev
```

## 2. Ajouter les secrets

Dans le Worker :

**Settings** -> **Variables** -> **Add variable**

Ajoute ces variables en mode **Secret** :

```text
ORDER_WEBHOOK_URL
ORDER_WEBHOOK_50_URL
ORDER_WEBHOOK_500_URL
STOCK_WEBHOOK_URL
NEW_PRODUCT_WEBHOOK_URL
ISSUE_WEBHOOK_URL
```

Colle les webhooks Discord dans ces secrets.

`ISSUE_WEBHOOK_URL` sert uniquement pour les tickets/problemes envoyes depuis la page Claim.

## 3. Modifier les URLs dans le site

Dans `store.html`, remplace :

```js
https://TON-WORKER.TON-PSEUDO.workers.dev/order
```

par :

```js
https://ton-vrai-worker.workers.dev/order
```

Dans `adminShop.html`, remplace :

```js
https://TON-WORKER.TON-PSEUDO.workers.dev/admin-shop
```

par :

```js
https://ton-vrai-worker.workers.dev/admin-shop
```

## 4. Important

Les anciens webhooks Discord ont deja ete visibles dans ton code. Il faut les supprimer dans Discord et en recreer des nouveaux avant de les mettre en secrets Cloudflare.

Le Worker cache les webhooks. Par contre les produits, commandes et keys restent dans `localStorage`, donc ce n'est pas encore un vrai backend de boutique. Pour aller plus loin, il faudra mettre les orders/keys dans une base type Firestore, Supabase ou D1.
