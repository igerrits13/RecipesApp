import express from "express";
import { protectRoute, requireRole } from "../../middleware/auth.middleware.js";
import { backfillCollection } from "../../controllers/admin/admin.backfill.controller.js";

// Create a router using express
const router = express.Router();

// Create a route for backfilling new data to a specified collection
router.put(
  "/:collection",
  protectRoute,
  requireRole(["admin"]),
  backfillCollection,
);

export default router;
