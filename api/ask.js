// api/ask.js
import fs from "fs";
import path from "path";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4.1-mini"; // eller annen modell du bruker

// Leser ALLE uke-filer og bygger et samlet datasett
function loadAllRecords() {
  const baseDir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(baseDir);

  const ukeFiles = files.filter(
    (f) => f.toLowerCase().startsWith("uke-") && f.endsWith(".json")
  );

  let all = [];

  for (const file of ukeFiles) {
    const full = path.join(baseDir, file);
    const raw = fs.readFileSync(full, "utf8");

    const weekMatch = file.match(/uke-(\d+)/i);
    const uke = weekMatch ? parseInt(weekMatch[1], 10) : null;

    const json = JSON.parse(raw);
    const rows = Array.isArray(json) ? json : json.data || [];

    for (const r of rows) {
      all.push({
        uke,
        kanal: r.mediehus || r.Mediehus || null,
        tittel: r.tittel || r.Tittel || null,
        seere: r.seere || r.Totalt || null
      });
    }
  }

  return all.filter((r) => r.uke && r.tittel && r.seere);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { question } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Missing question" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const records = loadAllRecords();
    const dataJson = JSON.stringify(records.slice(0, 800)); // begrens for sikkerhet

    const systemPrompt = `
Du er en norsk TV-analytiker. Du får seertall-data som JSON.
Bruk KUN tallene du får. Ikke gjett.
Hvis brukeren sammenligner programmer, finn utviklingen uke for uke.
Svar kort, presist og på norsk.
`;

    const userPrompt = `
Data:
${dataJson}

Spørsmål:
${question}

Gi et klart og datadrevet svar basert på tallene.
`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    const json = await response.json();
    const answer = json.choices?.[0]?.message?.content || "Ingen respons.";

    return res.status(200).json({
      ok: true,
      question,
      usedRecords: records.length,
      answer
    });
  } catch (err) {
    console.error("ask.js error:", err);
    return res.status(500).json({ error: "ask.js failed", details: String(err) });
  }
}
