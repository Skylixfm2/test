import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const ORDER_WEBHOOK_URL = defineSecret("ORDER_WEBHOOK_URL");
const ORDER_WEBHOOK_50_URL = defineSecret("ORDER_WEBHOOK_50_URL");
const ORDER_WEBHOOK_500_URL = defineSecret("ORDER_WEBHOOK_500_URL");
const STOCK_WEBHOOK_URL = defineSecret("STOCK_WEBHOOK_URL");
const NEW_PRODUCT_WEBHOOK_URL = defineSecret("NEW_PRODUCT_WEBHOOK_URL");
const HIGH_VALUE_USER_ID = "1065581387358404699";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function handleCors(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.set(key, value));
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

function cleanText(value, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function chooseOrderWebhook(total) {
  if (total > 500) return ORDER_WEBHOOK_500_URL.value();
  if (total > 50) return ORDER_WEBHOOK_50_URL.value();
  return ORDER_WEBHOOK_URL.value();
}

function dataUrlToBlob(file) {
  const dataUrl = String(file?.dataUrl || "");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, base64] = match;
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  return new Blob([bytes], { type: mimeType });
}

async function sendDiscordJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Discord error ${response.status}`);
  }
}

export const sendOrderWebhook = onRequest({
  region: "europe-west1",
  secrets: [ORDER_WEBHOOK_URL, ORDER_WEBHOOK_50_URL, ORDER_WEBHOOK_500_URL],
  cors: false,
  maxInstances: 10
}, async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { order, files = {} } = req.body || {};
    if (!order?.id) {
      res.status(400).json({ error: "missing_order" });
      return;
    }

    const total = Number(order.total || 0);
    const webhookUrl = chooseOrderWebhook(total);
    const productNames = Array.isArray(order.products)
      ? order.products.map((product) => product.name).filter(Boolean).join(", ")
      : "-";
    const ping = total > 1000 ? `<@${HIGH_VALUE_USER_ID}> ` : "";
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify({
      content: `${ping}Nouvelle commande: ${order.id}`,
      embeds: [{
        title: "Nouvelle commande boutique",
        color: 0x61f0ff,
        fields: [
          { name: "Commande ID", value: cleanText(order.id), inline: false },
          { name: "Statut", value: cleanText(order.status), inline: true },
          { name: "Paiement", value: cleanText(order.provider), inline: true },
          { name: "Total", value: cleanText(order.totalLabel), inline: true },
          { name: "Quantite", value: String(order.quantity || 1), inline: true },
          { name: "Email compte", value: cleanText(order.customerEmail), inline: false },
          { name: "Email commande", value: cleanText(order.contactEmail), inline: false },
          { name: "Mail PayPal envoyeur", value: cleanText(order.paypalSenderEmail), inline: false },
          { name: "IBAN acheteur", value: cleanText(order.payerIban), inline: false },
          { name: "Pseudo compte", value: cleanText(order.customerPseudo), inline: true },
          { name: "Pseudo Roblox", value: cleanText(order.username), inline: true },
          { name: "Produit", value: cleanText(productNames), inline: false }
        ],
        timestamp: order.createdAt || new Date().toISOString()
      }]
    }));

    const transactionBlob = dataUrlToBlob(files.transactionProof);
    if (transactionBlob) {
      formData.append("files[0]", transactionBlob, `transaction-${order.id}-${cleanText(files.transactionProof.name, "proof.png")}`);
    }
    const gamepassBlob = dataUrlToBlob(files.gamepassProof);
    if (gamepassBlob) {
      formData.append("files[1]", gamepassBlob, `gamepass-${order.id}-${cleanText(files.gamepassProof.name, "gamepass.png")}`);
    }

    const response = await fetch(webhookUrl, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`Discord error ${response.status}`);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "discord_send_failed", detail: error.message });
  }
});

export const sendAdminShopWebhook = onRequest({
  region: "europe-west1",
  secrets: [STOCK_WEBHOOK_URL, NEW_PRODUCT_WEBHOOK_URL],
  cors: false,
  maxInstances: 10
}, async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { type, product = {}, oldStock = 0, newStock = 0 } = req.body || {};
    if (type === "stock") {
      await sendDiscordJson(STOCK_WEBHOOK_URL.value(), {
        content: `Stock ajoute: ${cleanText(product.name || product.id)}`,
        embeds: [{
          title: "Stock mis a jour",
          color: 0x61f0ff,
          fields: [
            { name: "Produit", value: cleanText(product.name || product.id), inline: false },
            { name: "Ancien stock", value: String(oldStock), inline: true },
            { name: "Nouveau stock", value: String(newStock), inline: true },
            { name: "Difference", value: `+${Number(newStock) - Number(oldStock)}`, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      });
      res.json({ ok: true });
      return;
    }

    if (type === "new-product") {
      await sendDiscordJson(NEW_PRODUCT_WEBHOOK_URL.value(), {
        content: `Nouveau produit: ${cleanText(product.name || product.id)}`,
        embeds: [{
          title: "Nouveau produit boutique",
          color: 0x61f0ff,
          fields: [
            { name: "Produit", value: cleanText(product.name || product.id), inline: false },
            { name: "Prix", value: `${Number(product.price || 0).toFixed(2)} EUR`, inline: true },
            { name: "Robux", value: `${Number(product.robuxPrice || 0)} R$`, inline: true },
            { name: "Stock", value: cleanText(product.stock), inline: true },
            { name: "Type", value: product.fulfillment === "key" ? `Key (${cleanText(product.keyType, "Key")})` : "Fichier", inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      });
      res.json({ ok: true });
      return;
    }

    res.status(400).json({ error: "unknown_type" });
  } catch (error) {
    res.status(500).json({ error: "discord_send_failed", detail: error.message });
  }
});
