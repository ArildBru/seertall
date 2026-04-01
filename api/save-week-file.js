export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { filename, data } = req.body;

  if (!filename || !data) {
    return res.status(400).json({ error: 'Missing filename or data' });
  }

  try {
    const jsonString = JSON.stringify(data, null, 2);

    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = 'ArildBru';
    const repoName = 'SEERTALL';
    const filePath = `data/${filename}`;

    // Sjekk om filen finnes fra før
    const existing = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );

    let sha = null;
    if (existing.status === 200) {
      const json = await existing.json();
      sha = json.sha;
    }

    // Lagre filen
    const saveRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: `Oppdaterer ${filename}`,
          content: Buffer.from(jsonString).toString('base64'),
          sha
        })
      }
    );

    if (!saveRes.ok) {
      const err = await saveRes.text();
      return res.status(500).json({ error: 'GitHub error', details: err });
    }

    return res.status(200).json({ ok: true, filename });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
