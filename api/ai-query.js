// api/ai-query.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { question, week, channel } = req.body || {};

    // 1) Finn alle uke-JSON-filer
    const baseDir = process.cwd(); // juster hvis du flytter filene
    const allFiles = fs.readdirSync(baseDir);

    const weekFiles = allFiles.filter((file) =>
      /^uke-\d+.*\.json$/i.test(file)
    );

    let allRecords = [];

    for (const file of weekFiles) {
      const fullPath = path.join(baseDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const json = JSON.parse(raw);

      // antar at hver fil er en array med rader
      if (Array.isArray(json)) {
        allRecords = allRecords.concat(json);
      } else {
        // hvis det er et objekt med f.eks. { data: [...] }
        if (Array.isArray(json.data)) {
          allRecords = allRecords.concat(json.data);
        }
      }
    }

    // 2) Enkel filtrering (uke / kanal) før AI
    let filtered = allRecords;

    if (week) {
      const weekStr = String(week);
      filtered = filtered.filter((row) => {
        // du kan tilpasse dette til hvordan uke lagres
        return (
          row.uke === weekStr ||
          row.uke === Number(weekStr) ||
          (row.Uke && String(row.Uke) === weekStr)
        );
      });
    }

    if (channel) {
      const ch = String(channel).toLowerCase();
      filtered = filtered.filter((row) => {
        const mediehus = (row.Mediehus || row.mediehus || "").toLowerCase();
        return mediehus.includes(ch);
      });
    }

    // 3) Foreløpig: bare returner data + litt meta
    return res.status(200).json({
      ok: true,
      question: question || null,
      totalRecords: allRecords.length,
      filteredRecords: filtered.length,
      sample: filtered.slice(0, 10), // liten smakebit
    });
  } catch (err) {
    console.error("AI-query error:", err);
    return res.status(500).json({ error: "AI-query failed", details: String(err) });
  }
}
