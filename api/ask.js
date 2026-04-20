export default async function handler(req, res) {
  try {
    const { question } = req.body;

    const API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
    const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    const systemPrompt = `
Du er en ekspert på norske TV-seertall. Du analyserer utvikling, trender og sammenligninger basert på data.
Svar kort, presist og med tydelige konklusjoner.
    `;

    const userPrompt = `
Bruk seertallsdataene og svar på dette spørsmålet:
${question}
    `;

    const response = await fetch(
      `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2024-10-01-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AZURE ERROR:", JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: "Azure OpenAI request failed",
        details: data
      });
    }

    const answer = data.choices?.[0]?.message?.content || "Ingen respons fra modellen.";

    res.status(200).json({
      ok: true,
      answer
    });

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
