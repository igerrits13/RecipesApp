import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model";
import Note from "../../src/models/note.model";
import Recipe from "../../src/models/recipe.model";
import Ingredient from "../../src/models/ingredient.model";

import {
  testUserData,
  createTestUser,
  getAuthenticatedAgent,
  createTestRecipe,
  createTestIngredient,
  createTestNote,
} from "../../src/utils/testFunctions.js";

// Base test setup //

let testUser1;
let loginAgent1;
let testRecipe;
let testIngredient;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser1 = await createTestUser(testUserData);

  loginAgent1 = await getAuthenticatedAgent(testUser1);
  testIngredient = await createTestIngredient();
});

// Delete all recipes and notes before each test
beforeEach(async () => {
  await Note.deleteMany({});
  await Recipe.deleteMany({});

  testRecipe = await createTestRecipe(testUser1._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
  });
});

// Test cases: getNoteById //
describe("GET /api/notes/:noteId", () => {
  it("should fetch a specific note by its ID for the authenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await loginAgent1.get(`/api/v1/notes/${note._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.note).toBeDefined();
    expect(res.body.note._id).toBe(note._id.toString());
  });

  it("should not fetch a note for an unauthenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await request(app).get(`/api/v1/notes/${note._id}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return 400 error for an invalid note ID", async () => {
    const res = await loginAgent1.get("/api/v1/notes/invalidNoteId");

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid noteId");
  });

  it("should return 404 error for a non-existent note ID", async () => {
    const nonExistentNoteId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.get(`/api/v1/notes/${nonExistentNoteId}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Note not found");
  });
});

// Test cases: createNoteByRecipeId //
describe("POST /api/notes/recipe/:recipeId", () => {
  it("should create a new note for a recipe", async () => {
    const res = await loginAgent1
      .post("/api/v1/notes/recipe/" + testRecipe._id)
      .send({
        content: "This is a test note.",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.note.content).toBe("This is a test note.");
  });

  it("should not create a note for an unauthenticated user", async () => {
    const res = await request(app)
      .post("/api/v1/notes/recipe/" + testRecipe._id)
      .send({
        content: "This is a test note.",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 error for an invalid recipe ID", async () => {
    const res = await loginAgent1
      .post("/api/v1/notes/recipe/invalidRecipeId")
      .send({
        content: "This is a test note.",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid recipeId");
  });

  it("should return 404 error for a non-existent recipe ID", async () => {
    const nonExistentRecipeId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .post("/api/v1/notes/recipe/" + nonExistentRecipeId)
      .send({
        content: "This is a test note.",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Recipe not found");
  });
});

// Test cases: updateNoteById //
describe("PUT /api/notes/:noteId", () => {
  it("should update a specific note by its ID for the authenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await loginAgent1.put(`/api/v1/notes/${note._id}`).send({
      content: "Updated note content.",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.note.content).toBe("Updated note content.");
  });

  it("should not update a note for an unauthenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await request(app).put(`/api/v1/notes/${note._id}`).send({
      content: "Updated note content.",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 error for an invalid note ID", async () => {
    const res = await loginAgent1.put("/api/v1/notes/invalidNoteId").send({
      content: "Updated note content.",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid noteId");
  });

  it("should return 404 error for a non-existent note ID", async () => {
    const nonExistentNoteId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .put(`/api/v1/notes/${nonExistentNoteId}`)
      .send({
        content: "Updated note content.",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Note not found");
  });
});

// Test cases: deleteNoteById //
describe("DELETE /api/notes/:noteId", () => {
  it("should delete a specific note by its ID for the authenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await loginAgent1.delete(`/api/v1/notes/${note._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Note deleted successfully");

    // Verify the note is actually deleted
    const deletedNote = await Note.findById(note._id);
    expect(deletedNote).toBeNull();
  });

  it("should not delete a note for an unauthenticated user", async () => {
    const note = await createTestNote(testUser1._id, testRecipe._id);

    const res = await request(app).delete(`/api/v1/notes/${note._id}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 error for an invalid note ID", async () => {
    const res = await loginAgent1.delete("/api/v1/notes/invalidNoteId");
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid noteId");
  });

  it("should return 404 error for a non-existent note ID", async () => {
    const nonExistentNoteId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.delete(`/api/v1/notes/${nonExistentNoteId}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Note not found");
  });
});
