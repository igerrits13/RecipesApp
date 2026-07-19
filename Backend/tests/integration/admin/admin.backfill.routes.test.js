import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../../src/app.js";

import {
  createTestRecipe,
  getAuthenticatedAgent,
  createTestUser,
  createTestIngredient,
  testUserData,
  createTestModeratorUser,
  createTestAdminUser,
} from "../../../src/utils/testFunctions.js";

import User from "../../../src/models/user.model.js";
import Recipe from "../../../src/models/recipe.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";

// Base test setup //

let testUser;
let loginAgent;
let moderatorUser;
let moderatorAgent;
let adminUser;
let adminAgent;
let testRecipe;
let testIngredient;

// Delete all users and create a new authenticated agent before running the tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser = await createTestUser(testUserData);
  loginAgent = await getAuthenticatedAgent(testUser);
  moderatorUser = await createTestModeratorUser();
  moderatorAgent = await getAuthenticatedAgent(moderatorUser);
  adminUser = await createTestAdminUser();
  adminAgent = await getAuthenticatedAgent(adminUser);
  testIngredient = await createTestIngredient();
});

beforeEach(async () => {
  await Recipe.deleteMany({});

  testRecipe = await createTestRecipe(testUser._id, {
    title: `Test Recipe`,
    slug: `test-recipe`,
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
    description: "This is a test recipe.",
  });
});

// Test cases: backfillCollection //
describe("POST /api/v1/admin/backfill:collection", () => {
  it("should backfill a new field to the specified collection", async () => {
    await Recipe.updateOne(
      { _id: testRecipe._id },
      { $unset: { description: "" } },
    );

    const originalRecipe = await Recipe.findById(testRecipe._id);
    expect(originalRecipe.description).toBeUndefined();

    const res = await adminAgent
      .put("/api/v1/admin/backfill/recipes")
      .send({ newFieldName: "description", defaultValue: "New description" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Backfill completed successfully");

    const updatedRecipe = await Recipe.findById(testRecipe._id);
    expect(updatedRecipe.description).toBe("New description");
  });

  it("should return an error if the collection is invalid", async () => {
    const res = await adminAgent
      .put("/api/v1/admin/backfill/invalidCollection")
      .send({ newFieldName: "testField", defaultValue: "Test value" });
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid collection name");
  });

  it("should return an error if the user is unauthenticated", async () => {
    const res = await request(app).put("/api/v1/admin/backfill/recipes");
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.put("/api/v1/admin/backfill/recipes");
    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should return an error if the user is a moderator", async () => {
    const res = await moderatorAgent.put("/api/v1/admin/backfill/recipes");
    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });
});
