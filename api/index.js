require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { registerPostRoutes } = require("./posts.routes");
const { registerCommentRoutes } = require("./comments.routes");
const { registerRatingRoutes } = require("./rating.routes");
const { registerUploadRoutes } = require("./uploads.routes"); // ✅ NEW

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API is running successfully 🚀" });
});

// ✅ register routes
registerPostRoutes(app);
registerCommentRoutes(app);
registerRatingRoutes(app);
registerUploadRoutes(app); // ✅ NEW

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
