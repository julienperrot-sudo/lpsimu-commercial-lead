exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, source } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: "Tu es un assistant commercial pour LP SIMU, fabricant de simulateurs de course.\n\nAnalyse ce message et extrais les informations en JSON UNIQUEMENT (aucun texte avant/apres) :\n\n{\"prenom\":\"\",\"nom\":\"\",\"email\":\"\",\"telephone\":\"\",\"ville\":\"\",\"pays\":\"France\",\"simulateur\":\"\",\"budget\":\"\",\"statut\":\"Nouveau contact\",\"commentaires\":\"\"}\n\nRegles:\n- simulateur : choisir parmi [LP Box, LP1, LP2, LP3, LP4, LP5, LP Rally, LP Sur-mesure] ou vide\n- budget : chiffres uniquement ex 15000\n- commentaires : resumer en 1 phrase\n- Si absent laisser vide\n\nMessage : \"" + message + "\""
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "API error" }) };
    }

    const text = data.content[0].text.trim().replace(/```json|```/g, "").trim();
    const lead = JSON.parse(text);
    lead.source = source;
    lead.date = new Date().toLocaleDateString("fr-FR");
    lead.id = Date.now().toString();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
