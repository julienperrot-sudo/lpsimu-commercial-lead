const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { 
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };

  try {
    const store = getStore({
      name: "leads",
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN
    });

    if (event.httpMethod === "GET") {
      const list = await store.list();
      const keys = list.blobs.map(b => b.key);
      
      // Fetch ALL in parallel at once for max speed
      const results = await Promise.allSettled(
        keys.map(k => store.get(k, { type: "json" }))
      );
      
      const leads = results
        .filter(r => r.status === "fulfilled" && r.value)
        .map(r => r.value);
      
      leads.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
      return { statusCode: 200, headers, body: JSON.stringify(leads) };
    }

    if (event.httpMethod === "POST") {
      const lead = JSON.parse(event.body);
      await store.setJSON(lead.id.toString(), lead);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === "DELETE") {
      const { id } = JSON.parse(event.body);
      await store.delete(id.toString());
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
