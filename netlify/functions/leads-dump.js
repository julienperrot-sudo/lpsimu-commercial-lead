const { getStore } = require("@netlify/blobs");
const https = require("https");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  try {
    const store = getStore({
      name: "leads",
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN
    });

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
        leads,
        env: {
          hasSiteId: !!(process.env.SITE_ID || process.env.NETLIFY_SITE_ID),
          hasToken: !!(process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN)
        }
      })
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ fatal: e.message }) };
  }
};
