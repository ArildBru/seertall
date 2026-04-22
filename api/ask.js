export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Mottar data fra analyse.html
    const { question, data } = req.body;

    if (!question || !data) {
      return res.status(400).json({ error: "Missing question or data" });
    }

    const API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
    const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    // Systemprompt med regler + datasettet
    const systemPrompt = `
Du er en ekspert på norske TV-seertall. Du analyserer utvikling, trender og sammenligninger basert på data.

VIKTIGE DATAREGLER:
- Datasettet inneholder alltid: episode, lineært, VOD, totalt og mediehus.
- Feltet "totalt" er summen av lineært + VOD.
- Feltet "seere" er identisk med "totalt".
- Når brukeren spør om seertall uten å spesifisere type, bruk "totalt".
- Når brukeren spør spesifikt om VOD, bruk feltet "vod".
- Når brukeren spør spesifikt om lineært, bruk feltet "lineært".
- Ikke anta at tallene kun er lineære.
- Ikke si at VOD mangler — VOD finnes alltid i datasettet.
- Ikke etterlys VOD-tall når "vod" er oppgitt.

REGLER FOR ANALYSE:
- Hver rad i datasettet representerer én episode.
- Oppgi tall per episode når relevant.
- Når et program har flere episoder i en uke:
  - Oppgi tall per episode.
  - Beregn og oppgi gjennomsnitt per episode for uken.
  - Sammenlign uker basert på gjennomsnitt.
- Når du sammenligner to uker:
  - Sammenlign snitt per episode.
  - Kommenter endring (økning/nedgang).
  - Kommenter stabilitet (f.eks. “stabilt nivå”, “svak nedgang”, “tydelig vekst”).

SPRÅKREGLER:
- Ikke vis matematiske formler.
- Presenter kun ferdige tall og konklusjoner.
- Svar kort, presist og profesjonelt – som en TV-analytiker.

Her er alle dataene:
${JSON.stringify(data, null, 2)}
    `;

    const userPrompt = `
Bruk seertallsdataene og svar på dette spørsmålet:
${question}
    `;

    // Kall Azure OpenAI
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

    const result = await response.json();

    if (!response.ok) {
      console.error("AZURE ERROR:", JSON.stringify(result, null, 2));
      return res.status(500).json({
        error: "Azure OpenAI request failed",
        details: result
      });
    }

    const answer =
      result.choices?.[0]?.message?.content || "Ingen respons fra modellen.";

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
