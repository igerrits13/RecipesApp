import express from "express";

import {
  getUserNotes,
  getNoteById,
  createNoteByRecipeId,
  updateNoteById,
  deleteNoteById,
} from "../controllers/note.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../middleware/validation.middleware.js";

const router = express.Router();

// Create a route for getting all of the current user's notes
router.get("/", protectRoute, getUserNotes);

// Create a route for getting a specific note by its ID
router.get("/:noteId", protectRoute, validateObjectId("noteId"), getNoteById);

// Create a route for creating a new note for a recipe
router.post(
  "/recipe/:recipeId",
  protectRoute,
  validateObjectId("recipeId"),
  createNoteByRecipeId,
);

// Create a route for updating a specific note by its ID
router.put(
  "/:noteId",
  protectRoute,
  validateObjectId("noteId"),
  updateNoteById,
);

// Create a route for deleting a specific note by its ID
router.delete(
  "/:noteId",
  protectRoute,
  validateObjectId("noteId"),
  deleteNoteById,
);

export default router;
