import mongoose from "mongoose";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "@jest/globals";
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
  createTestComment,
} from "../../../src/utils/testFunctions.js";

import User from "../../../src/models/user.model.js";
import Recipe from "../../../src/models/recipe.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";
import Comment from "../../../src/models/comment.model.js";

// Base test setup //

let testUser;
let loginAgent;
let moderatorUser;
let moderatorAgent;
let adminUser;
let adminAgent;

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
});

// Test cases: getDeletedRecipes //
describe("GET /api/v1/admin/recipes/deleted", () => {
  it("should return an array of deleted recipes with pagination info with oldest deleted recipes first", async () => {
    // Create 15 deleted recipes
    const deletedRecipes = [];
    for (let i = 0; i < 15; i++) {
      const recipe = await createTestRecipe(testUser._id, {
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
      deletedRecipes.push(recipe);
    }

    const res = await adminAgent.get("/api/v1/admin/recipes/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recipes.deletedRecipes.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(res.body.recipes.deletedRecipes[i]._id).toBe(
        deletedRecipes[i]._id.toString(),
      );
    }
    expect(res.body.recipes.currentPage).toBe(1);
    expect(res.body.recipes.totalRecipes).toBe(15);
    expect(res.body.recipes.totalPages).toBe(2);
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/recipes/deleted");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/recipes/deleted");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/recipes/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/recipes/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: getUnapprovedRecipes //
describe("GET /api/v1/admin/recipes/unapproved", () => {
  it("should return an array of unapproved recipes with pagination info with oldest unapproved recipes first", async () => {
    // Create 15 unapproved recipes
    const unapprovedRecipes = [];
    for (let i = 0; i < 15; i++) {
      const recipe = await createTestRecipe(testUser._id, {
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
      unapprovedRecipes.push(recipe);
    }

    const res = await adminAgent.get("/api/v1/admin/recipes/unapproved");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recipes.unapprovedRecipes.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(res.body.recipes.unapprovedRecipes[i]._id).toBe(
        unapprovedRecipes[i]._id.toString(),
      );
    }
    expect(res.body.recipes.currentPage).toBe(1);
    expect(res.body.recipes.totalRecipes).toBe(15);
    expect(res.body.recipes.totalPages).toBe(2);
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/recipes/unapproved");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/recipes/unapproved");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/recipes/unapproved");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/recipes/unapproved");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: approveRecipe //
describe("PATCH /api/v1/admin/recipes/:id/approve", () => {
  it("should approve the recipe and return a success message", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: false,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Recipe approved successfully");

    const updatedRecipe = await Recipe.findById(recipe._id);
    expect(updatedRecipe.isApproved).toBe(true);
  });

  it("should return an error if the recipe does not exist", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${new mongoose.Types.ObjectId()}/approve`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Recipe not found");
  });

  it("should return an error if the user is not authenticated", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: false,
    });

    const res = await request(app).patch(
      `/api/v1/admin/recipes/${recipe._id}/approve`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: false,
    });

    const res = await loginAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: false,
    });

    const res = await moderatorAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isApproved: false,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should throw an error if the id is invalid", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/invalidid/approve`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: getAllUnapprovedRecipeImages //
describe("GET /api/v1/admin/recipes/unapproved-images", () => {
  it("should return an array of recipes with unapproved images with pagination info with oldest first", async () => {
    // Create 15 unapproved recipes
    const unapprovedRecipes = [];
    for (let i = 0; i < 15; i++) {
      const recipe = await createTestRecipe(testUser._id, {
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
      unapprovedRecipes.push(recipe);
    }

    const res = await adminAgent.get("/api/v1/admin/recipes/unapproved-images");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recipes.unapprovedRecipeImages.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(res.body.recipes.unapprovedRecipeImages[i]._id).toBe(
        unapprovedRecipes[i]._id.toString(),
      );
    }
    expect(res.body.recipes.currentPage).toBe(1);
    expect(res.body.recipes.totalRecipes).toBe(15);
    expect(res.body.recipes.totalPages).toBe(2);
  });

  it("should return an error if the user is not authenticated for unnapproved image", async () => {
    const res = await request(app).get(
      "/api/v1/admin/recipes/unapproved-images",
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user for unnapproved image", async () => {
    const res = await loginAgent.get("/api/v1/admin/recipes/unapproved-images");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator for unnapproved image", async () => {
    const res = await moderatorAgent.get(
      "/api/v1/admin/recipes/unapproved-images",
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin for unnapproved image", async () => {
    const res = await adminAgent.get("/api/v1/admin/recipes/unapproved-images");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: approveRecipeImageById //
describe("PATCH /api/v1/admin/recipes/:id/approve-image", () => {
  it("should approve the recipe image and return a success message", async () => {
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
        isApproved: false,
      },
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve-image`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Recipe image approved successfully");

    const updatedRecipe = await Recipe.findById(recipe._id);
    expect(updatedRecipe.image.isApproved).toBe(true);
    expect(updatedRecipe.image.imageURL).toBe(
      "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
    );
    expect(updatedRecipe.image.publicId).toBe("test-image");
  });

  it("should return an error if the recipe does not exist for unnapproved image", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${new mongoose.Types.ObjectId()}/approve-image`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Recipe not found");
  });

  it("should return an error if the user is not authenticated for unnapproved image", async () => {
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
        isApproved: false,
      },
    });

    const res = await request(app).patch(
      `/api/v1/admin/recipes/${recipe._id}/approve-image`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user for unnapproved image", async () => {
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
        isApproved: false,
      },
    });

    const res = await loginAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve-image`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
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
        isApproved: false,
      },
    });

    const res = await moderatorAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve-image`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
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
        isApproved: false,
      },
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/${recipe._id}/approve-image`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should throw an error if the id is invalid", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/recipes/invalidid/approve-image`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: getReportedRecipes //
describe("GET /api/v1/admin/recipes/reported", () => {
  it("should return an array of reported recipes with pagination info with oldest reported recipes first", async () => {
    const reportedRecipes = [];
    for (let i = 0; i < 15; i++) {
      const recipe = await createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        isApproved: false,
        reportCount: i % 5 === 0 ? 5 : i % 5, // Report every 5th recipe with 5 reports and the rest with varying reports from 0 to 4
      });
      reportedRecipes.push(recipe);
    }

    const res = await adminAgent.get("/api/v1/admin/recipes/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recipes.reportedRecipes.length).toBe(10);
    expect(res.body.recipes.currentPage).toBe(1);
    expect(res.body.recipes.totalRecipes).toBe(15);
    expect(res.body.recipes.totalPages).toBe(2);
    // Check that the reported recipes are returned in the correct order (most reported first, then oldest first)
    for (let i = 0; i < 10; i++) {
      const currentRecipe = res.body.recipes.reportedRecipes[i];
      const nextRecipe = res.body.recipes.reportedRecipes[i + 1];

      if (nextRecipe) {
        expect(currentRecipe.reportCount).toBeGreaterThanOrEqual(
          nextRecipe.reportCount,
        );
        if (currentRecipe.reportCount === nextRecipe.reportCount) {
          expect(
            new Date(currentRecipe.createdAt) <= new Date(nextRecipe.createdAt),
          ).toBe(true);
        }
      }
    }
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/recipes/reported");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/recipes/reported");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/recipes/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/recipes/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: deleteRecipePermanently //
describe("DELETE /api/v1/admin/recipes/:id", () => {
  it("should delete the recipe permanently and return a success message", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      isDeleted: true,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const res = await adminAgent.delete(`/api/v1/admin/recipes/${recipe._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Recipe deleted successfully");

    const deletedRecipe = await Recipe.findById(recipe._id);
    expect(deletedRecipe).toBeNull();
  });

  it("should throw an error if the user is not authenticated", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const res = await request(app).delete(
      `/api/v1/admin/recipes/${recipe._id}`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user is a general user", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const res = await loginAgent.delete(`/api/v1/admin/recipes/${recipe._id}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if the user is a moderator", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const res = await moderatorAgent.delete(
      `/api/v1/admin/recipes/${recipe._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is an admin", async () => {
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const res = await adminAgent.delete(`/api/v1/admin/recipes/${recipe._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Recipe deleted successfully");

    const deletedRecipe = await Recipe.findById(recipe._id);
    expect(deletedRecipe).toBeNull();
  });

  it("should throw an error if the id is invalid", async () => {
    const res = await adminAgent.delete(`/api/v1/admin/recipes/invalidid`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});
