import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(req, res) {
  try {
    const { week, channel } = req.query;

    if (!week || !channel) {
      return res.status(400).json({ error: "Missing week or channel" });
    }

    const blobName = `uke-${week}-${channel}.json`;

    const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const container = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
    const blob = container.getBlobClient(blobName);

    const exists = await blob.exists();
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    const download = await blob.download();
    const content = await streamToString(download.readableStreamBody);

    res.status(200).json(JSON.parse(content));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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
