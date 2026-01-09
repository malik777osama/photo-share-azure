const multer = require("multer");
const { randomUUID } = require("crypto");
const { uploadImage } = require("./blob");

const upload = multer(); // memory storage

function registerUploadRoutes(app) {
  // Creator-only upload: returns { url }
  app.post("/api/uploads", upload.single("file"), async (req, res) => {
    try {
      const creatorKey = req.headers["x-creator-key"];
      if (creatorKey !== process.env.CREATOR_KEY) {
        return res.status(401).json({ error: "Creator only" });
      }

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
      const filename = `${randomUUID()}.${ext}`;

      const url = await uploadImage(req.file.buffer, filename, req.file.mimetype);
      res.status(201).json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}

module.exports = { registerUploadRoutes };
