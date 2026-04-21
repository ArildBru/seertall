export default async function handler(req, res) {
  try {
    const { question, allData } = req.body;

    if (!question) {
      return res.status(400).json({ ok: false, error: "Missing question" });
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

    const context = `
Du er en ekspert på norske TV-seertall.

VIKTIG REGLER FOR DATAANALYSE:
- Hver rad i datasettet representerer én episode.
- Ikke legg sammen seertall for flere episoder og presenter det som én sending.
- Når et program har flere episoder i en uke:
  - Oppgi seertall per episode.
  - Beregn og oppgi gjennomsnitt per episode for uken.
  - Bruk gjennomsnittet når du sammenligner uker.
- Når du sammenligner to uker:
  - Sammenlign snitt per episode, ikke sum av episodene.
  - Kommenter endring i snitt (økning/nedgang).
  - Kommenter stabilitet (f.eks. “stabilt nivå”, “svak nedgang”, “tydelig vekst”).
- Ikke presenter summen av episodene som et “totalvolum” for uken.
- Hvis du likevel oppgir sum, må du eksplisitt si: “sum av to episoder”, ikke som om det var én sending.

Dataene er strukturert slik:
[
  {
    file: "uke-16-tv2.json",
    data: [ { Tittel, Sesong, Episode, Totalt, Lineært, VOD }, ... ]
  },
  ...
]

Bruk disse dataene til å svare på spørsmål.
Svar på norsk.
Her er alle dataene:
${JSON.stringify(allData, null, 2)}
`;


    const aiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
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
