const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const store = getStore({
      name: "leads",
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN
    });

    // GET - return all leads from single blob
    if (event.httpMethod === "GET") {
      try {
        const data = await store.get("all_leads", { type: "json" });
        const leads = data || [];
        leads.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
        return { statusCode: 200, headers, body: JSON.stringify(leads) };
      } catch(e) {
        return { statusCode: 200, headers, body: JSON.stringify([]) };
      }
    }

    // POST - add or update a lead
    if (event.httpMethod === "POST") {
      const lead = JSON.parse(event.body);
      let leads = [];
      try {
        leads = await store.get("all_leads", { type: "json" }) || [];
      } catch(e) {}
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx >= 0) leads[idx] = lead;
      else leads.push(lead);
      await store.setJSON("all_leads", leads);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // DELETE - remove a lead
    if (event.httpMethod === "DELETE") {
      const { id } = JSON.parse(event.body);
      let leads = [];
      try {
        leads = await store.get("all_leads", { type: "json" }) || [];
      } catch(e) {}
      leads = leads.filter(l => l.id !== id);
      await store.setJSON("all_leads", leads);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
