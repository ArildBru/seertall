const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Only POST allowed" });
    }

    const { week, rows } = req.body;

    if (!week || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ ok: false, error: "Missing week or rows" });
    }

    // --- 1. Finn kanalnavn ---
    let kanalRaw = "";
    if (rows[0].Mediehus) kanalRaw = rows[0].Mediehus;
    if (rows[0].mediehus) kanalRaw = rows[0].mediehus;
    if (rows[0].Kanal) kanalRaw = rows[0].Kanal;
    if (rows[0].kanal) kanalRaw = rows[0].kanal;

    const kanal = kanalRaw
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");

    // --- 2. Lag riktig filnavn ---
    const filename = `uke-${week}-${kanal}.json`;

    // --- 3. Konverter rader ---
    const jsonRows = rows.map((r) => ({
      uke: Number(week),
      kanal: kanal,
      program: r.Tittel || r.tittel || "",
      episode: Number(r.Episode || r.episode || 0),
      lineart: Number(r.Lineært || r.lineart || 0),
      vod: Number(r.VOD || r.vod || 0),
      total: Number(r.Totalt || r.totalt || 0)
    }));

    // --- 4. Lagre til Azure Blob Storage ---
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = "weeks";

    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(filename);

    await blobClient.upload(JSON.stringify({ filename, rows: jsonRows }, null, 2), Buffer.byteLength(JSON.stringify({ filename, rows: jsonRows })));

    return res.status(200).json({
      ok: true,
      saved: filename,
      rows: jsonRows.length
    });

  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
