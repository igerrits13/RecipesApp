import {
  getAllUserNotes,
  getSpecificNoteById,
  validateAndAddNote,
  updateSpecificNoteById,
  deleteSpecificNoteById,
} from "../services/note.services.js";
import { getPagination } from "../utils/getPagination.js";

// Create a route for getting all of the current user's notes
export async function getUserNotes(req, res) {
  try {
    const userId = req.user._id;

    // Get query information for notes to send
    const { page, limit, offset } = getPagination(req.query);

    const notes = await getAllUserNotes(userId, page, limit, offset);

    res.status(200).json({
      notes,
      success: true,
      message: "User notes fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Create a route for getting a specific note by its ID
export async function getNoteById(req, res) {
  try {
    const noteId = req.params.noteId;
    const userId = req.user._id;

    const note = await getSpecificNoteById(noteId, userId);

    res
      .status(200)
      .json({ note, success: true, message: "Note fetched successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for creating a new note for a recipe
export async function createNoteByRecipeId(req, res) {
  try {
    const userId = req.user._id;
    const recipeId = req.params.recipeId;
    const { content } = req.body;

    const note = await validateAndAddNote({
      userId,
      recipeId,
      content,
    });

    res
      .status(201)
      .json({ note, success: true, message: "Note created successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating a specific note by its ID
export async function updateNoteById(req, res) {
  try {
    const noteId = req.params.noteId;
    const userId = req.user._id;
    const { content } = req.body;

    const updatedNote = await updateSpecificNoteById(noteId, userId, content);

    res.status(200).json({
      note: updatedNote,
      success: true,
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting a specific note by its ID
export async function deleteNoteById(req, res) {
  try {
    const noteId = req.params.noteId;
    const userId = req.user._id;

    await deleteSpecificNoteById(noteId, userId);

    res
      .status(200)
      .json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
