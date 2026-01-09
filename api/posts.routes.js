const { getContainer } = require("./cosmos");
const { randomUUID } = require("crypto");

function registerPostRoutes(app) {
  const posts = getContainer("posts");
  const comments = getContainer("comments");

  // ✅ GET /api/posts  (list)
  app.get("/api/posts", async (req, res) => {
    try {
      const { resources } = await posts.items
        .query("SELECT * FROM c ORDER BY c.createdAt DESC")
        .fetchAll();
      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // ✅ GET /api/posts/:id  (single post)
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { resources } = await posts.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: id }],
        })
        .fetchAll();

      if (!resources.length) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(resources[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // ✅ POST /api/posts (create) - creator only
  app.post("/api/posts", async (req, res) => {
    try {
      const creatorKey = req.headers["x-creator-key"];
      if (creatorKey !== process.env.CREATOR_KEY) {
        return res.status(401).json({ error: "Creator only" });
      }

      const { title, caption, location, people, imageUrl } = req.body || {};
      if (!title || !imageUrl) {
        return res.status(400).json({ error: "title and imageUrl are required" });
      }

      const doc = {
        id: randomUUID(),
        title,
        caption: caption || "",
        location: location || "",
        people: people || "",
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      await posts.items.create(doc);
      res.status(201).json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // ✅ GET /api/posts/:id/comments  (list comments for a post)
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;

      const { resources } = await comments.items
        .query({
          query: "SELECT * FROM c WHERE c.postId = @postId ORDER BY c.createdAt DESC",
          parameters: [{ name: "@postId", value: id }],
        })
        .fetchAll();

      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // ✅ POST /api/posts/:id/comments  (create comment)
  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const { author, text } = req.body || {};

      if (!text) return res.status(400).json({ error: "text is required" });

      const doc = {
        id: randomUUID(),
        postId: id,
        author: author || "Anonymous",
        text,
        createdAt: new Date().toISOString(),
      };

      await comments.items.create(doc);
      res.status(201).json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
}

module.exports = { registerPostRoutes };
