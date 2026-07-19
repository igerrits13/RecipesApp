import express from "express";
import { protectRoute, requireRole } from "../../middleware/auth.middleware.js";
import { validateObjectId } from "../../middleware/validation.middleware.js";

import {
  approveRecipe,
  deleteRecipePermanently,
  getDeletedRecipes,
  getReportedRecipes,
  getUnapprovedRecipes,
} from "../../controllers/admin/admin.recipe.controller.js";

// Create a router using express
const router = express.Router();

// Create a route for getting all soft deleted recipes
router.get(
  "/deleted",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getDeletedRecipes,
);

// Create a route for getting all unapproved recipes
router.get(
  "/unapproved",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getUnapprovedRecipes,
);

// Create a route for approving a recipe by id
router.patch(
  "/:id/approve",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  approveRecipe,
);

// Create a route for getting all reported recipes
router.get(
  "/reported",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getReportedRecipes,
);

// Create a route for deleting a recipe permanently by id
router.delete(
  "/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteRecipePermanently,
);

export default router;
