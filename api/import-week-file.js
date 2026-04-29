const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Only POST allowed" });
    return;
  }

  const form = formidable({ multiples: false });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Form error:", err);
      res.status(500).json({ ok: false, error: "Form parse error" });
      return;
    }

    try {
      const week = fields.week;
      const file = files.file;

      if (!week || !file) {
        res.status(400).json({ ok: false, error: "Missing week or file" });
        return;
      }

      const workbook = xlsx.readFile(file.filepath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      const dir = path.join(process.cwd(), "data", "weeks");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = `uke-${week}.json`;
      const filepath = path.join(dir, filename);

      fs.writeFileSync(filepath, JSON.stringify(rows, null, 2), "utf8");

      res.status(200).json({
        ok: true,
        week,
        rows: rows.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
