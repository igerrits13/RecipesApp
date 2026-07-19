import { describe, expect, test } from "@jest/globals";

import {
  createTestUser,
  createTestIngredient,
  createTestRecipe,
} from "../../../src/utils/testFunctions.js";
import { backfillCollectionData } from "../../../src/services/admin/admin.backfill.services.js";

import Recipe from "../../../src/models/recipe.model.js";
import User from "../../../src/models/user.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";

// Base test setup //

let testUser;
let testIngredient;
let testRecipe;

// Create a test user and ingredient to be used in the tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser = await createTestUser();
  testIngredient = await createTestIngredient();
});

// Create a fresh test recipe before each test
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

// Test cases: backfillCollectionData //
describe("backfillCollectionData", () => {
  test("should populate the new field with the default value for all documents in the collection", async () => {
    await Recipe.updateOne(
      { _id: testRecipe._id },
      { $unset: { description: "" } },
    );

    const recipeBefore = await Recipe.findById(testRecipe._id);
    expect(recipeBefore.description).toBeUndefined();

    await backfillCollectionData({
      collectionModel: Recipe,
      newFieldName: "description",
      defaultValue: "This is a backfilled test recipe.",
    });

    const recipeAfter = await Recipe.findById(testRecipe._id);
    expect(recipeAfter.description).toEqual(
      "This is a backfilled test recipe.",
    );
  });

  test("should not overwrite existing values in the new field", async () => {
    expect(testRecipe.description).toEqual("This is a test recipe.");

    await backfillCollectionData({
      collectionModel: Recipe,
      newFieldName: "description",
      defaultValue: "This is a backfilled test recipe.",
    });

    const recipeAfter = await Recipe.findById(testRecipe._id);
    expect(recipeAfter.description).toEqual("This is a test recipe.");
  });

  test("should throw an error if the collection model is invalid", async () => {
    await expect(
      backfillCollectionData({
        collectionModel: null,
        newFieldName: "description",
        defaultValue: "This is a backfilled test recipe.",
      }),
    ).rejects.toThrow("Invalid collection name");
  });

  test("should throw an error if the field name has spaces", async () => {
    await expect(
      backfillCollectionData({
        collectionModel: Recipe,
        newFieldName: "invalid field name",
        defaultValue: "This is a backfilled test recipe.",
      }),
    ).rejects.toThrow("Invalid field name");
  });

  test("should throw an error if the field name has '$' in it", async () => {
    await expect(
      backfillCollectionData({
        collectionModel: Recipe,
        newFieldName: "invalid$field$name",
        defaultValue: "This is a backfilled test recipe.",
      }),
    ).rejects.toThrow("Invalid field name");
  });

  test("should throw an error if the field name has '.' in it", async () => {
    await expect(
      backfillCollectionData({
        collectionModel: Recipe,
        newFieldName: "invalid.field.name",
        defaultValue: "This is a backfilled test recipe.",
      }),
    ).rejects.toThrow("Invalid field name");
  });
});
