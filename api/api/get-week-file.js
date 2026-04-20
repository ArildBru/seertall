import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ ok: false, error: "Missing file parameter" });
    }

    const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "weeks";

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(file);

    const download = await blobClient.download();
    const content = await streamToString(download.readableStreamBody);

    res.status(200).json(JSON.parse(content));
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
