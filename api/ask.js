import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  console.log("ASK API STARTER");

  try {
    if (req.method !== "POST") {
      console.log("FEIL: Ikke POST");
      return res.status(405).json({ ok: false, error: "Only POST allowed" });
    }

    const { question, rows } = req.body;

    if (!question) {
      console.log("FEIL: Mangler spørsmål");
      return res.status(200).json({ ok: true, answer: "Du må skrive et spørsmål." });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      console.log("FEIL: Ingen rader mottatt");
      return res.status(200).json({
        ok: true,
        answer: "Datasettet inneholder ingen rader. Last opp ukedata først."
      });
    }

    const compact = rows.map(r => ({
      uke: r.uke,
      kanal: r.kanal,
      program: r.program,
      total: r.total
    }));

    const systemPrompt = `
Du er en ekstremt nøyaktig analytiker av norske TV-seertall.
Du skal KUN bruke dataene i 'rows'. Ikke gjett. Ikke anta.
Regler:
- Filtrer på uke hvis brukeren nevner det.
- Filtrer på kanal hvis brukeren nevner det.
- Programnavn matches med case-insensitive substring.
- Sorter etter 'total' når brukeren spør om mest sett.
- Hvis ingen rader matcher: si det tydelig.
- Svar kort og presist, på norsk.
`;

    const userPrompt = `
Spørsmål: "${question}"
Rader:
${JSON.stringify(compact)}
`;

    console.log("KALLER OPENAI…");

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    console.log("OPENAI SVARTE");

    const answer = completion.choices?.[0]?.message?.content || "Ingen respons fra AI.";

    console.log("ASK API FULLFØRT");

    return res.status(200).json({ ok: true, answer });

  } catch (err) {
    console.error("SERVER FEIL:", err);
    return res.status(200).json({
      ok: true,
      answer: "Serverfeil: " + err.message
    });
  }
}
