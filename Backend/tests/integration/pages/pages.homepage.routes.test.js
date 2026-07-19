import mongoose from "mongoose";
import request from "supertest";
import app from "../../../src/app.js";

import User from "../../../src/models/user.model";
import Recipe from "../../../src/models/recipe.model";
import Ingredient from "../../../src/models/ingredient.model";
import Season from "../../../src/models/season.model";
import Holiday from "../../../src/models/holiday.model";

import {
  testUserData,
  createTestUser,
  getAuthenticatedAgent,
  customRecipe,
  createTestRecipe,
  createTestIngredient,
  createTestSeason,
  createTestHoliday,
  addRecipeToFavorites,
} from "../../../src/utils/testFunctions.js";

// Base test setup //

let testUser;
let loginAgent;
let testIngredient;
let testActiveSeason;
let testActiveHoliday;

const today = new Date();
const lastweek = new Date(today);
lastweek.setDate(lastweek.getDate() - 7);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});
  await Season.deleteMany({});
  await Holiday.deleteMany({});

  // Create users, ingredients, holidays, and seasons
  testUser = await createTestUser();
  loginAgent = await getAuthenticatedAgent(testUser);
  testIngredient = await createTestIngredient();
  testActiveHoliday = await createTestHoliday({
    title: "Test Active Holiday",
    startDate: lastweek,
    endDate: nextWeek,
  });
  testActiveSeason = await createTestSeason({
    title: "Test Active Season",
    startDate: lastweek,
    endDate: nextWeek,
  });

  // Create 30 test recipes and alternate what season and holiday they are associated with, and give them an aggregate rating
  const testRecipes = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      createTestRecipe(testUser._id, {
        title: `Test Recipe ${i + 1}`,
        slug: `test-recipe-${i + 1}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        seasons: [testActiveSeason._id],
        holidays: [testActiveHoliday._id],
        aggregateRating: i % 5 || 5,
        isPublished: true,
      }),
    ),
  );

  // Add recipes to favorites
  for (const recipe of testRecipes) {
    await addRecipeToFavorites(testUser, recipe);
  }
});

// Test cases: getHomePage //
describe("GET /api/homepage", () => {
  it("should fetch homepage data for the authenticated user with user's favorites", async () => {
    const res = await loginAgent.get("/api/v1/homepage");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Homepage retrieved successfully");
    expect(res.body.homepageData).toBeDefined();
    expect(res.body.homepageData.favoriteRecipes).toBeInstanceOf(Array);
    expect(res.body.homepageData.favoriteRecipes.length).toBe(10);
    expect(res.body.homepageData.mostRecentHighestRatedCache).toBeInstanceOf(
      Array,
    );
    expect(res.body.homepageData.mostRecentHighestRatedCache.length).toBe(10);
    expect(res.body.homepageData.seasonalCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.seasonalCache.length).toBe(10);
    expect(res.body.homepageData.holidayCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.holidayCache.length).toBe(10);
    expect(res.body.homepageData.randomCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.randomCache.length).toBe(10);
  });

  it("should fetch homepage data for unauthenticated user without user's favorites", async () => {
    const res = await request(app).get("/api/v1/homepage");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Homepage retrieved successfully");
    expect(res.body.homepageData).toBeDefined();
    expect(res.body.homepageData.favoriteRecipes).toBeInstanceOf(Array);
    expect(res.body.homepageData.favoriteRecipes.length).toBe(0);
    expect(res.body.homepageData.mostRecentHighestRatedCache).toBeInstanceOf(
      Array,
    );
    expect(res.body.homepageData.mostRecentHighestRatedCache.length).toBe(10);
    expect(res.body.homepageData.seasonalCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.seasonalCache.length).toBe(10);
    expect(res.body.homepageData.holidayCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.holidayCache.length).toBe(10);
    expect(res.body.homepageData.randomCache).toBeInstanceOf(Array);
    expect(res.body.homepageData.randomCache.length).toBe(10);
  });
});
