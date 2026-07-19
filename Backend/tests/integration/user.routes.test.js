import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Ingredient from "../../src/models/ingredient.model.js";
import Note from "../../src/models/note.model.js";
import Comment from "../../src/models/comment.model.js";
import Cuisine from "../../src/models/cuisine.model.js";
import BannedWord from "../../src/models/bannedWord.model.js";

import {
  testUserData,
  createTestUser,
  createSecondaryTestUser,
  getAuthenticatedAgent,
  createTestRecipe,
  customIngredient,
  createTestIngredient,
  createTestComment,
  createTestNote,
  createTestBannedWord,
  createTestCuisine,
  customCuisine,
} from "../../src/utils/testFunctions.js";

// Base test setup //

let testUser1;
let loginAgent1;
let testRecipe;
let testIngredient;
let testRecipeSlugIndex = 0;
let bannedWord;
let flaggedWord;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await BannedWord.deleteMany({});

  testUser1 = await createTestUser(testUserData);

  loginAgent1 = await getAuthenticatedAgent(testUser1);

  bannedWord = await createTestBannedWord(testUser1._id, { word: "banned" });
  flaggedWord = await createTestBannedWord(testUser1._id, {
    word: "flagged",
    severity: "flag",
  });
});

// Delete all recipes and notes before each test
beforeEach(async () => {
  await Recipe.deleteMany({});
  await Comment.deleteMany({});
  await Note.deleteMany({});
  await Cuisine.deleteMany({});
  await Ingredient.deleteMany({});

  testIngredient = await createTestIngredient();

  testRecipe = await createTestRecipe(testUser1._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
    slug: `test-recipe`,
  });
});

// Test cases: getUserProfile //
describe("GET /api/v1/users/me", () => {
  it("should return the current user's profile", async () => {
    const response = await loginAgent1.get("/api/v1/users/me");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("username", testUser1.username);
    expect(response.body.user).toHaveProperty(
      "displayName",
      testUser1.displayName,
    );
    expect(response.body.user).toHaveProperty("email", testUser1.email);
    expect(response.body.user).toHaveProperty("profileImage");
    expect(response.body.user).toHaveProperty("favoriteRecipes");
    expect(response.body.user).toHaveProperty("favoriteCuisines");
    expect(response.body.user).toHaveProperty("allergies");
    expect(response.body.user).toHaveProperty("shoppingList");
    expect(response.body.user).toHaveProperty("preferences");
    expect(response.body.user).toHaveProperty("lastLogin");
    expect(response.body.user).toHaveProperty("createdAt");
    expect(response.body.user).toHaveProperty("updatedAt");
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("role");
    expect(response.body.user).not.toHaveProperty("previousDisplayName");
    expect(response.body.user).not.toHaveProperty("lastDisplayNameChange");
    expect(response.body.user).not.toHaveProperty("previousEmail");
    expect(response.body.user).not.toHaveProperty("lastEmailChange");
    expect(response.body.user).not.toHaveProperty("lastPasswordChange");
    expect(response.body.user).not.toHaveProperty("lastFailedLogin");
    expect(response.body.user).not.toHaveProperty("failedLoginAttempts");
    expect(response.body.user).not.toHaveProperty("isEmailVerified");
    expect(response.body.user).not.toHaveProperty("isBanned");
    expect(response.body.user).not.toHaveProperty("isDeleted");
    expect(response.body.user).not.toHaveProperty("deletedAt");
    expect(response.body).toHaveProperty("recipes");
    expect(response.body.recipes.recipeList).toBeInstanceOf(Array);
    expect(response.body.recipes.recipeList).toHaveLength(1);
    expect(response.body.recipes).toHaveProperty("currentPage", 1);
    expect(response.body.recipes).toHaveProperty("totalRecipes", 1);
    expect(response.body.recipes).toHaveProperty("totalPages", 1);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 401 if the user is deleted", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: "deleteduser",
      displayName: "Deleted User",
      email: "deleteduser@example.com",
      password: "password123",
      isDeleted: true,
    });

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${deletedUser.token}`);
    ``;

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: getUserComments //
describe("GET /api/v1/users/me/comments", () => {
  it("should return a blank array if the user has no comments", async () => {
    const response = await loginAgent1.get("/api/v1/users/me/comments");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("comments");
    expect(Array.isArray(response.body.comments.comments)).toBe(true);
    expect(response.body.comments.comments.length).toBe(0);
  });

  it("should return a full list of the user's comments if there are any", async () => {
    for (let i = 0; i < 3; i++) {
      await createTestComment(testUser1._id, testRecipe._id);
    }

    const response = await loginAgent1.get("/api/v1/users/me/comments");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("comments");
    expect(Array.isArray(response.body.comments.comments)).toBe(true);
    expect(response.body.comments.comments.length).toBe(3);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/comments");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: getUserNotes //
describe("GET /api/v1/users/me/notes", () => {
  it("should return a blank array if the user has no notes", async () => {
    const response = await loginAgent1.get("/api/v1/users/me/notes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("notes");
    expect(Array.isArray(response.body.notes.notes)).toBe(true);
    expect(response.body.notes.notes.length).toBe(0);
  });

  it("should return a full list of the user's notes if there are any", async () => {
    for (let i = 0; i < 3; i++) {
      const newRecipe = await createTestRecipe(testUser1._id, {
        title: `Test Recipe ${i}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        slug: `test-recipe-${++testRecipeSlugIndex}`,
      });
      await createTestNote(testUser1._id, newRecipe._id);
    }

    const response = await loginAgent1.get("/api/v1/users/me/notes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("notes");
    expect(Array.isArray(response.body.notes.notes)).toBe(true);
    expect(response.body.notes.notes.length).toBe(3);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/notes");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

//Test cases: updateUserDisplayName //
describe("PUT /api/v1/users/me/display-name", () => {
  it("should update the user's display name", async () => {
    const newDisplayName = "updateddisplayname";

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .put("/api/v1/users/me/display-name")
      .send({ newDisplayName: newDisplayName });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("displayName", newDisplayName);
    expect(response.body.user).toHaveProperty("email", newUser.email);
  });

  it("should return 400 if the new display name is invalid", async () => {
    const response = await loginAgent1
      .put("/api/v1/users/me/display-name")
      .send({ newDisplayName: "ab" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Display name must be between 3 and 32 characters",
    );
  });

  it("should throw an error if the new display name contains a banned word", async () => {
    const response = await loginAgent1
      .put("/api/v1/users/me/display-name")
      .send({ newUsername: "banned username" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should allow a user to update their display name if it contains a banned word with other characters", async () => {
    const response = await loginAgent1
      .put("/api/v1/users/me/display-name")
      .send({ newDisplayName: "bannedusername" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .put("/api/v1/users/me/display-name")
      .send({ newDisplayName: "updateddisplayname" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: updateUserEmail //
describe("PUT /api/v1/users/me/email", () => {
  it("should update the user's email", async () => {
    const newEmail = `${crypto.randomUUID()}@example.com`;

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .put("/api/v1/users/me/email")
      .send({ newEmail: newEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Email updated successfully, please log in again",
    );
  });

  it("should return 400 if the new email is invalid", async () => {
    const response = await loginAgent1
      .put("/api/v1/users/me/email")
      .send({ newEmail: "invalidemail" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Invalid email format");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .put("/api/v1/users/me/email")
      .send({ newEmail: `${crypto.randomUUID()}@example.com` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should require login with the new email after updating", async () => {
    const newEmail = `${crypto.randomUUID()}@example.com`;

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .put("/api/v1/users/me/email")
      .send({ newEmail: newEmail });

    expect(response.status).toBe(200);

    // Try to access a protected route with the old token
    const protectedResponse = await loginAgent2.get("/api/v1/users/me");

    expect(protectedResponse.status).toBe(401);
    expect(protectedResponse.body).toHaveProperty("success", false);
    expect(protectedResponse.body).toHaveProperty(
      "message",
      "Login information was changed. Please log in again",
    );
  });
});

// Test cases: updateUserPassword //
describe("PUT /api/v1/users/me/password", () => {
  it("should update the user's password", async () => {
    const newPassword = "NewPassword123";

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .put("/api/v1/users/me/password")
      .send({ currentPassword: "Password123", newPassword: newPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Password updated successfully, please log in again",
    );
  });

  it("should return 400 if the new password is too short", async () => {
    const response = await loginAgent1
      .put("/api/v1/users/me/password")
      .send({ currentPassword: "Password123", newPassword: "short" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Password must be between 6 and 128 characters",
    );
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .put("/api/v1/users/me/password")
      .send({ currentPassword: "Password123", newPassword: "NewPassword123" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should require login with the new password after updating", async () => {
    const newPassword = "NewPassword123";

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .put("/api/v1/users/me/password")
      .send({ currentPassword: "Password123", newPassword: newPassword });

    expect(response.status).toBe(200);

    // Try to access a protected route with the old token
    const protectedResponse = await loginAgent2.get("/api/v1/users/me");

    expect(protectedResponse.status).toBe(401);
    expect(protectedResponse.body).toHaveProperty("success", false);
    expect(protectedResponse.body).toHaveProperty(
      "message",
      "Login information was changed. Please log in again",
    );
  });
});

// Test cases: updateUserProfileImage //
describe("PUT /api/v1/users/me/profile-image", () => {});

// Test cases: getUserRecipes //
describe("GET /api/v1/users/me/recipes", () => {
  it("should return a blank array if the user has no recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get("/api/v1/users/me/recipes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(0);
  });

  it("should return a full list of the user's recipes if there are any", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    for (let i = 0; i < 3; i++) {
      await createTestRecipe(newUser._id, {
        title: `Test Recipe ${i}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        slug: `test-recipe-${++testRecipeSlugIndex}`,
      });
    }

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get("/api/v1/users/me/recipes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(3);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/recipes");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: getUserFavoriteRecipes //
describe("GET /api/v1/users/me/favorites", () => {
  it("should return a blank array if the user has no favorite recipes", async () => {
    const response = await loginAgent1.get("/api/v1/users/me/favorites");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(0);
  });

  it("should return a full list of the user's favorite recipes if there are any", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    for (let i = 0; i < 3; i++) {
      const newRecipe = await createTestRecipe(testUser1._id, {
        title: `Test Recipe ${i}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        slug: `test-recipe-${++testRecipeSlugIndex}`,
      });
      await User.findByIdAndUpdate(newUser._id, {
        $push: { favoriteRecipes: newRecipe._id },
      });
    }

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get("/api/v1/users/me/favorites");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(3);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/favorites");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: addUserFavoriteRecipe //
describe("POST /api/v1/users/me/favorites/:recipeId", () => {
  it("should add a recipe to the user's favorite recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.post(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes[0]._id).toBe(
      testRecipe._id.toString(),
    );
    expect(response.body.favoriteRecipes.length).toBe(1);
  });

  it("should do nothing if the recipe is already in the user's favorite recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [testRecipe._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.post(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes[0]._id).toBe(
      testRecipe._id.toString(),
    );
    expect(response.body.favoriteRecipes.length).toBe(1);
  });

  it("should return all favorite recipes after adding a new one", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [testRecipe._id],
    });

    const anotherRecipe = await createTestRecipe(testUser1._id, {
      title: "Another Test Recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      slug: `another-test-${++testRecipeSlugIndex}`,
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.post(
      `/api/v1/users/me/favorites/${anotherRecipe._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes.length).toBe(2);
    const recipeIds = response.body.favoriteRecipes.map((recipe) => recipe._id);
    expect(recipeIds).toContain(testRecipe._id.toString());
    expect(recipeIds).toContain(anotherRecipe._id.toString());
  });

  it("should return 400 if the recipe ID is invalid", async () => {
    const response = await loginAgent1.post(
      `/api/v1/users/me/favorites/invalidRecipeId`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Invalid recipeId");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).post(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 404 if the recipe does not exist", async () => {
    const nonExistentRecipeId = new mongoose.Types.ObjectId();

    const response = await loginAgent1.post(
      `/api/v1/users/me/favorites/${nonExistentRecipeId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Recipe not found");
  });
});

// Test cases: removeUserFavoriteRecipe //
describe("DELETE /api/v1/users/me/favorites/:recipeId", () => {
  it("should remove a recipe from the user's favorite recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [testRecipe._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.delete(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes.length).toBe(0);
  });

  it("should do nothing if the recipe is not in the user's favorite recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.delete(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes.length).toBe(0);
  });

  it("should return 400 if the recipe ID is invalid", async () => {
    const response = await loginAgent1.delete(
      `/api/v1/users/me/favorites/invalidRecipeId`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Invalid recipeId");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).delete(
      `/api/v1/users/me/favorites/${testRecipe._id}`,
    );
  });

  it("should do nothing if the recipe does not exist", async () => {
    const nonExistentRecipeId = new mongoose.Types.ObjectId();

    const response = await loginAgent1.delete(
      `/api/v1/users/me/favorites/${nonExistentRecipeId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteRecipes).toBeInstanceOf(Array);
    expect(response.body.favoriteRecipes.length).toBe(0);
  });
});

// Test cases: getUserFavoriteCuisines //
describe("GET /api/v1/users/me/favorite-cuisines", () => {
  it("should return a blank array if the user has no favorite cuisines", async () => {
    const response = await loginAgent1.get(
      "/api/v1/users/me/favorite-cuisines",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("favoriteCuisines");
    expect(Array.isArray(response.body.favoriteCuisines)).toBe(true);
    expect(response.body.favoriteCuisines.length).toBe(0);
  });

  it("should return a full list of the user's favorite cuisines if there are any", async () => {
    let cuisines = [];

    for (let i = 0; i < 3; i++) {
      const newCuisine = await createTestCuisine(customCuisine(i));
      cuisines.push(newCuisine._id);
    }

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: cuisines,
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get(
      "/api/v1/users/me/favorite-cuisines",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("favoriteCuisines");
    expect(Array.isArray(response.body.favoriteCuisines)).toBe(true);
    expect(response.body.favoriteCuisines.length).toBe(3);
    expect(response.body.favoriteCuisines).toContain("test cuisine 0");
    expect(response.body.favoriteCuisines).toContain("test cuisine 1");
    expect(response.body.favoriteCuisines).toContain("test cuisine 2");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get(
      "/api/v1/users/me/favorite-cuisines",
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: addUserFavoriteCuisine //
describe("POST /api/v1/users/me/favorite-cuisines/", () => {
  it("should add a cuisine to the user's favorite cuisines", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/favorite-cuisines`)
      .send({ newCuisines: ["Test Cuisine"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines[0]).toBe("test cuisine");
    expect(response.body.favoriteCuisines.length).toBe(1);
  });

  it("should do nothing if the cuisine is already in the user's favorite cuisines", async () => {
    const testCuisine = await createTestCuisine({ title: "test cuisine 0" });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [testCuisine._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: [testCuisine.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines[0]).toBe(testCuisine.title);
    expect(response.body.favoriteCuisines.length).toBe(1);
  });

  it("should add multiple cuisines to the user's favorite cuisines, ignoring duplicates and case", async () => {
    const testCuisine1 = await createTestCuisine({ title: "test cuisine 1" });
    const testCuisine2 = await createTestCuisine({ title: "test cuisine 2" });
    const testCuisine3 = await createTestCuisine({ title: "test cuisine 3" });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [testCuisine1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({
        newCuisines: [
          testCuisine1.title,
          testCuisine2.title,
          testCuisine3.title,
          testCuisine3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines.length).toBe(3);
    expect(response.body.favoriteCuisines).toContain(testCuisine1.title);
    expect(response.body.favoriteCuisines).toContain(testCuisine2.title);
    expect(response.body.favoriteCuisines).toContain(testCuisine3.title);
  });

  it("should add any new cuisines to the cuisine collection", async () => {
    const invalidCuisine = await Cuisine.findOne({ name: "New Cuisine" });

    expect(invalidCuisine).toBeNull();

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: ["New Cuisine"] });

    const validCuisine = await Cuisine.findOne({ title: "new cuisine" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(validCuisine).not.toBeNull();
    expect(validCuisine.title).toBe("new cuisine");
  });

  it("should throw an error if the list of new cuisines contains a banned word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: ["test", "banned"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Content contains banned word: banned",
    );
  });

  it("should add new cuisines to the user's favorite cuisines if the list of new cuisines contains a flagged word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: ["test", "flagged"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toContain("test");
    expect(response.body.favoriteCuisines).toContain("flagged");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: ["Test Cuisine"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the new cuisines are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/favorite-cuisines/`)
      .send({ newCuisines: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Cuisines are required");
  });
});

// Test cases: removeUserFavoriteCuisine //
describe("DELETE /api/v1/users/me/favorite-cuisines/", () => {
  it("should remove a cuisine from the user's favorite cuisines", async () => {
    const testCuisine = await createTestCuisine({ title: "test cuisine 0" });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [testCuisine._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({ oldCuisines: [testCuisine.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines.length).toBe(0);
  });

  it("should do nothing if the cuisine does not exist in the cuisine collection", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({ oldCuisines: ["Nonexistent Cuisine"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines.length).toBe(0);
  });

  it("should do nothing if the cuisine is not in the user's favorite cuisines", async () => {
    const testCuisine = await createTestCuisine({ title: "test cuisine 0" });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [testCuisine._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({ oldCuisines: ["Nonexistent Cuisine"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines.length).toBe(1);
    expect(response.body.favoriteCuisines[0]).toBe(testCuisine.title);
  });

  it("should remove multiple cuisines from the user's favorite cuisines, ignoring duplicates and case", async () => {
    const testCuisine1 = await createTestCuisine({ title: "test cuisine 1" });
    const testCuisine2 = await createTestCuisine({ title: "test cuisine 2" });
    const testCuisine3 = await createTestCuisine({ title: "test cuisine 3" });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [testCuisine1._id, testCuisine3._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({
        oldCuisines: [
          testCuisine2.title,
          testCuisine3.title.toUpperCase(),
          testCuisine3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.favoriteCuisines).toBeInstanceOf(Array);
    expect(response.body.favoriteCuisines.length).toBe(1);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({ oldCuisines: ["Test Cuisine"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the old cuisines are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/favorite-cuisines`)
      .send({ oldCuisines: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Cuisines are required");
  });
});

// Test cases: getUserAllergies //
describe("GET /api/v1/users/me/allergies", () => {
  it("should return a blank array if the user has no allergies", async () => {
    const response = await loginAgent1.get("/api/v1/users/me/allergies");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("allergies");
    expect(Array.isArray(response.body.allergies)).toBe(true);
    expect(response.body.allergies.length).toBe(0);
  });

  it("should return a full list of the user's allergies if there are any", async () => {
    let ingredients = [];

    for (let i = 0; i < 3; i++) {
      const newIngredient = await createTestIngredient(customIngredient(i));
      ingredients.push(newIngredient._id);
    }

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: ingredients,
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get("/api/v1/users/me/allergies");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("allergies");
    expect(Array.isArray(response.body.allergies)).toBe(true);
    expect(response.body.allergies.length).toBe(3);
    expect(response.body.allergies).toContain("test ingredient 0");
    expect(response.body.allergies).toContain("test ingredient 1");
    expect(response.body.allergies).toContain("test ingredient 2");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/allergies");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: addUserAllergy //
describe("POST /api/v1/users/me/allergies/", () => {
  it("should add an ingredient to the user's allergies", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies[0]).toBe(testIngredient1.title);
    expect(response.body.allergies.length).toBe(1);
  });

  it("should do nothing if the ingredient is already in the user's allergies", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies[0]).toBe(testIngredient1.title);
    expect(response.body.allergies.length).toBe(1);
  });

  it("should add multiple ingredients to the user's allergies, ignoring duplicates and case", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });
    const testIngredient2 = await createTestIngredient({
      title: "test ingredient 2",
    });
    const testIngredient3 = await createTestIngredient({
      title: "test ingredient 3",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/allergies/`)
      .send({
        newIngredients: [
          testIngredient1.title,
          testIngredient2.title,
          testIngredient3.title,
          testIngredient3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies.length).toBe(3);
    expect(response.body.allergies).toContain(testIngredient1.title);
    expect(response.body.allergies).toContain(testIngredient2.title);
    expect(response.body.allergies).toContain(testIngredient3.title);
  });

  it("should add any new ingredients to the ingredient collection", async () => {
    const invalidIngredient = await Ingredient.findOne({
      name: "New Ingredient",
    });

    expect(invalidIngredient).toBeNull();

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: ["New Ingredient"] });

    const validIngredient = await Ingredient.findOne({
      title: "new ingredient",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(validIngredient).not.toBeNull();
    expect(validIngredient.title).toBe("new ingredient");
  });

  it("should throw an error if the new ingredients contains a banned word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: ["banned", "test"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should add new ingredients to the user's allergies if the list of new cuisines contains a flagged word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: ["test", "flagged"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toContain("test");
    expect(response.body.allergies).toContain("flagged");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: ["Test Ingredient"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the new ingredients are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/allergies/`)
      .send({ newIngredients: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Ingredients are required");
  });
});

// Test cases: removeUserAllergy //
describe("DELETE /api/v1/users/me/allergies/", () => {
  it("should remove an ingredient from the user's allergies", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/allergies/`)
      .send({ oldIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies.length).toBe(0);
  });

  it("should do nothing if the ingredient does not exist in the ingredient collection", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/allergies/`)
      .send({ oldIngredients: ["Nonexistent Ingredient"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies.length).toBe(0);
  });

  it("should do nothing if the ingredient is not in the user's allergies", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/allergies/`)
      .send({ oldIngredients: ["Nonexistent Ingredient"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies.length).toBe(1);
    expect(response.body.allergies[0]).toBe(testIngredient1.title);
  });

  it("should remove multiple ingredients from the user's allergies, ignoring duplicates and case", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });
    const testIngredient2 = await createTestIngredient({
      title: "test ingredient 2",
    });
    const testIngredient3 = await createTestIngredient({
      title: "test ingredient 3",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      allergies: [testIngredient1._id, testIngredient3._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/allergies/`)
      .send({
        oldIngredients: [
          testIngredient2.title,
          testIngredient3.title.toUpperCase(),
          testIngredient3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.allergies).toBeInstanceOf(Array);
    expect(response.body.allergies.length).toBe(1);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .delete(`/api/v1/users/me/allergies/`)
      .send({ oldIngredients: ["Test Ingredient"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the old ingredients are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/allergies/`)
      .send({ oldIngredients: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Ingredients are required");
  });
});

// Test cases: getUserShoppingList //
describe("GET /api/v1/users/me/shopping-list", () => {
  it("should return a blank array if the user has no shopping list items", async () => {
    const response = await loginAgent1.get("/api/v1/users/me/shopping-list");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("shoppingList");
    expect(Array.isArray(response.body.shoppingList)).toBe(true);
    expect(response.body.shoppingList.length).toBe(0);
  });

  it("should return a full list of the user's shopping list items if there are any", async () => {
    let ingredients = [];

    for (let i = 0; i < 3; i++) {
      const newIngredient = await createTestIngredient(customIngredient(i));
      ingredients.push(newIngredient._id);
    }

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: ingredients,
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.get("/api/v1/users/me/shopping-list");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("shoppingList");
    expect(Array.isArray(response.body.shoppingList)).toBe(true);
    expect(response.body.shoppingList.length).toBe(3);
    expect(response.body.shoppingList).toContain("test ingredient 0");
    expect(response.body.shoppingList).toContain("test ingredient 1");
    expect(response.body.shoppingList).toContain("test ingredient 2");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).get("/api/v1/users/me/shopping-list");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: addUserShoppingListItem //
describe("POST /api/v1/users/me/shopping-list/", () => {
  it("should add an ingredient to the user's shopping list", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList[0]).toBe(testIngredient1.title);
    expect(response.body.shoppingList.length).toBe(1);
  });

  it("should do nothing if the ingredient is already in the user's shopping list", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList[0]).toBe(testIngredient1.title);
    expect(response.body.shoppingList.length).toBe(1);
  });

  it("should add multiple ingredients to the user's shopping list, ignoring duplicates and case", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });
    const testIngredient2 = await createTestIngredient({
      title: "test ingredient 2",
    });
    const testIngredient3 = await createTestIngredient({
      title: "test ingredient 3",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/shopping-list/`)
      .send({
        newIngredients: [
          testIngredient1.title,
          testIngredient2.title,
          testIngredient3.title,
          testIngredient3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList.length).toBe(3);
    expect(response.body.shoppingList).toContain(testIngredient1.title);
    expect(response.body.shoppingList).toContain(testIngredient2.title);
    expect(response.body.shoppingList).toContain(testIngredient3.title);
  });

  it("should add any new ingredients to the ingredient collection", async () => {
    const invalidIngredient = await Ingredient.findOne({
      title: "New Ingredient",
    });

    expect(invalidIngredient).toBeNull();

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: ["New Ingredient"] });

    const validIngredient = await Ingredient.findOne({
      title: "new ingredient",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(validIngredient).not.toBeNull();
    expect(validIngredient.title).toBe("new ingredient");
  });

  it("should throw an error if the new ingredients contains a banned word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: ["Test Ingredient", "banned"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Content contains banned word: banned",
    );
  });

  it("should add new ingredients to the user's shopping list if the list of new cuisines contains a flagged word", async () => {
    const response = await loginAgent1
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: ["test", "flagged"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toContain("test");
    expect(response.body.shoppingList).toContain("flagged");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: ["Test Ingredient"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the new ingredients are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",

      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .post(`/api/v1/users/me/shopping-list/`)
      .send({ newIngredients: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Ingredients are required");
  });
});

// Test cases: removeUserShoppingListItem //
describe("DELETE /api/v1/users/me/shopping-list/", () => {
  it("should remove an ingredient from the user's shopping list", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({ oldIngredients: [testIngredient1.title] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList.length).toBe(0);
  });

  it("should do nothing if the ingredient does not exist in the ingredient collection", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({ oldIngredients: ["Nonexistent Ingredient"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList.length).toBe(0);
  });

  it("should do nothing if the ingredient is not in the user's shopping list", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 0",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: [testIngredient1._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({ oldIngredients: ["Nonexistent Ingredient"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList.length).toBe(1);
    expect(response.body.shoppingList[0]).toBe(testIngredient1.title);
  });

  it("should remove multiple ingredients from the user's shopping list, ignoring duplicates and case", async () => {
    const testIngredient1 = await createTestIngredient({
      title: "test ingredient 1",
    });
    const testIngredient2 = await createTestIngredient({
      title: "test ingredient 2",
    });
    const testIngredient3 = await createTestIngredient({
      title: "test ingredient 3",
    });

    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      shoppingList: [testIngredient1._id, testIngredient3._id],
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({
        oldIngredients: [
          testIngredient2.title,
          testIngredient3.title.toUpperCase(),
          testIngredient3.title.toUpperCase(),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.shoppingList).toBeInstanceOf(Array);
    expect(response.body.shoppingList.length).toBe(1);
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({ oldIngredients: ["Test Ingredient"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });

  it("should return 400 if the old ingredients are not an array", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2
      .delete(`/api/v1/users/me/shopping-list/`)
      .send({ oldIngredients: "Not an array" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "Ingredients are required");
  });
});

// Test cases: deleteUserAccount //
describe("DELETE /api/v1/users/me/", () => {
  it("should delete the user's account", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const loginAgent2 = await getAuthenticatedAgent(newUser);

    const response = await loginAgent2.delete(`/api/v1/users/me/`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "User account deleted successfully",
    );

    const deletedUser = await User.findById(newUser._id).select(
      "+isDeleted +deletedAt",
    );

    expect(deletedUser).not.toBeNull();
    expect(deletedUser.isDeleted).toBe(true);
    expect(deletedUser.deletedAt).not.toBeNull();
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app).delete(`/api/v1/users/me/`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "No authentication token found, access denied",
    );
  });
});

// Test cases: getUserProfileByUsername //
describe("GET /api/v1/users/:username", () => {
  it("should return other user's profile information while logged in", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const response = await loginAgent1.get(`/api/v1/users/${newUser.username}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty(
      "displayName",
      newUser.displayName,
    );
    expect(response.body.user).toHaveProperty("profileImage");
    expect(response.body.user).toHaveProperty("lastLogin");
    expect(response.body.user).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("recipes");
    expect(response.body.recipes.recipeList).toBeInstanceOf(Array);
    expect(response.body.user).not.toHaveProperty("username");
    expect(response.body.user).not.toHaveProperty("email");
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("favoriteRecipes");
    expect(response.body.user).not.toHaveProperty("favoriteCuisines");
    expect(response.body.user).not.toHaveProperty("allergies");
    expect(response.body.user).not.toHaveProperty("shoppingList");
    expect(response.body.user).not.toHaveProperty("preferences");
    expect(response.body.user).not.toHaveProperty("role");
    expect(response.body.user).not.toHaveProperty("previousDisplayName");
    expect(response.body.user).not.toHaveProperty("lastDisplayNameChange");
    expect(response.body.user).not.toHaveProperty("previousEmail");
    expect(response.body.user).not.toHaveProperty("lastEmailChange");
    expect(response.body.user).not.toHaveProperty("emailChangeCount");
    expect(response.body.user).not.toHaveProperty("lastPasswordChange");
    expect(response.body.user).not.toHaveProperty("lastFailedLogin");
    expect(response.body.user).not.toHaveProperty("failedLoginAttempts");
    expect(response.body.user).not.toHaveProperty("isEmailVerified");
    expect(response.body.user).not.toHaveProperty("isBanned");
    expect(response.body.user).not.toHaveProperty("isDeleted");
    expect(response.body.user).not.toHaveProperty("deletedAt");
  });

  it("should return the user's profile with a list of their recipes if they have any", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    for (let i = 0; i < 3; i++) {
      await createTestRecipe(newUser._id, {
        title: `Test Recipe ${i}`,
        slug: `test-recipe-${i}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
      });
    }

    const response = await loginAgent1.get(`/api/v1/users/${newUser.username}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("recipes");
    expect(response.body.recipes.recipeList).toBeInstanceOf(Array);
    expect(response.body.recipes.recipeList.length).toBe(3);
    for (let i = 0; i < 3; i++) {
      expect(response.body.recipes.recipeList[i]).toHaveProperty("title");
      expect(response.body.recipes.recipeList[i]).toHaveProperty("slug");
      expect(response.body.recipes.recipeList[i]).toHaveProperty("description");
      expect(response.body.recipes.recipeList[i]).toHaveProperty("image");
      expect(response.body.recipes.recipeList[i]).toHaveProperty(
        "preptimeSeconds",
      );
      expect(response.body.recipes.recipeList[i]).toHaveProperty(
        "cooktimeSeconds",
      );
      expect(response.body.recipes.recipeList[i]).toHaveProperty(
        "aggregateRating",
      );
      expect(response.body.recipes.recipeList[i]).toHaveProperty("ratingCount");
      expect(response.body.recipes.recipeList[i]).toHaveProperty("author");
      expect(response.body.recipes.recipeList[i].author).toHaveProperty(
        "displayName",
      );
      expect(response.body.recipes.recipeList[i]).toHaveProperty("isPublished");
    }
    expect(response.body.recipes).toHaveProperty("currentPage", 1);
    expect(response.body.recipes).toHaveProperty("totalRecipes", 3);
    expect(response.body.recipes).toHaveProperty("totalPages", 1);
  });

  it("should return 404 if the user does not exist", async () => {
    const nonExistentUsername = "nonexistentuser";

    const response = await loginAgent1.get(
      `/api/v1/users/${nonExistentUsername}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it("should return 404 if the user has been deleted", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: "deleteduser",
      displayName: "DeletedUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await User.findByIdAndUpdate(deletedUser._id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    const response = await loginAgent1.get(
      `/api/v1/users/${deletedUser.username}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it("should return return the users profile information even when not authenticated", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const response = await request(app).get(
      `/api/v1/users/${newUser.username}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
  });
});

// Test cases: getUserRecipesByUsername //
describe("GET /api/v1/users/:username/recipes", () => {
  it("should return an empty array of recipes for a user with no recipes", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const response = await loginAgent1.get(
      `/api/v1/users/${newUser.username}/recipes`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(0);
  });

  it("should return a list of the user's recipes if they have any", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    for (let i = 0; i < 3; i++) {
      await createTestRecipe(newUser._id, {
        title: `Test Recipe ${i}`,
        slug: `test-recipe-${i}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
      });
    }

    const response = await loginAgent1.get(
      `/api/v1/users/${newUser.username}/recipes`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    expect(response.body.recipeList.length).toBe(3);
    expect(response.body.recipeList).toContainEqual(
      expect.objectContaining({
        title: "Test Recipe 0",
      }),
    );
    expect(response.body.recipeList).toContainEqual(
      expect.objectContaining({
        title: "Test Recipe 1",
      }),
    );
    expect(response.body.recipeList).toContainEqual(
      expect.objectContaining({
        title: "Test Recipe 2",
      }),
    );
  });

  it("should return return the users recipes even when not authenticated", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      displayName: "TestUser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const response = await request(app).get(
      `/api/v1/users/${newUser.username}/recipes`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("recipeList");
  });

  it("should return 404 if the user does not exist", async () => {
    const nonExistentUsername = "nonexistentuser";

    const response = await loginAgent1.get(
      `/api/v1/users/${nonExistentUsername}/recipes`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message", "User not found");
  });
});
