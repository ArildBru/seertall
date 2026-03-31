export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const data = req.body;
    const filename = `uke-${data.uke}.json`;

    const token = process.env.GITHUB_TOKEN;

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    const url = `https://api.github.com/repos/ArildBru/seertall/contents/data/${filename}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Legger til ${filename}`,
        content: content,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log("GitHub error:", result);
      return res.status(500).json({ error: "GitHub error", details: result });
    }

    return res.status(200).json({ success: true, file: filename });

  } catch (err) {
    return res.status(500).json({ error: "Could not save file", details: err });
  }
}
