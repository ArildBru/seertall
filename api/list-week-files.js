import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "weeks";

    if (!AZURE_CONNECTION_STRING) {
      return res.status(500).json({ error: "Missing Azure connection string" });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const files = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.endsWith(".json")) {
        files.push(blob.name);
      }
    }

    res.status(200).json({ ok: true, files });

  } catch (err) {
    console.error("Feil i list-week-files:", err);
    res.status(500).json({ ok: false, error: "Kunne ikke hente fil-liste." });
  }
}
