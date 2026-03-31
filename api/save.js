import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const data = req.body;

    // Filnavn basert på uke
    const filename = `uke-${data.uke}.json`;

    // Absolutt sti til /data/
    const filePath = path.join(process.cwd(), "data", filename);

    // Lagre filen
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ success: true, file: filename });
  } catch (err) {
    return res.status(500).json({ error: "Could not save file", details: err });
  }
}
