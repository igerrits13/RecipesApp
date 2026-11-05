import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import fs from "fs/promises";

import authRoutes from "./routes/auth.route.js";
import homePageRoutes from "./routes/pages/pages.homePage.route.js";
import metadataRoutes from "./routes/metadata/metadata.searchData.route.js";
import recipeRoutes from "./routes/recipe.route.js";
import userRoutes from "./routes/user.route.js";
import commentRoutes from "./routes/comment.route.js";
import noteRoutes from "./routes/note.route.js";
import reportRoutes from "./routes/report.route.js";
import adminBackfillRoutes from "./routes/admin/admin.backfill.route.js";
import adminCommentRoutes from "./routes/admin/admin.comment.route.js";
import adminMetadataRoutes from "./routes/admin/admin.metadata.route.js";
import adminRecipeRoutes from "./routes/admin/admin.recipe.route.js";
import adminUserRoutes from "./routes/admin/admin.user.route.js";

// Create the app using express and get the port from the .env file
const app = express();

// Trust proxy for rate limiting if behind a proxy
app.set("trust proxy", 1);

// Middleware allowing for parsing of JSON information and use of CORS
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Get the possible routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/homepage", homePageRoutes);
app.use("/api/v1/metadata", metadataRoutes);
app.use("/api/v1/recipes", recipeRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/notes", noteRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/admin/backfill", adminBackfillRoutes);
app.use("/api/v1/admin/comments", adminCommentRoutes);
app.use("/api/v1/admin/metadata", adminMetadataRoutes);
app.use("/api/v1/admin/recipes", adminRecipeRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);

app.use(async (err, req, res, next) => {
  // Delete the temp file if the file exists
  if (req.file?.path) {
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image size cannot exceed 10MB",
      });
    }
  }

  const statusCode = err.statusCode || 500;

  // Only log unexpected server errors
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
