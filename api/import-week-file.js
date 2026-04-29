import formidable from "formidable";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

export const config = {
  api: {
    bodyParser: false, // VIKTIG: lar oss lese multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("Form error:", err);
        return res.status(500).json({ ok: false, error: "Form parse error" });
      }

      const week = fields.week;
      const file = files.file;

      if (!week || !file) {
        return res.status(400).json({ ok: false, error: "Missing week or file" });
      }

      // Les Excel
      const workbook = xlsx.readFile(file.filepath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      // Lag mappe hvis den ikke finnes
      const dir = path.join(process.cwd(), "data", "weeks");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Lag filnavn
      const filename = `uke-${week}.json`;
      const filepath = path.join(dir, filename);

      // Lagre JSON
      fs.writeFileSync(filepath