import express from "express";
import { protectRoute, requireRole } from "../../middleware/auth.middleware.js";
import { validateObjectId } from "../../middleware/validation.middleware.js";
import {
  deleteCommentPermanently,
  getReportedComments,
  getDeletedComments,
} from "../../controllers/admin/admin.comment.controller.js";

// Create a router using express
const router = express.Router();

// Create a route for getting all soft deleted comments
router.get(
  "/deleted",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getDeletedComments,
);

// Create a route for getting all reported comments
router.get(
  "/reported",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getReportedComments,
);

// Create a route for deleting a comment permanently by ID
router.delete(
  "/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteCommentPermanently,
);

export default router;
