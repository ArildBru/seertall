import { readFile } from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  try {
    const { filename } = req.query;

    const filePath = path.join(process.cwd(), "weeks", filename);
    const content = await readFile(filePath, "utf8");

    res.status(200).json({ data: JSON.parse(content) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
