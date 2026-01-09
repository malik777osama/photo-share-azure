const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

function getBlobServiceClient() {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_KEY;

  if (!account || !key) {
    throw new Error("Missing AZURE_STORAGE_ACCOUNT or AZURE_STORAGE_KEY in .env");
  }

  const credential = new StorageSharedKeyCredential(account, key);
  return new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
}

async function uploadImage(buffer, filename, contentType) {
  const containerName = process.env.AZURE_STORAGE_CONTAINER || "images";

  const service = getBlobServiceClient();
  const container = service.getContainerClient(containerName);

  const blob = container.getBlockBlobClient(filename);

  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" },
  });

  return blob.url;
}

module.exports = { uploadImage };
