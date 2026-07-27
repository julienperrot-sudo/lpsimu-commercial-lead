const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, source } = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Tu es un assistant commercial pour LP SIMU, fabricant de simulateurs de course haut de gamme.

Analyse ce message d'un prospect et extrais les informations en JSON UNIQUEMENT (aucun texte avant/après, aucun markdown) :

{"prenom":"","nom":"","email":"","telephone":"","ville":"","pays":"France","simulateur":"","budget":"","statut":"Nouveau contact","commentaires":""}

Règles :
- simulateur : choisir parmi [LP Box, LP1, LP2, LP3, LP4, LP5, LP Rally, LP Sur-mesure] ou laisser vide
- budget : montant en chiffres uniquement (ex: "15000"), vide si non mentionné
- commentaires : résumer en 1 phrase ce que veut le prospect
- source sera ajoutée séparément
- Si info absente, laisser ""

Message : "${message}"`
      }]
    });

    const text = response.content[0].text.trim().replace(/```json|```/g, "").trim();
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
