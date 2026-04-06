// api/ai-query.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { question, week, channel } = req.body || {};

    // 1) JSON-filene ligger i /data
    const baseDir = path.join(process.cwd(), "data");

    if (!fs.existsSync(baseDir)) {
      return res.status(500).json({
        error: "Data directory not found",
        expectedPath: baseDir
      });
    }

    // 2) Finn filer som matcher uke-XX*.json
    const allFiles = fs.readdirSync(baseDir);
    const weekPrefix = `uke-${week}`;
    const weekFiles = allFiles.filter((file) =>
      file.toLowerCase().startsWith(weekPrefix)
    );

    if (weekFiles.length === 0) {
      return res.status(200).json({
        ok: true,
        message: `No files found for week ${week}`,
        totalRecords: 0,
        filteredRecords: 0,
        sample: []
      });
    }

    let allRecords = [];

    // 3) Les alle JSON-filene for riktig uke
    for (const file of weekFiles) {
      const fullPath = path.join(baseDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");

      try {
        const json = JSON.parse(raw);

        if (Array.isArray(json)) {
          allRecords = allRecords.concat(json);
        } else if (Array.isArray(json.data)) {
          allRecords = allRecords.concat(json.data);
        }
      } catch (err) {
        console.error("JSON parse error in file:", file, err);
      }
    }

    // 4) Filtrering på kanal (robust matching)
    let filtered = allRecords;

    if (channel) {
      const ch = String(channel).toLowerCase().replace(/\s+/g, "");

      filtered = filtered.filter((row) => {
        const mediehus = (row.Mediehus || row.mediehus || "")
          .toLowerCase()
          .replace(/\s+/g, "");

        return mediehus.includes(ch);
      });
    }

    // 5) Returner resultatene
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
