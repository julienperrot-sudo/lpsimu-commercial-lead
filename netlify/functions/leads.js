const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("leads");

  // GET - récupérer tous les leads
  if (event.httpMethod === "GET") {
    try {
      const list = await store.list();
      const leads = [];
      for (const key of list.blobs) {
        const data = await store.get(key.key, { type: "json" });
        if (data) leads.push(data);
      }
      leads.sort((a, b) => new Date(b.id) - new Date(a.id));
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leads)
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  // POST - sauvegarder un lead
  if (event.httpMethod === "POST") {
    try {
      const lead = JSON.parse(event.body);
      await store.setJSON(lead.id, lead);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  // PUT - mettre à jour un lead (statut etc.)
  if (event.httpMethod === "PUT") {
    try {
      const lead = JSON.parse(event.body);
      await store.setJSON(lead.id, lead);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  // DELETE - supprimer un lead
  if (event.httpMethod === "DELETE") {
    try {
      const { id } = JSON.parse(event.body);
      await store.delete(id);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
