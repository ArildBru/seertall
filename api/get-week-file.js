const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async (req, res) => {
  try {
    const filename = req.query.filename;

    if (!filename) {
      res.status(400).json({ ok: false, error: "Missing filename" });
      return;
    }

    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;

    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(filename);

    // Last ned blob
    const download = await blobClient.download();
    const buffer = await streamToBuffer(download.readableStreamBody);
    const json = JSON.parse(buffer.toString());

    res.status(200).json({ ok: true, filename, rows: json });
  } catch (error) {
    console.error("Get error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (d) => chunks.push(d));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
