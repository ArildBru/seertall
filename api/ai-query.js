// api/ai-query.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { question, week, channel } = req.body || {};

    // 1) Hvor JSON-filene ligger
    const baseDir = path.join(process.cwd(), "data", "weeks");

    if (!fs.existsSync(baseDir)) {
      return res.status(500).json({
        error: "Data directory not found",
        expectedPath: baseDir
      });
    }

    // 2) Finn alle uke-*.json filer
    const allFiles = fs.readdirSync(baseDir);
    const weekFiles = allFiles.filter((file) =>
      /^uke-\d+.*\.json$/i.test(file)
    );

    let allRecords = [];

    // 3) Les alle JSON-filene
    for (const file of weekFiles) {
      const fullPath = path.join(baseDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");

      try {
        const json = JSON.parse(raw);

        // Hvis filen er en array
        if (Array.isArray(json)) {
          allRecords = allRecords.concat(json);
        }
        // Hvis filen er et objekt med data: [...]
        else if (Array.isArray(json.data)) {
          allRecords = allRecords.concat(json.data);
        }
      } catch (err) {
        console.error("JSON parse error in file:", file, err);
      }
    }

    // 4) Filtrering (uke og kanal)
    let filtered = allRecords;

    if (week) {
      const weekStr = String(week);
      filtered = filtered.filter((row) => {
        const ukeValue =
          row.uke || row.Uke || row.week || row.Week || null;

        return ukeValue && String(ukeValue) === weekStr;
      });
    }

    if (channel) {
      const ch = String(channel).toLowerCase();
      filtered = filtered.filter((row) => {
        const mediehus = (row.Mediehus || row.mediehus || "").toLowerCase();
        return mediehus.includes(ch);
      });
    }

    // 5) Foreløpig returnerer vi bare data — AI kommer i neste steg
    return res.status(200).json({
      ok: true,
      question: question || null,
      totalRecords: allRecords.length,
      filteredRecords: filtered.length,
      sample: filtered.slice(0, 10)
    });

  } catch (err) {
    console.error("AI-query error:", err);
    return res.status(500).json({
      error: "AI-query failed",
      details: String(err)
    });
  }
}
