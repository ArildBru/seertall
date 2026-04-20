import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "weeks";

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const files = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      files.push(blob.name);
    }

    res.status(200).json({ ok: true, files });
  } catch (err) {
    console.error("Feil i list-week-files:", err);
    res.status(500).json({ ok: false, error: "Kunne ikke hente filene." });
  }
}
