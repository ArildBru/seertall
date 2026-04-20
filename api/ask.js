export default async function handler(req, res) {
  try {
    const { question, allData } = req.body;

    if (!question) {
      return res.status(400).json({ ok: false, error: "Missing question" });
    }

    const context = `
Du er en ekspert på norske TV-seertall.
Du får ALLE ukedata som er lastet opp i systemet.
Dataene er strukturert slik:
[
  {
    file: "uke-16-tv2.json",
    data: [ { Tittel, Sesong, Episode, Totalt, Lineært, VOD }, ... ]
  },
  ...
]

Bruk disse dataene til å svare på spørsmål.
Du kan:
- sammenligne kanaler
- sammenligne uker
- finne trender
- lage topplister
- lage pitch-tekster
- analysere utvikling over tid
- finne vinnere og tapere

Svar på norsk.
Her er alle dataene:
${JSON.stringify(allData, null, 2)}
`;

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
    console.error("Feil i ask:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
