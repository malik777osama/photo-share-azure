const { CosmosClient } = require("@azure/cosmos");

function getClient() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error("Missing COSMOS_ENDPOINT or COSMOS_KEY in environment variables");
  }

  return new CosmosClient({ endpoint, key });
}

function getContainer(containerName) {
  const dbName = process.env.COSMOS_DB || "photosapp";
  const client = getClient();
  return client.database(dbName).container(containerName);
}

module.exports = { getContainer };
