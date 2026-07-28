const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const store = getStore("leads");

    if (event.httpMethod === "GET") {
      const list = await store.list();
      const leads = [];
      for (const item of list.blobs) {
        try {
          const data = await store.get(item.key, { type: "json" });
          if (data) leads.push(data);
        } catch(e) {}
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
