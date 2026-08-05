const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const store = getStore({
      name: "leads",
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN
    });

    // GET - return all leads
    if (event.httpMethod === "GET") {
      // First try new single-blob format
      let allLeads = [];
      try {
        allLeads = await store.get("all_leads", { type: "json" }) || [];
      } catch(e) {}
      
      // Also read old individual blobs and merge
      try {
        const list = await store.list();
        const oldKeys = list.blobs.map(b => b.key).filter(k => k !== "all_leads");
        if (oldKeys.length > 0) {
          const results = await Promise.allSettled(
            oldKeys.map(k => store.get(k, { type: "json" }))
          );
          const oldLeads = results
            .filter(r => r.status === "fulfilled" && r.value && r.value.id)
            .map(r => r.value);
          
          // Merge: old leads not already in allLeads
          const existingIds = new Set(allLeads.map(l => l.id));
          const newFromOld = oldLeads.filter(l => !existingIds.has(l.id));
          
          if (newFromOld.length > 0) {
            allLeads = [...allLeads, ...newFromOld];
            // Save merged result back to all_leads for next time
            await store.setJSON("all_leads", allLeads);
            // Delete old individual blobs
            await Promise.allSettled(oldKeys.map(k => store.delete(k)));
          }
        }
      } catch(e) {}
      
      allLeads.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
      return { statusCode: 200, headers, body: JSON.stringify(allLeads) };
    }

    // POST - add or update a lead
    if (event.httpMethod === "POST") {
      const lead = JSON.parse(event.body);
      let leads = [];
      try { leads = await store.get("all_leads", { type: "json" }) || []; } catch(e) {}
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
      try { leads = await store.get("all_leads", { type: "json" }) || []; } catch(e) {}
      leads = leads.filter(l => l.id !== id);
      await store.setJSON("all_leads", leads);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
