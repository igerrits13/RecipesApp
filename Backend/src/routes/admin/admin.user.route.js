import express from "express";
import { protectRoute, requireRole } from "../../middleware/auth.middleware.js";
import { validateObjectId } from "../../middleware/validation.middleware.js";
import {
  banUser,
  changeUserRole,
  deleteUserPermanently,
  getAllUsersWithRoles,
  getDeletedUsers,
  getUserDetails,
  unbanUser,
} from "../../controllers/admin/admin.user.controller.js";

// Create a router using express
const router = express.Router();

// Create a route for getting all users and their roles and ban/deletion status
router.get(
  "/",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getAllUsersWithRoles,
);

// Create a route for getting all soft deleted users
router.get(
  "/deleted",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getDeletedUsers,
);

// Create a route for getting a specific user by id and their details
router.get(
  "/:id",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  getUserDetails,
);

// Create a route for changing a user's role
router.patch(
  "/:id/role",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  changeUserRole,
);

// Create a route for banning a user
router.patch(
  "/:id/ban",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  banUser,
);

// Create a route for unbanning a user
router.patch(
  "/:id/unban",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  unbanUser,
);

// Create a route for deleting a user permanently by id
router.delete(
  "/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteUserPermanently,
);

export default router;
