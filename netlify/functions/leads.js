const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const store = getStore({
      name: "leads",
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN
    });

    if (event.httpMethod === "GET") {
      const list = await store.list();
      const keys = list.blobs.map(b => b.key);
      
      // Fetch all in parallel with concurrency limit
      const BATCH = 20;
      const leads = [];
      for (let i = 0; i < keys.length; i += BATCH) {
        const batch = keys.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(k => store.get(k, { type: "json" }).catch(() => null))
        );
        results.forEach(d => { if (d) leads.push(d); });
      }
      
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
