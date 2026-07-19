import Note from "../models/note.model.js";
import Recipe from "../models/recipe.model.js";
import Tag from "../models/tag.model.js";
import Holiday from "../models/holiday.model.js";
import Season from "../models/season.model.js";
import Ingredient from "../models/ingredient.model.js";
import Measurement from "../models/measurement.model.js";

// Get all notes for a user with pagination
export async function getAllUserNotes(userId, page, limit, offset) {
  // Get the total number of notes for the user
  const totalNotes = await Note.countDocuments({ authorId: userId });

  // Create the array of notes with the given query guidelines, most recent first
  const notes = await Note.find({ authorId: userId })
    .populate({
      path: "recipeId",
      select: "title author",
      populate: { path: "author", select: "displayName profileImage" },
    })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    notes,
    currentPage: page,
    totalNotes,
    totalPages: Math.ceil(totalNotes / limit),
  };
}

// Get a specific note by its ID, ensuring it belongs to the current user
export async function getSpecificNoteById(noteId, userId) {
  const note = await Note.findOne({
    _id: noteId,
    authorId: userId,
  })
    .populate({
      path: "recipeId",
      select: "title author",
      populate: { path: "author", select: "displayName profileImage" },
    })
    .lean();

  if (!note) {
    const err = new Error("Note not found");
    err.statusCode = 404;
    throw err;
  }

  return note;
}

// Validate note content and ensure a user can only have one note per recipe, then create the note
export async function validateAndAddNote({ userId, recipeId, content }) {
  // Ensure all required fields are provided
  if (
    typeof content !== "string" ||
    content.trim().length < 1 ||
    content.trim().length > 500
  ) {
    const err = new Error("Content must be between 1 and 500 characters");
    err.statusCode = 400;
    throw err;
  }

  // Ensure the recipe exists, if it doesn't, throw an error
  const exists = await Recipe.exists({ _id: recipeId });

  if (!exists) {
    const err = new Error("Recipe not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure the user doesn't already have a note for this recipe
  const existingNote = await Note.findOne({
    authorId: userId,
    recipeId,
  });

  if (existingNote) {
    const err = new Error("You already have a note for this recipe");
    err.statusCode = 400;
    throw err;
  }

  // Create and save the new note to the database
  let newNote = await Note.create({
    authorId: userId,
    recipeId,
    content,
  });

  // Get the newly created note with populated recipe and author fields
  newNote = await Note.findById(newNote._id).populate({
    path: "recipeId",
    select: "title author",
    populate: { path: "author", select: "displayName profileImage" },
  });

  return newNote;
}

// Update a specific note by its ID, ensuring it belongs to the current user
export async function updateSpecificNoteById(noteId, userId, content) {
  // Ensure user is the author of the note
  const note = await Note.findOne({ _id: noteId, authorId: userId }).populate({
    path: "recipeId",
    select: "title author",
    populate: { path: "author", select: "displayName profileImage" },
  });

  if (!note) {
    const err = new Error("Note not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure the new content is valid
  if (
    typeof content !== "string" ||
    content.trim().length < 1 ||
    content.trim().length > 500
  ) {
    const err = new Error("Content must be between 1 and 500 characters");
    err.statusCode = 400;
    throw err;
  }

  // Update the note's content and save
  note.content = content.trim();
  await note.save();

  return note;
}

// Delete a specific note by its ID, ensuring it belongs to the current user
export async function deleteSpecificNoteById(noteId, userId) {
  // Ensure user is the author of the note
  const note = await Note.findOne({ _id: noteId, authorId: userId });

  if (!note) {
    const err = new Error("Note not found");
    err.statusCode = 404;
    throw err;
  }

  await note.deleteOne();
}
