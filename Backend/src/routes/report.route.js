import express from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../middleware/validation.middleware.js";
import {
  reportBug,
  reportCommentById,
  reportRecipeById,
  reportUserById,
  submitFeedback,
  submitGeneralReport,
} from "../controllers/report.controller.js";

const router = express.Router();

// Create a route for reporting a comment by its ID
router.post(
  "/comment/:commentId",
  protectRoute,
  validateObjectId("commentId"),
  reportCommentById,
);

// Create a route for reporting a recipe by its ID
router.post(
  "/recipe/:recipeId",
  protectRoute,
  validateObjectId("recipeId"),
  reportRecipeById,
);

// Create a route for reporting a user by their ID
router.post(
  "/user/:userId",
  protectRoute,
  validateObjectId("userId"),
  reportUserById,
);

// Create a route for reporting a bug with the application
router.post("/bug", protectRoute, reportBug);

// Create a route for submitting general feedback about the application
router.post("/feedback", protectRoute, submitFeedback);

// Create a route for submitting a general report that does not fit into any of the other categories
router.post("/general", protectRoute, submitGeneralReport);

export default router;
