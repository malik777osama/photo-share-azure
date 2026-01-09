const { getContainer } = require("./cosmos");
const { randomUUID } = require("crypto");

function registerCommentRoutes(app) {
  const comments = getContainer("comments");

  // GET /api/posts/:postId/comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;

      const querySpec = {
        query: "SELECT * FROM c WHERE c.postId = @pid ORDER BY c.createdAt DESC",
        parameters: [{ name: "@pid", value: postId }]
      };

      const { resources } = await comments.items.query(querySpec).fetchAll();
      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // POST /api/posts/:postId/comments
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;
      const { name, text } = req.body || {};

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "text is required" });
      }

      const doc = {
        id: randomUUID(),
        postId,
        name: (name || "Anonymous").trim(),
        text: text.trim(),
        createdAt: new Date().toISOString()
      };

      await comments.items.create(doc);
      res.status(201).json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
}

module.exports = { registerCommentRoutes };
