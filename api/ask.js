const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Only POST allowed" });
    }

    const { question, rows } = req.body;

    if (!question || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ ok: false, error: "Missing question or rows" });
    }

    // --- 1. Komprimer datasettet ---
    const compactRows = rows.map(r => ({
      uke: r.uke,
      kanal: r.kanal,
      program: r.program,
      episode: r.episode,
      total: r.total
    }));

    const systemPrompt = `
Du er en ekstremt nøyaktig analytiker av norske TV-seertall.
Du skal KUN bruke dataene i 'rows'. Ikke gjett. Ikke anta.

Regler:
- Filtrer på uke hvis brukeren nevner det.
- Filtrer på kanal hvis brukeren nevner det.
- Programnavn må matche (case-insensitive substring).
- Sorter etter 'total' når brukeren spør om mest sett.
- Hvis ingen rader matcher: si det tydelig.
- Svar kort og presist, på norsk.
`;

    const userPrompt = `
Spørsmål: "${question}"

Rader (komprimert):
${JSON.stringify(compactRows)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const answer = completion.choices[0].message.content;

    return res.status(200).json({
      ok: true,
      answer
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "AI-kallet feilet. Sjekk server-logg."
    });
  }
};
