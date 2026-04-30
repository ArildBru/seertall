const formidable = require("formidable");
const xlsx = require("xlsx");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Only POST allowed" });
    return;
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form error:", err);
      res.status(500).json({ ok: false, error: "Form parse error" });
      return;
    }

    try {
      const week = fields.week;
      const file = files.file;

      if (!week || !file) {
        res.status(400).json({ ok: false, error: "Missing week or file" });
        return;
      }

      // Les Excel-filen
      const workbook = xlsx.readFile(file.filepath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      // Azure Blob Storage-klient
      const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
      const containerName = process.env.AZURE_STORAGE_CONTAINER;

      const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
      const blobServiceClient = new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        sharedKeyCredential
      );

      // Sørg for at containeren finnes
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      // Blob-navn
      const blobName = `uke-${week}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Last opp JSON
      const jsonData = JSON.stringify(rows, null, 2);
      await blockBlobClient.upload(jsonData, Buffer.byteLength(jsonData), {
        blobHTTPHeaders: { blobContentType: "application/json" },
      });

      res.status(200).json({
        ok: true,
        week,
        rows: rows.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });
};
