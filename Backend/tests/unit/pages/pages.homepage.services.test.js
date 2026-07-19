import { jest } from "@jest/globals";

import mongoose, { get } from "mongoose";

import User from "../../../src/models/user.model.js";
import Recipe from "../../../src/models/recipe.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";
import Season from "../../../src/models/season.model.js";
import Holiday from "../../../src/models/holiday.model.js";

import {
  createTestUser,
  createTestRecipe,
  createTestIngredient,
  createTestHoliday,
  createTestSeason,
  addRecipeToFavorites,
} from "../../../src/utils/testFunctions.js";

import {
  getHomepageData,
  getRandomRecipes,
} from "../../../src/services/pages/pages.homepage.services.js";

// Base test setup //

let testUser;
let testIngredient;
let testActiveSeason;
let testNonActiveSeason;
let testActiveHoliday;
let testNonActiveHoliday;
let activeHolidays = [];
let nonActiveHolidays = [];
let activeSeasons = [];
let nonActiveSeasons = [];

const today = new Date();
const lastweek = new Date(today);
lastweek.setDate(lastweek.getDate() - 7);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
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
  testIngredient = await createTestIngredient();
  testActiveHoliday = await createTestHoliday({
    title: "Test Active Holiday",
    startDate: lastweek,
    endDate: nextWeek,
  });
  testNonActiveHoliday = await createTestHoliday({
    title: "Test Non-Active Holiday",
    startDate: tomorrow,
    endDate: nextWeek,
  });
  testActiveSeason = await createTestSeason({
    title: "Test Active Season",
    startDate: lastweek,
    endDate: nextWeek,
  });
  testNonActiveSeason = await createTestSeason({
    title: "Test Non-Active Season",
    startDate: tomorrow,
    endDate: nextWeek,
  });

  // Create 30 test recipes and alternate what season and holiday they are associated with, and give them an aggregate rating
  const testRecipes = [];
  for (let i = 0; i < 30; i++) {
    const aggregateRating = i % 5;
    const isPublished = i % 10;
    const season = i % 2 === 0 ? testActiveSeason : testNonActiveSeason;
    const holiday = i % 2 === 0 ? testNonActiveHoliday : testActiveHoliday;
    const testRecipe = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${i + 1}`,
      slug: `test-recipe-${i + 1}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      seasons: [season._id],
      holidays: [holiday._id],
      aggregateRating: aggregateRating === 0 ? 5 : aggregateRating,
      // Do not publish one out of every 10 recipes
      isPublished: isPublished === 0 ? false : true,
    });
    testRecipes.push(testRecipe);
  }

  // Update active and non active season and holiday arrays
  for (const recipe of testRecipes) {
    if (recipe.seasons.includes(testActiveSeason._id)) {
      activeSeasons.push(recipe._id);
      await addRecipeToFavorites(testUser, recipe);
    } else {
      nonActiveSeasons.push(recipe._id);
    }
    if (recipe.holidays.includes(testActiveHoliday._id)) {
      activeHolidays.push(recipe._id);
    } else {
      nonActiveHolidays.push(recipe._id);
    }
  }
});

// Test cases: getHomepageData //
describe("getHomepageData", () => {
  test("should return correct homepage data", async () => {
    const result = await getHomepageData();

    expect(result).toEqual(
      expect.objectContaining({
        favoriteRecipes: expect.any(Array),
        mostRecentHighestRatedCache: expect.any(Array),
        seasonalCache: expect.any(Array),
        holidayCache: expect.any(Array),
        randomCache: expect.any(Array),
      }),
    );
    expect(result.favoriteRecipes.length).toBe(0);
    expect(result.mostRecentHighestRatedCache.length).toBe(10);
    expect(result.seasonalCache.length).toBe(10);
    expect(result.holidayCache.length).toBe(10);
    expect(result.randomCache.length).toBe(10);
    // Each most recent highest rated recipe should have a equal or higher rating than the next recipe
    for (let i = 0; i < result.mostRecentHighestRatedCache.length - 1; i++) {
      expect(
        result.mostRecentHighestRatedCache[i].aggregateRating,
      ).toBeGreaterThanOrEqual(
        result.mostRecentHighestRatedCache[i + 1].aggregateRating,
      );
      // Each recipe should also have a title, slug, description, image, preptimeSeconds, cooktimeSeconds, aggregateRating, ratingCount, isPublished, and author ID, username and displayname
      expect(result.mostRecentHighestRatedCache[i]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String),
          image: expect.any(String),
          preptimeSeconds: expect.any(Number),
          cooktimeSeconds: expect.any(Number),
          aggregateRating: expect.any(Number),
          ratingCount: expect.any(Number),
          isPublished: expect.any(Boolean),
          author: expect.any(Object),
        }),
      );
      expect(result.mostRecentHighestRatedCache[i].author._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(result.mostRecentHighestRatedCache[i].author.username).toBe(
        testUser.username,
      );
      expect(result.mostRecentHighestRatedCache[i].author.displayName).toBe(
        testUser.displayName,
      );
      expect(result.mostRecentHighestRatedCache[i].isPublished).toBe(true);
    }
    // Each seasonal and holiday recipe should have a start date before today and end date after today
    for (let i = 0; i < result.seasonalCache.length; i++) {
      expect(activeSeasons.map((season) => season._id.toString())).toContain(
        result.seasonalCache[i]._id.toString(),
      );
      expect(
        nonActiveSeasons.map((season) => season._id.toString()),
      ).not.toContain(result.seasonalCache[i]._id.toString());
      // Each recipe should also have a title, slug, description, image, preptimeSeconds, cooktimeSeconds, aggregateRating, ratingCount, isPublished, and author ID, username and displayname
      expect(result.seasonalCache[i]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String),
          image: expect.any(String),
          preptimeSeconds: expect.any(Number),
          cooktimeSeconds: expect.any(Number),
          aggregateRating: expect.any(Number),
          ratingCount: expect.any(Number),
          isPublished: expect.any(Boolean),
          author: expect.any(Object),
        }),
      );
      expect(result.seasonalCache[i].author._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(result.seasonalCache[i].author.username).toBe(testUser.username);
      expect(result.seasonalCache[i].author.displayName).toBe(
        testUser.displayName,
      );
      expect(result.seasonalCache[i].isPublished).toBe(true);
    }
    for (let i = 0; i < result.holidayCache.length; i++) {
      expect(activeHolidays.map((holiday) => holiday._id.toString())).toContain(
        result.holidayCache[i]._id.toString(),
      );
      expect(
        nonActiveHolidays.map((holiday) => holiday._id.toString()),
      ).not.toContain(result.holidayCache[i]._id.toString());
      expect(result.holidayCache[i]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String),
          image: expect.any(String),
          preptimeSeconds: expect.any(Number),
          cooktimeSeconds: expect.any(Number),
          aggregateRating: expect.any(Number),
          ratingCount: expect.any(Number),
          isPublished: expect.any(Boolean),
          author: expect.any(Object),
        }),
      );
      expect(result.holidayCache[i].author._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(result.holidayCache[i].author.username).toBe(testUser.username);
      expect(result.holidayCache[i].author.displayName).toBe(
        testUser.displayName,
      );
      expect(result.holidayCache[i].isPublished).toBe(true);
    }
    // Each random recipe should have a title, slug, description, image, preptimeSeconds, cooktimeSeconds, aggregateRating, ratingCount, isPublished, and author ID, username and displayname
    for (let i = 0; i < result.randomCache.length; i++) {
      expect(result.randomCache[i]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String),
          image: expect.any(String),
          preptimeSeconds: expect.any(Number),
          cooktimeSeconds: expect.any(Number),
          aggregateRating: expect.any(Number),
          ratingCount: expect.any(Number),
          isPublished: expect.any(Boolean),
          author: expect.any(Object),
        }),
      );
      expect(result.randomCache[i].author._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(result.randomCache[i].author.username).toBe(testUser.username);
      expect(result.randomCache[i].author.displayName).toBe(
        testUser.displayName,
      );
      expect(result.randomCache[i].isPublished).toBe(true);
    }
  });

  test("should return a user's favorite recipes if a user is logged in", async () => {
    const result = await getHomepageData(testUser);

    expect(result.mostRecentHighestRatedCache.length).toBe(10);
    expect(result.seasonalCache.length).toBe(10);
    expect(result.holidayCache.length).toBe(10);
    expect(result.randomCache.length).toBe(10);
    expect(result.favoriteRecipes.length).toBe(10);
    // Each favorite recipe should have a title, slug, description, image, preptimeSeconds, cooktimeSeconds, aggregateRating, ratingCount, isPublished, and author ID, username and displayname
    for (let i = 0; i < result.favoriteRecipes.length; i++) {
      expect(result.favoriteRecipes[i]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String),
          image: expect.any(String),
          preptimeSeconds: expect.any(Number),
          cooktimeSeconds: expect.any(Number),
          aggregateRating: expect.any(Number),
          ratingCount: expect.any(Number),
          isPublished: expect.any(Boolean),
          author: expect.any(Object),
        }),
      );
      expect(result.favoriteRecipes[i].author._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(result.favoriteRecipes[i].author.username).toBe(testUser.username);
      expect(result.favoriteRecipes[i].author.displayName).toBe(
        testUser.displayName,
      );
    }
  });
});
