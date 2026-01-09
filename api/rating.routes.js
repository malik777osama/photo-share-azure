const { getContainer } = require("./cosmos");

function registerRatingRoutes(app) {
  const ratings = getContainer("ratings");

  // POST /api/posts/:id/rating   body: { rating: 1..5 }
  app.post("/api/posts/:id/rating", async (req, res) => {
    try {
      const postId = req.params.id;
      const rating = Number(req.body?.rating);

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "rating must be a number 1-5" });
      }

      // ✅ safest: fetch existing aggregate by querying postId
      const { resources } = await ratings.items
        .query({
          query: "SELECT * FROM c WHERE c.postId = @postId",
          parameters: [{ name: "@postId", value: postId }],
        })
        .fetchAll();

      let doc = resources[0];

      // if not found, create a new aggregate doc
      if (!doc) {
        doc = { id: postId, postId, count: 0, sum: 0, avg: 0 };
      }

      doc.count = (doc.count || 0) + 1;
      doc.sum = (doc.sum || 0) + rating;
      doc.avg = Number((doc.sum / doc.count).toFixed(2));

      // ✅ IMPORTANT: partition key is /postId so upsert with same postId
      await ratings.items.upsert(doc);

      res.json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit rating", details: err.message });
    }
  });
}

module.exports = { registerRatingRoutes };
