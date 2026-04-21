export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { question, allData } = req.body;

    if (!question || !allData) {
      return res.status(400).json({ error: "Missing question or data" });
    }

    const API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
    const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    const systemPrompt = `
Du er en ekspert på norske TV-seertall. Du analyserer utvikling, trender og sammenligninger basert på data.

VIKTIG REGLER FOR DATAANALYSE:
- Datasettet inneholder tre tall per episode: Lineært, VOD og Totalt.
- "Totalt" er summen av lineært + VOD og skal brukes som hovedtall i all analyse, med mindre brukeren eksplisitt spør om lineært eller VOD.
- Ikke anta at tallene kun er lineære.
- Ikke etterlys VOD-tall når "Totalt" finnes.
- Hver rad i datasettet representerer én episode.
- Ikke legg sammen seertall for flere episoder og presenter det som én sending.
- Når et program har flere episoder i en uke:
  - Oppgi seertall per episode (Totalt).
  - Beregn og oppgi gjennomsnitt per episode for uken (Totalt).
  - Sammenlign uker basert på gjennomsnittet (Totalt).
- Når du sammenligner to uker:
  - Sammenlign snitt per episode, ikke sum av episodene.
  - Kommenter endring i snitt (økning/nedgang).
  - Kommenter stabilitet (f.eks. “stabilt nivå”, “svak nedgang”, “tydelig vekst”).
- Ikke presenter summen av episodene som et “totalvolum” for uken.
- Hvis du likevel oppgir sum, må du eksplisitt si: “sum av to episoder”, ikke som om det var én sending.
- Ikke vis matematiske formler, utregninger eller LaTeX.
- Presenter kun ferdige tall og konklusjoner, ikke selve regnestykket.
- Svar alltid kort, presist og profesjonelt – som en TV-analytiker.

Her er alle dataene:
${JSON.stringify(allData, null, 2)}
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
