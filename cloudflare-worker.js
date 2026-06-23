const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const HIGH_VALUE_USER_ID = "1065581387358404699";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}

function cleanText(value, fallback = "-") {
  return String(value || fallback).slice(0, 1000);
}

function parseMoney(value) {
  const number = Number(String(value || "0").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function chooseOrderWebhook(env, total) {
  if (total > 500) return env.ORDER_WEBHOOK_500_URL;
  if (total > 50) return env.ORDER_WEBHOOK_50_URL;
  return env.ORDER_WEBHOOK_URL;
}

function fileFromDataUrl(file) {
  const dataUrl = String(file?.dataUrl || "");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return {
    name: cleanText(file.name, "proof.png").replace(/[^\w.\- ]/g, "_"),
    blob: new Blob([bytes], { type: match[1] })
  };
}

async function sendDiscordJson(url, payload) {
  if (!url) throw new Error("Webhook missing");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord error ${response.status}`);
  }
}

async function sendDiscordMultipart(url, payload, files) {
  if (!url) throw new Error("Webhook missing");

  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));

  Object.values(files || {}).filter(Boolean).forEach((file, index) => {
    form.append(`files[${index}]`, file.blob, file.name);
  });

  const response = await fetch(url, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new Error(`Discord error ${response.status}`);
  }
}

async function handleOrder(request, env) {
  const body = await request.json();
  const order = body.order || {};
  const total = parseMoney(order.total);
  const webhookUrl = chooseOrderWebhook(env, total);
  const files = body.files || {};
  const transactionProof = fileFromDataUrl(files.transactionProof);
  const gamepassProof = fileFromDataUrl(files.gamepassProof);

  const payment = cleanText(order.payment || "Paiement");
  const ping = total > 1000 ? `<@${HIGH_VALUE_USER_ID}> ` : "";
  const robuxInfo = order.robuxTotal ? `${Number(order.robuxTotal)} R$` : "-";
  const orderProducts = Array.isArray(order.products) ? order.products : order.items;
  const productLabel = Array.isArray(orderProducts)
    ? orderProducts.map((item) => `${item.name || item.id} x${item.quantity || 1}`).join(", ")
    : cleanText(order.productName || order.productId);

  await sendDiscordMultipart(webhookUrl, {
    content: `${ping}Nouvelle commande ${cleanText(order.id)}`,
    embeds: [{
      title: "Nouvelle commande boutique",
      color: total > 1000 ? 0xff3b66 : total > 500 ? 0xff9f1c : total > 50 ? 0xffd12f : 0x61f0ff,
      fields: [
        { name: "Commande", value: cleanText(order.id), inline: false },
        { name: "Produit", value: productLabel || "-", inline: false },
        { name: "Total", value: payment.toLowerCase() === "roblox" ? robuxInfo : `${total.toFixed(2)} EUR`, inline: true },
        { name: "Paiement", value: payment, inline: true },
        { name: "Pseudo compte", value: cleanText(order.accountPseudo), inline: true },
        { name: "Email compte", value: cleanText(order.accountEmail), inline: true },
        { name: "Email commande", value: cleanText(order.contactEmail), inline: true },
        { name: "Mail PayPal", value: cleanText(order.paypalSenderEmail), inline: true },
        { name: "IBAN acheteur", value: cleanText(order.payerIban), inline: false },
        { name: "Pseudo Roblox", value: cleanText(order.robloxUsername), inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  }, { transactionProof, gamepassProof });

  return json({ ok: true });
}

async function handleAdminShop(request, env) {
  const body = await request.json();
  const type = String(body.type || "");
  const product = body.product || {};

  if (type === "stock") {
    await sendDiscordJson(env.STOCK_WEBHOOK_URL, {
      content: `Stock ajoute: ${cleanText(product.name || product.id)}`,
      embeds: [{
        title: "Stock mis a jour",
        color: 0x61f0ff,
        fields: [
          { name: "Produit", value: cleanText(product.name || product.id), inline: false },
          { name: "Ancien stock", value: String(body.oldStock ?? 0), inline: true },
          { name: "Nouveau stock", value: String(body.newStock ?? 0), inline: true },
          { name: "Difference", value: `+${Number(body.newStock || 0) - Number(body.oldStock || 0)}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    });
    return json({ ok: true });
  }

  if (type === "new-product") {
    await sendDiscordJson(env.NEW_PRODUCT_WEBHOOK_URL, {
      content: `Nouveau produit: ${cleanText(product.name || product.id)}`,
      embeds: [{
        title: "Nouveau produit boutique",
        color: 0x61f0ff,
        fields: [
          { name: "Produit", value: cleanText(product.name || product.id), inline: false },
          { name: "Prix", value: `${parseMoney(product.price).toFixed(2)} EUR`, inline: true },
          { name: "Robux", value: `${Number(product.robuxPrice || 0)} R$`, inline: true },
          { name: "Stock", value: cleanText(product.stock), inline: true },
          { name: "Type", value: product.fulfillment === "key" ? `Key (${cleanText(product.keyType || "Key")})` : product.fulfillment === "account" ? "Compte" : "Fichier", inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    });
    return json({ ok: true });
  }

  return json({ error: "Unknown admin shop event" }, 400);
}

async function handleAdminOrder(request, env) {
  const body = await request.json();
  const order = body.order || {};
  const status = String(body.status || "");
  const total = parseMoney(order.total);
  const productLabel = Array.isArray(order.products)
    ? order.products.map((item) => `${item.name || item.id} x${item.quantity || 1}`).join(", ")
    : cleanText(order.productName || order.productId);

  const statusLabel = status === "accepted" ? "acceptee" : status === "problem" ? "probleme / ticket" : "refusee";
  await sendDiscordJson(env.ORDER_WEBHOOK_URL, {
    content: `Commande ${statusLabel}: ${cleanText(order.id)}`,
    embeds: [{
      title: status === "accepted" ? "Commande acceptee" : status === "problem" ? "Ticket / probleme client" : "Commande refusee",
      color: status === "accepted" ? 0x4affad : status === "problem" ? 0xffd12f : 0xff5f5f,
      fields: [
        { name: "Commande", value: cleanText(order.id), inline: false },
        { name: "Produit", value: productLabel || "-", inline: false },
        { name: "Total", value: `${total.toFixed(2)} EUR`, inline: true },
        { name: "Paiement", value: cleanText(order.provider), inline: true },
        { name: "Email compte", value: cleanText(order.customerEmail), inline: true },
        { name: "Email commande", value: cleanText(order.contactEmail), inline: true },
        { name: "Raison / note", value: cleanText(body.reason || order.rejectReason || "Aucune note"), inline: false }
      ],
      timestamp: new Date().toISOString()
    }]
  });

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/order") return await handleOrder(request, env);
      if (url.pathname === "/admin-shop") return await handleAdminShop(request, env);
      if (url.pathname === "/admin-order") return await handleAdminOrder(request, env);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: cleanText(error.message, "Worker error") }, 500);
    }
  }
};
