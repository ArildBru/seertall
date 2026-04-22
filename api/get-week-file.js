import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ ok: false, error: "Missing filename" });
    }

    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "weeks";

    if (!AZURE_CONNECTION_STRING) {
      return res.status(500).json({ ok: false, error: "Missing Azure connection string" });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(filename);

    const exists = await blobClient.exists();
    if (!exists) {
      return res.status(404).json({ ok: false, error: "File not found" });
    }

    const download = await blobClient.download();
    const downloaded = await streamToString(download.readableStreamBody);

    const json = JSON.parse(downloaded);

    res.status(200).json({ ok: true, data: json });

  } catch (err) {
    console.error("Feil i get-week-file:", err);
    res.status(500).json({ ok: false, error: "Kunne ikke hente filen." });
  }
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (d) => chunks.push(d));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}
