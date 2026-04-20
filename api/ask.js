export default async function handler(req, res) {
  try {
    const { question, week, channel, data } = req.body;

    if (!question) {
      return res.status(400).json({ ok: false, error: "Missing question" });
    }

    // Bygg kontekst til AI
    const context = `
Du er en ekspert på norske TV-seertall.
Du får ukedata fra ${channel.toUpperCase()} for uke ${week}.
Dataene er en liste av programmer med feltene:
- Tittel
- Sesong
- Episode
- Totalt
- Lineært
- VOD

Her er rådataene:
${JSON.stringify(data, null, 2)}

Oppgave:
Svar på spørsmålet fra brukeren på en klar, presis og forståelig måte.
Bruk tallene i datasettet.
Gjør sammenligninger når relevant.
Gi innsikt, trender og forklaringer.
Skriv på norsk.
`;

    // Kall OpenAI / Azure OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question }
        ],
        temperature: 0.3
      })
    });

    const json = await aiRes.json();

    const answer = json.choices?.[0]?.message?.content || "Ingen respons fra AI.";

    res.status(200).json({ ok: true, answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}

