import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { filename, data } = req.body;

  if (!filename || !data) {
    return res.status(400).json({ error: "Missing filename or data" });
  }

  try {
    // 1. Koble til Azure Blob Storage
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;

    const connectionString =
      `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${key};EndpointSuffix=core.windows.net`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // 2. Konverter data til JSON
    const jsonString = JSON.stringify(data, null, 2);
    const blobClient = containerClient.getBlockBlobClient(filename);

    // 3. Last opp filen
    await blobClient.upload(jsonString, Buffer.byteLength(jsonString), {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    return res.status(200).json({ ok: true, filename });
  } catch (err) {
    console.error("Azure upload error:", err);
    return res.status(500).json({ error: "Azure upload failed", details: err.message });
  }
}
