import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  try {
    const { week, rows } = req.body;

    if (!week || !rows) {
      return res.status(400).json({ ok: false, error: "Missing week or rows" });
    }

    // Lag mappe hvis den ikke finnes
    const dir = path.join(process.cwd(), "data", "weeks");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Lag filnavn
    const filename = `uke-${week}.json`;
    const filepath = path.join(dir, filename);

    // Lagre JSON
    fs.writeFileSync(filepath, JSON.stringify(rows, null, 2), "utf8");

    return res.status(200).json({
      ok: true,
      week,
      rows: rows.length,
    });
  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
