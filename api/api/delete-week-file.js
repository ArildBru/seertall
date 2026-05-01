const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async (req, res) => {
  try {
    const filename = req.query.filename;

    if (!filename) {
      return res.status(400).json({ ok: false, error: "Missing filename" });
    }

    // Azure credentials
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;

    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(filename);

    // Check if file exists
    const exists = await blobClient.exists();
    if (!exists) {
      return res.status(404).json({ ok: false, error: "File not found" });
    }

    // Delete file
    await blobClient.delete();

    return res.status(200).json({
      ok: true,
      deleted: filename
    });

  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

