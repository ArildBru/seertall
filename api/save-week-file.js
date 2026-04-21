import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { filename, data } = req.body;

    if (!filename || !data) {
      return res.status(400).json({ ok: false, error: "Missing filename or data" });
    }

    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "weeks";

    if (!AZURE_CONNECTION_STRING) {
      return res.status(500).json({ ok: false, error: "Missing Azure connection string" });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Sørg for at containeren finnes
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(filename);

    const jsonString = JSON.stringify(data, null, 2);

    await blobClient.upload(jsonString, Buffer.byteLength(jsonString), {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    res.status(200).json({ ok: true, saved: filename });

  } catch (err) {
    console.error("Feil i save-week-file:", err);
    res.status(500).json({ ok: false, error: "Kunne ikke lagre filen." });
  }
}
