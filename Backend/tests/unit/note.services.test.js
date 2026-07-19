import mongoose from "mongoose";
import { beforeAll, describe, expect, test } from "@jest/globals";
import Note from "../../src/models/note.model.js";
import User from "../../src/models/user.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Ingredient from "../../src/models/ingredient.model.js";

import {
  createTestUser,
  createSecondaryTestUser,
  customRecipe,
  createTestRecipe,
  createTestIngredient,
  testNoteData,
  customNote,
  createTestNote,
} from "../../src/utils/testFunctions.js";

import {
  getAllUserNotes,
  getSpecificNoteById,
  validateAndAddNote,
  updateSpecificNoteById,
  deleteSpecificNoteById,
} from "../../src/services/note.services.js";

// Base test setup //

let testUser;
let otherUser;
let testRecipe;
let testIngredient;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser = await createTestUser();
  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    displayName: "OtherUser",
    email: `${crypto.randomUUID()}@example.com`,
    password: "Password123",
  });
  testIngredient = await createTestIngredient();
});

// Delete all recipes and notes before each test
beforeEach(async () => {
  await Note.deleteMany({});
  await Recipe.deleteMany({});

  testRecipe = await createTestRecipe(testUser._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
  });
});

// Test cases: getAllUserNotes //
describe("getAllUserNotes", () => {
  test("get user notes when none exist", async () => {
    const result = await getAllUserNotes(testUser._id, 1, 10, 0);

    expect(result.notes).toEqual([]);
    expect(result.currentPage).toBe(1);
    expect(result.totalNotes).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  test("get all user notes when some exist", async () => {
    for (let i = 1; i <= 15; i++) {
      const newRecipe = await createTestRecipe(
        testUser._id,
        customRecipe(i, testIngredient),
      );
      await createTestNote(testUser._id, newRecipe._id, customNote(i));
    }

    const result = await getAllUserNotes(testUser._id, 1, 10, 0);

    expect(result.notes.length).toBe(10);
    expect(result.currentPage).toBe(1);
    expect(result.totalNotes).toBe(15);
    expect(result.totalPages).toBe(2);
    expect(result.notes[0].content).toBe(customNote(15).content);
    expect(result.notes[0].recipeId.title).toBe(
      customRecipe(15, testIngredient).title,
    );
    expect(result.notes[0].recipeId.author.displayName.toString()).toBe(
      testUser.displayName,
    );
    expect(result.notes[0].recipeId.author.profileImage.toString()).toBe(
      testUser.profileImage,
    );
  });

  test("get only the current user's notes when multiple users have notes", async () => {
    await createTestNote(testUser._id, testRecipe._id, customNote(1));

    await createTestNote(otherUser._id, testRecipe._id, customNote(2));

    const result = await getAllUserNotes(testUser._id, 1, 10, 0);

    expect(result.notes.length).toBe(1);
    expect(result.notes[0].content).toBe(customNote(1).content);
  });
});

// Test cases: getSpecificNoteById //
describe("getSpecificNoteById", () => {
  test("get specific note with valid ID", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    const fetchedNote = await getSpecificNoteById(
      createdNote._id,
      testUser._id,
    );

    expect(fetchedNote).toBeDefined();
    expect(fetchedNote._id.toString()).toBe(createdNote._id.toString());
    expect(fetchedNote.authorId.toString()).toBe(testUser._id.toString());
    expect(fetchedNote.recipeId._id.toString()).toBe(testRecipe._id.toString());
    expect(fetchedNote.content).toBe(testNoteData.content);
    expect(fetchedNote.recipeId.title).toBe(testRecipe.title);
    expect(fetchedNote.recipeId.author.displayName.toString()).toBe(
      testUser.displayName.toString(),
    );
    expect(fetchedNote.recipeId.author.profileImage.toString()).toBe(
      testUser.profileImage.toString(),
    );
  });

  test("get specific note that does not exist", async () => {
    const mockNoteId = new mongoose.Types.ObjectId();

    await expect(getSpecificNoteById(mockNoteId, testUser._id)).rejects.toThrow(
      "Note not found",
    );
  });
});

// Test cases: validateAndAddNote //
describe("validateAndAddNote", () => {
  test("validate and add a new note with valid input", async () => {
    const note = await validateAndAddNote({
      userId: testUser._id,
      recipeId: testRecipe._id,
      content: testNoteData.content,
    });

    expect(note).toBeDefined();
    expect(note.authorId.toString()).toBe(testUser._id.toString());
    expect(note.recipeId._id.toString()).toBe(testRecipe._id.toString());
    expect(note.content).toBe(testNoteData.content);
    expect(note.recipeId.title).toBe(testRecipe.title);
    expect(note.recipeId.author.displayName.toString()).toBe(
      testUser.displayName.toString(),
    );
    expect(note.recipeId.author.profileImage.toString()).toBe(
      testUser.profileImage.toString(),
    );
  });

  test("validate and add note with missing content", async () => {
    await expect(
      validateAndAddNote({
        userId: testUser._id,
        recipeId: testRecipe._id,
      }),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });

  test("validate and add note with non-existent recipeId", async () => {
    const nonExistentRecipeId = new mongoose.Types.ObjectId();

    await expect(
      validateAndAddNote({
        userId: testUser._id,
        recipeId: nonExistentRecipeId,
        content: testNoteData.content,
      }),
    ).rejects.toThrow("Recipe not found");
  });

  test("validate and add note with content that is only whitespace", async () => {
    await expect(
      validateAndAddNote({
        userId: testUser._id,
        recipeId: testRecipe._id,
        content: "   ",
      }),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });

  test("validate and add note with content that is too long", async () => {
    const longContent = "a".repeat(501);
    await expect(
      validateAndAddNote({
        userId: testUser._id,
        recipeId: testRecipe._id,
        content: longContent,
      }),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });

  test("validate and add note when user already has a note for the recipe", async () => {
    await validateAndAddNote({
      userId: testUser._id,
      recipeId: testRecipe._id,
      content: testNoteData.content,
    });

    await expect(
      validateAndAddNote({
        userId: testUser._id,
        recipeId: testRecipe._id,
        content: "This is another note.",
      }),
    ).rejects.toThrow("You already have a note for this recipe");
  });
});

// Test cases: updateSpecificNoteById //
describe("updateSpecificNoteById", () => {
  test("update specific note with valid input", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    const updatedNote = await updateSpecificNoteById(
      createdNote._id,
      testUser._id,
      "This is an updated note.",
    );

    expect(updatedNote.content).toBe("This is an updated note.");
    expect(updatedNote._id.toString()).toBe(createdNote._id.toString());
  });

  test("update specific note with additional whitespace in content", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    const updatedNote = await updateSpecificNoteById(
      createdNote._id,
      testUser._id,
      "   This is an updated note with extra whitespace.   ",
    );

    expect(updatedNote.content).toBe(
      "This is an updated note with extra whitespace.",
    );
  });

  test("update specific note that does not exist", async () => {
    const mockNoteId = new mongoose.Types.ObjectId();

    await expect(
      updateSpecificNoteById(mockNoteId, testUser._id, "Updated content"),
    ).rejects.toThrow("Note not found");
  });

  test("update specific note with no content", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    await expect(
      updateSpecificNoteById(createdNote._id, testUser._id),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });

  test("update specific note with content that is only whitespace", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    await expect(
      updateSpecificNoteById(createdNote._id, testUser._id, "   "),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });

  test("update specific note with content that is too long", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    const longContent = "a".repeat(501);

    await expect(
      updateSpecificNoteById(createdNote._id, testUser._id, longContent),
    ).rejects.toThrow("Content must be between 1 and 500 characters");
  });
});

// Test cases: deleteSpecificNoteById //
describe("deleteSpecificNoteById", () => {
  test("delete specific note with valid ID", async () => {
    const createdNote = await createTestNote(testUser._id, testRecipe._id);

    await deleteSpecificNoteById(createdNote._id, testUser._id);

    const deletedNote = await Note.findById(createdNote._id);

    expect(deletedNote).toBeNull();
  });

  test("delete specific note and ensure other notes are unaffected", async () => {
    for (let i = 1; i <= 10; i++) {
      const newRecipe = await createTestRecipe(
        testUser._id,
        customRecipe(i, testIngredient),
      );
      await createTestNote(testUser._id, newRecipe._id, customNote(i));
    }

    const allNotes = await Note.find({ authorId: testUser._id });
    const noteToDelete = allNotes[0];

    await deleteSpecificNoteById(noteToDelete._id, testUser._id);

    const updatedNotes = await Note.find({ authorId: testUser._id });

    expect(updatedNotes.length).toBe(9);
    expect(
      updatedNotes.every(
        (note) => note._id.toString() !== noteToDelete._id.toString(),
      ),
    ).toBe(true);
  });

  test("delete specific note that does not exist", async () => {
    const mockNoteId = new mongoose.Types.ObjectId();

    await expect(
      deleteSpecificNoteById(mockNoteId, testUser._id),
    ).rejects.toThrow("Note not found");
  });

  test("delete specific note that belongs to another user", async () => {
    const createdNote = await createTestNote(otherUser._id, testRecipe._id);

    await expect(
      deleteSpecificNoteById(createdNote._id, testUser._id),
    ).rejects.toThrow("Note not found");
  });
});
