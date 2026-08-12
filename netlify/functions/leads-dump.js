const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  try {
    // En contexte Netlify Function, getStore utilise automatiquement l'auth du site
    // Ne PAS passer de token pour laisser le SDK gérer l'authentification
    const store = getStore("leads");

    let leads = null, blobError = null, keys = [];
    try { leads = await store.get("all_leads", { type: "json" }); } catch(e) { blobError = e.message; }
    try { const l = await store.list(); keys = l.blobs.map(b => b.key); } catch(e) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: Array.isArray(leads) ? leads.length : null,
        blobError,
        allKeys: keys,
        leads
      })
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ fatal: e.message }) };
  }
};
