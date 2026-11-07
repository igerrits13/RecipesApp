import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";

import {
  createTestUser,
  createTestIngredient,
  createTestRecipe,
  createTestComment,
} from "../../../src/utils/testFunctions.js";

import Recipe from "../../../src/models/recipe.model.js";
import User from "../../../src/models/user.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";

import {
  getAllDeletedRecipes,
  getAllUnapprovedRecipes,
  approveRecipeById,
  getAllReportedRecipes,
  getAllUnapprovedRecipeImages,
  approveRecipeImageById,
} from "../../../src/services/admin/admin.recipe.services.js";

// Base test setup //

let testUser;
let testIngredient;

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
});

// Test cases: getAllDeletedRecipes //
describe("getAllDeletedRecipes", () => {
  test("should return an empty array if there are no soft deleted recipes", async () => {
    const deletedRecipes = await getAllDeletedRecipes(1, 10, 0);

    expect(deletedRecipes.deletedRecipes.length).toBe(0);
    expect(deletedRecipes.totalRecipes).toBe(0);
    expect(deletedRecipes.totalPages).toBe(0);
    expect(deletedRecipes.currentPage).toBe(1);
  });

  test("should return an array of soft deleted recipes with pagination", async () => {
    // Create 15 soft deleted recipes
    for (let i = 0; i < 15; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        isDeleted: true,
      });
    }

    const deletedRecipes = await getAllDeletedRecipes(1, 10, 0);

    expect(deletedRecipes.deletedRecipes.length).toBe(10);
    expect(deletedRecipes.totalRecipes).toBe(15);
    expect(deletedRecipes.totalPages).toBe(2);
    expect(deletedRecipes.currentPage).toBe(1);
  });

  test("should return only soft deleted recipes and not include non-deleted recipes", async () => {
    // Create 5 soft deleted recipes and 5 non-deleted recipes
    for (let i = 0; i < 10; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        isDeleted: i % 2 === 0, // Soft delete every other recipe
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
      });
    }

    const deletedRecipes = await getAllDeletedRecipes(1, 10, 0);

    expect(deletedRecipes.deletedRecipes.length).toBe(5);
    expect(deletedRecipes.totalRecipes).toBe(5);
    expect(deletedRecipes.totalPages).toBe(1);
    expect(deletedRecipes.currentPage).toBe(1);
  });
});

// Test cases: getAllUnapprovedRecipes //
describe("getAllUnapprovedRecipes", () => {
  test("should return an empty array if there are no unapproved recipes", async () => {
    const unapprovedRecipes = await getAllUnapprovedRecipes(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipes.length).toBe(0);
    expect(unapprovedRecipes.totalRecipes).toBe(0);
    expect(unapprovedRecipes.totalPages).toBe(0);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });

  test("should return an array of unapproved recipes with pagination", async () => {
    // Create 15 unapproved recipes
    for (let i = 0; i < 15; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        isApproved: false,
      });
    }

    const unapprovedRecipes = await getAllUnapprovedRecipes(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipes.length).toBe(10);
    expect(unapprovedRecipes.totalRecipes).toBe(15);
    expect(unapprovedRecipes.totalPages).toBe(2);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });

  test("should return only unapproved recipes and not include approved recipes", async () => {
    // Create 5 unapproved recipes and 5 approved recipes
    for (let i = 0; i < 10; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        isApproved: i % 2 === 0, // Unapprove every other recipe
      });
    }

    const unapprovedRecipes = await getAllUnapprovedRecipes(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipes.length).toBe(5);
    expect(unapprovedRecipes.totalRecipes).toBe(5);
    expect(unapprovedRecipes.totalPages).toBe(1);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });
});

// Test cases: approveRecipeById //
describe("approveRecipeById", () => {
  test("should approve the recipe by setting isApproved to true", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      isApproved: false,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await approveRecipeById(recipe._id);

    const updatedRecipe = await Recipe.findById(recipe._id).lean();
    expect(updatedRecipe.isApproved).toBe(true);
  });

  test("should throw an error if the recipe does not exist", async () => {
    await expect(
      approveRecipeById(new mongoose.Types.ObjectId()),
    ).rejects.toThrow("Recipe not found");
  });

  test("should throw an error if the recipe is soft deleted", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await expect(async () => {
      await approveRecipeById(recipe._id);
    }).rejects.toThrow("Recipe not found");
  });

  test("should not change approval status if the recipe is already approved", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: true,
    });

    await approveRecipeById(recipe._id);

    const updatedRecipe = await Recipe.findById(recipe._id).lean();
    expect(updatedRecipe.isApproved).toBe(true);
  });
});

// Test cases: getAllUnapprovedRecipeImages //
describe("getAllUnapprovedRecipeImages", () => {
  test("should return an empty array if there are no unapproved recipe images", async () => {
    const unapprovedRecipes = await getAllUnapprovedRecipeImages(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipeImages.length).toBe(0);
    expect(unapprovedRecipes.totalRecipes).toBe(0);
    expect(unapprovedRecipes.totalPages).toBe(0);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });

  test("should return an array of unapproved recipe images with pagination", async () => {
    // Create 15 unapproved recipes
    for (let i = 0; i < 15; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        image: {
          imageURL:
            "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
          publicId: "test-image",
          isApproved: false,
        },
      });
    }

    const unapprovedRecipes = await getAllUnapprovedRecipeImages(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipeImages.length).toBe(10);
    expect(unapprovedRecipes.totalRecipes).toBe(15);
    expect(unapprovedRecipes.totalPages).toBe(2);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });

  test("should return only unapproved recipe images and not include approved recipes", async () => {
    // Create 5 unapproved recipes and 5 approved recipes
    for (let i = 0; i < 10; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        image: {
          imageURL:
            "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
          publicId: "test-image",
          isApproved: i % 2 === 0, // Unapprove every other recipe image
        },
      });
    }

    const unapprovedRecipes = await getAllUnapprovedRecipeImages(1, 10, 0);

    expect(unapprovedRecipes.unapprovedRecipeImages.length).toBe(5);
    expect(unapprovedRecipes.totalRecipes).toBe(5);
    expect(unapprovedRecipes.totalPages).toBe(1);
    expect(unapprovedRecipes.currentPage).toBe(1);
  });
});

// Test cases: approveRecipeImageById //
describe("approveRecipeImageById", () => {
  test("should approve the recipe image by setting isApproved to true", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      isApproved: false,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
        isApproved: false,
      },
    });

    await approveRecipeImageById(recipe._id);

    const updatedRecipe = await Recipe.findById(recipe._id).lean();
    expect(updatedRecipe.image.isApproved).toBe(true);
  });

  test("should throw an error if the recipe with the image does not exist", async () => {
    await expect(
      approveRecipeImageById(new mongoose.Types.ObjectId()),
    ).rejects.toThrow("Recipe not found");
  });

  test("should throw an error if the recipe with the image is soft deleted", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await expect(async () => {
      await approveRecipeImageById(recipe._id);
    }).rejects.toThrow("Recipe not found");
  });

  test("should not change approval status if the recipe with the image is already approved", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
        isApproved: true,
      },
    });

    await approveRecipeImageById(recipe._id);

    const updatedRecipe = await Recipe.findById(recipe._id).lean();
    expect(updatedRecipe.isApproved).toBe(true);
  });
});

// Test cases: getAllReportedRecipes //
describe("getAllReportedRecipes", () => {
  test("should return an empty array if there are no reported recipes", async () => {
    const reportedRecipes = await getAllReportedRecipes(1, 10, 0);

    expect(reportedRecipes.reportedRecipes.length).toBe(0);
    expect(reportedRecipes.totalRecipes).toBe(0);
    expect(reportedRecipes.totalPages).toBe(0);
    expect(reportedRecipes.currentPage).toBe(1);
  });

  test("should return an array of reported recipes with pagination", async () => {
    // Create 15 reported recipes
    for (let i = 0; i < 15; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        reportCount: i + 1,
      });
    }

    const reportedRecipes = await getAllReportedRecipes(1, 10, 0);

    expect(reportedRecipes.reportedRecipes.length).toBe(10);
    expect(reportedRecipes.totalRecipes).toBe(15);
    expect(reportedRecipes.totalPages).toBe(2);
    expect(reportedRecipes.currentPage).toBe(1);
  });

  test("should return only reported recipes and not include non-reported recipes", async () => {
    // Create 5 reported recipes and 5 non-reported recipes
    for (let i = 0; i < 10; i++) {
      await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        reportCount: i % 2 === 0, // Report every other recipe
      });
    }

    const reportedRecipes = await getAllReportedRecipes(1, 10, 0);

    expect(reportedRecipes.reportedRecipes.length).toBe(5);
    expect(reportedRecipes.totalRecipes).toBe(5);
    expect(reportedRecipes.totalPages).toBe(1);
    expect(reportedRecipes.currentPage).toBe(1);
  });
});
