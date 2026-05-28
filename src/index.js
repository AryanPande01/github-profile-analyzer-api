require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { testConnection } = require("./config/db");
const { createTable } = require("./models/profile.model");
const profileRoutes = require("./routes/profile.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Global rate limiter (100 requests per 15 minutes per IP)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "GitHub Profile Analyzer API",
    version: "1.0.0",
    endpoints: {
      analyze:  "POST   /api/profiles/analyze/:username",
      list:     "GET    /api/profiles?page=1&limit=20&sortBy=total_stars&order=DESC",
      getOne:   "GET    /api/profiles/:username",
      delete:   "DELETE /api/profiles/:username",
    },
  });
});

app.use("/api/profiles", profileRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Something went wrong.", error: err.message });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  await testConnection();
  await createTable();

  app.listen(PORT, () => {
    console.log(`🚀 GitHub Profile Analyzer running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  });
}

bootstrap();
