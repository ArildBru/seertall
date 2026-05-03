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

    // Vi sender inn et lite, komprimert datasett til modellen
    // For robusthet: begrens til f.eks. 200–300 rader
    const limitedRows = rows.slice(0, 300);

    const systemPrompt = `
Du er en ekstremt nøyaktig analytiker av norske TV-seertall.
Du får et datasett med rader. Hver rad har disse feltene:

- uke: (nummer, f.eks. 17)
- kanal: (streng, f.eks. "nrk", "tv2", "discovery", "nent")
- program: (streng, f.eks. "The Voice – Norges beste stemme")
- episode: (nummer)
- total: (totalt antall seere)
- lineart: (lineære seere)
- vod: (VOD-seere)

VIKTIGE REGLER (FØLG DISSE STRIKT):

1. Du skal KUN bruke dataene i "rows" som grunnlag.
   - Ikke gjett.
   - Ikke anta tall.
   - Ikke bruk eksterne kilder.

2. Når brukeren spør om en bestemt uke:
   - Filtrer KUN på rader der "uke" matcher.
   - Ikke bruk andre uker.

3. Når brukeren spør om en kanal (f.eks. "TV 2", "NRK"):
   - Tolke kanalnavn slik:
     - "NRK" → kanal = "nrk"
     - "TV 2" / "TV2" → kanal = "tv2"
     - "Discovery" → kanal = "discovery"
     - "NENT" / "Viaplay" → kanal = "nent"
   - Filtrer KUN på rader med den kanalen.

4. Når brukeren spør om et program:
   - Sammenlign mot feltet "program".
   - Du skal ikke slå sammen eller normalisere navn.
   - Hvis brukeren skriver "the voice", skal du matche mot programmer som inneholder "voice" (case-insensitive).
   - Men du skal ALDRI endre tittelen – bruk den nøyaktig slik den står i datasettet når du svarer.

5. Når du skal finne "størst", "mest sett" eller "topp":
   - Bruk feltet "total" som sorteringsgrunnlag, med mindre brukeren eksplisitt ber om noe annet.
   - Sorter synkende (høyest først).

6. Hvis det ikke finnes noen rader som matcher spørsmålet:
   - Svar tydelig at programmet/kanalen/uken ikke finnes i datasettet.
   - Ikke gjett.

7. Svarestil:
   - Svar kort, presist og på norsk.
   - Først: direkte svar i én setning.
   - Deretter (valgfritt): én kort setning med innsikt, f.eks. om nivået er høyt/lavt eller om det dominerer kanalen.
   - Ikke vis rå JSON.
   - Ikke forklar hvordan du tenker, bare gi konklusjonen.

Eksempler på gode svar:

- "The Voice – Norges beste stemme hadde 581 680 seere totalt på TV 2 i uke 17. Det gjør programmet til det mest sette på kanalen denne uken."
- "I uke 17 var 'Kompani Lauritzen' størst på TV 2 med 511 850 seere totalt."
- "Jeg finner ingen rader for 'The Voice' i uke 18 i datasettet du har lastet inn."
`;

    const userContent = `
Spørsmål fra bruker:
"${question}"

Dette er datasettet (rows) du skal analysere:
${JSON.stringify(limitedRows, null, 2)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.1, // lav temperatur for mer deterministisk oppførsel
      max_tokens: 400
    });

    const answer = completion.choices[0].message.content;

    return res.status(200).json({
      ok: true,
      answer
    });

  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
