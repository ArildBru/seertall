import { readdir } from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  try {
    const folder = path.join(process.cwd(), "weeks");
    const files = await readdir(folder);

    const jsonFiles = files.filter(f => f.endsWith(".json"));

    res.status(200).json(jsonFiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
