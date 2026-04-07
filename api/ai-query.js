// api/ai-query.js
import fs from "fs";
import path from "path";

function normalizeChannelName(raw) {
  if (!raw) return "";
  const s = String(raw).toLowerCase().replace(/\s+/g, "");
  if (s.includes("tv2")) return "TV 2";
  if (s.includes("nrk")) return "NRK";
  if (s.includes("discovery")) return "Discovery";
  if (s.includes("nent") || s.includes("viaplay")) return "NENT";
  return raw;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { question, week, channel, title } = req.body || {};

    const baseDir = path.join(process.cwd(), "data");

    if (!fs.existsSync(baseDir)) {
      return res.status(500).json({
        error: "Data directory not found",
        expectedPath: baseDir
      });
    }

    const allFiles = fs.readdirSync(baseDir);

    // Alle filer som ser ut som uke-filer
    const ukeFiles = allFiles.filter((file) =>
      file.toLowerCase().startsWith("uke-") && file.toLowerCase().endsWith(".json")
    );

    let allRecords = [];

    for (const file of ukeFiles) {
      const fullPath = path.join(baseDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");

      // Uke fra filnavn, f.eks. "uke-13-tv2.json" → 13
      const weekMatch = file.toLowerCase().match(/uke-(\d+)/);
      const ukeNum = weekMatch ? parseInt(weekMatch[1], 10) : null;

      try {
        const json = JSON.parse(raw);

        const rows = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];

        const mapped = rows.map((row) => {
          const mediehusRaw = row.Mediehus || row.mediehus || null;
          const kanal = normalizeChannelName(mediehusRaw);

          return {
            uke: ukeNum,
            kanal,
            ...row
          };
        });

        allRecords = allRecords.concat(mapped);
      } catch (err) {
        console.error("JSON parse error in file:", file, err);
      }
    }

    // Filtrering
    let filtered = allRecords;

    if (week) {
      const w = Number(week);
      filtered = filtered.filter((row) => row.uke === w);
    }

    if (channel) {
      const ch = String(channel).toLowerCase().replace(/\s+/g, "");
      filtered = filtered.filter((row) => {
        const k = (row.kanal || "").toLowerCase().replace(/\s+/g, "");
        return k.includes(ch);
      });
    }

    if (title) {
      const t = String(title).toLowerCase();
      filtered = filtered.filter((row) => {
        const rTitle = (row.tittel || row.Tittel || "").toLowerCase();
        return rTitle.includes(t);
      });
    }

    return res.status(200).json({
      ok: true,
      question: question || null,
      totalRecords: allRecords.length,
      filteredRecords: filtered.length,
      sample: filtered.slice(0, 20)
    });

  } catch (err) {
    console.error("AI-query error:", err);
    return res.status(500).json({
      error: "AI-query failed",
      details: String(err)
    });
  }
}
