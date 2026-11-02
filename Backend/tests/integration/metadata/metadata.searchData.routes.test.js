import mongoose from "mongoose";
import request from "supertest";
import app from "../../../src/app.js";

import User from "../../../src/models/user.model";
import Recipe from "../../../src/models/recipe.model";
import Ingredient from "../../../src/models/ingredient.model";
import Season from "../../../src/models/season.model";
import Holiday from "../../../src/models/holiday.model";
import Tag from "../../../src/models/tag.model";
import Cuisine from "../../../src/models/cuisine.model";
import Meal from "../../../src/models/meal.model";

import {
  testUserData,
  createTestUser,
  getAuthenticatedAgent,
  createTestRecipe,
  createTestIngredient,
} from "../../../src/utils/testFunctions.js";

// Base test setup //

let testUser;
let loginAgent;
let otherUser;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});
  await Season.deleteMany({});
  await Holiday.deleteMany({});
  await Tag.deleteMany({});
  await Cuisine.deleteMany({});
  await Meal.deleteMany({});

  // Create test user and get authenticated agent
  testUser = await createTestUser(testUserData);
  loginAgent = await getAuthenticatedAgent(testUser);

  // Create all test data for search data route tests
  otherUser = await createTestUser({
    ...testUserData,
    email: "other@user.com",
    displayName: "Other user",
    username: "otheruser",
    password: "password",
  });
  await createTestUser({
    ...testUserData,
    email: "banned@user.com",
    displayName: "Banned user",
    username: "banneduser",
    password: "password",
    isBanned: true,
  });
  await createTestUser({
    ...testUserData,
    email: "deleted@user.com",
    displayName: "Deleted user",
    username: "deleteduser",
    password: "password",
    isDeleted: true,
  });
  const testIngredient1 = await createTestIngredient({
    title: "Test ingredient 1",
  });
  const testIngredient2 = await createTestIngredient({
    title: "Test ingredient 2",
  });
  await createTestRecipe(testUser._id, {
    title: "Test recipe 1",
    slug: "test-recipe-1",
    isPublished: true,
    ingredientSections: [
      {
        ingredients: [{ ingredient: testIngredient1._id }],
      },
    ],
  });
  await createTestRecipe(testUser._id, {
    title: "Test recipe 2",
    slug: "test-recipe-2",
    isPublished: false,
    ingredientSections: [
      {
        ingredients: [{ ingredient: testIngredient2._id }],
      },
    ],
  });
  await createTestRecipe(testUser._id, {
    title: "Test recipe 3",
    slug: "test-recipe-3",
    isPublished: true,
    isDeleted: true,
    ingredientSections: [
      {
        ingredients: [{ ingredient: testIngredient1._id }],
      },
    ],
  });
  await Season.create({
    title: "Test season 1",
  });
  await Season.create({
    title: "Test season 2",
  });
  await Holiday.create({ title: "Test holiday 1" });
  await Holiday.create({ title: "Test holiday 2" });
  await Tag.create({ title: "Test tag 1" });
  await Tag.create({ title: "Test tag 2" });
  await Cuisine.create({ title: "Test cuisine 1" });
  await Cuisine.create({ title: "Test cuisine 2" });
  await Meal.create({ title: "Test meal 1" });
  await Meal.create({ title: "Test meal 2" });
});

// Test cases: getSearchData //
describe("GET /api/metadata/search-data", () => {
  it("should fetch search data for the authenticated user including the user's unpublished recipes", async () => {
    const res = await loginAgent.get("/api/v1/metadata/search-data");

    expect(res.statusCode).toEqual(200);
    expect(res.body.userNames).toBeInstanceOf(Array);
    expect(res.body.userNames.length).toBe(2);
    for (const user of res.body.userNames) {
      expect(user.displayName).toBeDefined();
      expect(user.profileImage).toBeDefined();
    }
    expect(res.body.recipeNames).toBeInstanceOf(Array);
    expect(res.body.recipeNames.length).toBe(2);
    for (const recipe of res.body.recipeNames) {
      expect(recipe.title).toBeDefined();
      expect(recipe.slug).toBeDefined();
      expect(recipe.image).toBeDefined();
      expect(
        recipe.isPublished ||
          recipe.author._id.toString() === testUser._id.toString(),
      ).toBe(true);
    }
    expect(res.body.ingredientNames).toBeInstanceOf(Array);
    expect(res.body.ingredientNames.length).toBe(2);
    for (const ingredient of res.body.ingredientNames) {
      expect(ingredient.title).toBeDefined();
      expect(ingredient.indexItem).toBeDefined();
    }
    expect(res.body.seasonNames).toBeInstanceOf(Array);
    expect(res.body.seasonNames.length).toBe(2);
    for (const season of res.body.seasonNames) {
      expect(season.title).toBeDefined();
    }
    expect(res.body.holidayNames).toBeInstanceOf(Array);
    expect(res.body.holidayNames.length).toBe(2);
    for (const holiday of res.body.holidayNames) {
      expect(holiday.title).toBeDefined();
    }
    expect(res.body.tagNames).toBeInstanceOf(Array);
    expect(res.body.tagNames.length).toBe(2);
    for (const tag of res.body.tagNames) {
      expect(tag.title).toBeDefined();
    }
    expect(res.body.cuisineNames).toBeInstanceOf(Array);
    expect(res.body.cuisineNames.length).toBe(2);
    for (const cuisine of res.body.cuisineNames) {
      expect(cuisine.title).toBeDefined();
    }
    expect(res.body.mealNames).toBeInstanceOf(Array);
    expect(res.body.mealNames.length).toBe(2);
    for (const meal of res.body.mealNames) {
      expect(meal.title).toBeDefined();
    }
  });

  it("should fetch search data for an unauthenticated user including only published recipes", async () => {
    const res = await request(app).get("/api/v1/metadata/search-data");

    expect(res.statusCode).toEqual(200);
    expect(res.body.userNames).toBeInstanceOf(Array);
    expect(res.body.userNames.length).toBe(2);
    expect(res.body.recipeNames).toBeInstanceOf(Array);
    expect(res.body.recipeNames.length).toBe(1);
    for (const recipe of res.body.recipeNames) {
      expect(recipe.title).toBeDefined();
      expect(recipe.slug).toBeDefined();
      expect(recipe.image).toBeDefined();
      expect(recipe.isPublished).toBe(true);
    }
    expect(res.body.ingredientNames).toBeInstanceOf(Array);
    expect(res.body.ingredientNames.length).toBe(2);
    expect(res.body.seasonNames).toBeInstanceOf(Array);
    expect(res.body.seasonNames.length).toBe(2);
    expect(res.body.holidayNames).toBeInstanceOf(Array);
    expect(res.body.holidayNames.length).toBe(2);
    expect(res.body.tagNames).toBeInstanceOf(Array);
    expect(res.body.tagNames.length).toBe(2);
    expect(res.body.cuisineNames).toBeInstanceOf(Array);
    expect(res.body.cuisineNames.length).toBe(2);
    expect(res.body.mealNames).toBeInstanceOf(Array);
    expect(res.body.mealNames.length).toBe(2);
  });
});
