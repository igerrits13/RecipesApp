// Homepage should have: Current seasons and holidays, users favorites if logged in, highest rated recently added recipes, 10 of each

import Recipe from "../../models/recipe.model.js";
import Season from "../../models/season.model.js";
import Holiday from "../../models/holiday.model.js";
import { populateRecipePreview } from "../../queries/recipe.queries.js";

let mostRecentHighestRatedCache = null;
let mostRecentHighestRatedLastUpdated = null;
let seasonalCache = null;
let seasonsLastUpdated = null;
let holidayCache = null;
let holidaysLastUpdated = null;
let randomCache = null;
let randomLastUpdated = null;

const GLOBAL_LIMIT = 10;
const ONE_HOUR = 60 * 60 * 1000;

// Helper function to get the user's favorite recipes
async function getFavoriteRecipes(user) {
  const recipes = await Recipe.aggregate([
    {
      $match: {
        _id: { $in: user.favoriteRecipes },
        $or: [
          { isPublished: true },
          {
            author: user._id,
            isDeleted: false,
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    },
    { $unwind: "$authorData" },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        image: 1,
        preptimeSeconds: 1,
        cooktimeSeconds: 1,
        aggregateRating: 1,
        ratingCount: 1,
        isPublished: 1,
        author: {
          _id: "$authorData._id",
          username: "$authorData.username",
          displayName: "$authorData.displayName",
        },
      },
    },
    { $sample: { size: GLOBAL_LIMIT } },
  ]);

  return populateRecipePreview(recipes);
}

// Helper function to get the most recent highest rated recipes
async function getMostRecentHighestRatedRecipes() {
  const recipes = await Recipe.aggregate([
    { $match: { isPublished: true } },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    },
    { $unwind: "$authorData" },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        image: 1,
        preptimeSeconds: 1,
        cooktimeSeconds: 1,
        aggregateRating: 1,
        ratingCount: 1,
        isPublished: 1,
        author: {
          _id: "$authorData._id",
          username: "$authorData.username",
          displayName: "$authorData.displayName",
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: GLOBAL_LIMIT * 2 },
    { $sort: { aggregateRating: -1 } },
    { $limit: GLOBAL_LIMIT },
  ]);

  return populateRecipePreview(recipes);
}

// Helper function to get todays seasons
async function getSeasonalRecipes(today) {
  // Get the active seasons
  let seasons = await Season.find({
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const seasonIds = seasons.map((season) => season._id);

  // Get some of the recipes for the active seasons
  const seasonalRecipes = await Recipe.aggregate([
    {
      $match: { $and: [{ seasons: { $in: seasonIds }, isPublished: true }] },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    },
    { $unwind: "$authorData" },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        image: 1,
        preptimeSeconds: 1,
        cooktimeSeconds: 1,
        aggregateRating: 1,
        ratingCount: 1,
        isPublished: 1,
        author: {
          _id: "$authorData._id",
          username: "$authorData.username",
          displayName: "$authorData.displayName",
        },
      },
    },
    { $sample: { size: GLOBAL_LIMIT } },
  ]);

  return populateRecipePreview(seasonalRecipes);
}

// Helper function to get todays holidays
async function getHolidayRecipes(today) {
  // Get the active holidays
  let holidays = await Holiday.find({
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const holidayIds = holidays.map((holiday) => holiday._id);

  // Get some of the recipes for the active holidays
  const holidayRecipes = await Recipe.aggregate([
    {
      $match: { $and: [{ holidays: { $in: holidayIds }, isPublished: true }] },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    },
    { $unwind: "$authorData" },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        image: 1,
        preptimeSeconds: 1,
        cooktimeSeconds: 1,
        aggregateRating: 1,
        ratingCount: 1,
        isPublished: 1,
        author: {
          _id: "$authorData._id",
          username: "$authorData.username",
          displayName: "$authorData.displayName",
        },
      },
    },
    { $sample: { size: GLOBAL_LIMIT } },
  ]);

  return populateRecipePreview(holidayRecipes);
}

// Helper function to get random recipes
export async function getRandomRecipes() {
  const randomRecipes = await Recipe.aggregate([
    { $match: { isPublished: true } },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    },
    { $unwind: "$authorData" },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        image: 1,
        preptimeSeconds: 1,
        cooktimeSeconds: 1,
        aggregateRating: 1,
        ratingCount: 1,
        isPublished: 1,
        author: {
          _id: "$authorData._id",
          username: "$authorData.username",
          displayName: "$authorData.displayName",
        },
      },
    },
    { $sample: { size: GLOBAL_LIMIT } },
  ]);

  return populateRecipePreview(randomRecipes);
}

// Get the most up to date homepage data
export async function getHomepageData(user) {
  // If there is a user, get their favorite recipes
  const favoriteRecipes = user ? await getFavoriteRecipes(user) : [];

  // Check if the most recent highest rated recipes need to be updated (should be updated hourly)
  const today = new Date().toDateString();
  const now = new Date().getTime();
  if (
    mostRecentHighestRatedLastUpdated + ONE_HOUR < now ||
    !mostRecentHighestRatedCache
  ) {
    mostRecentHighestRatedLastUpdated = now;
    mostRecentHighestRatedCache = await getMostRecentHighestRatedRecipes(today);
  }

  // Check if the seasons and holidays need to be updated (should be updated daily)
  if (seasonsLastUpdated !== today || !seasonalCache) {
    seasonsLastUpdated = today;
    seasonalCache = await getSeasonalRecipes(today);
  }
  if (holidaysLastUpdated !== today || !holidayCache) {
    holidaysLastUpdated = today;
    holidayCache = await getHolidayRecipes(today);
  }

  // Check if the random recipes need to be updated (should be updated daily)
  if (randomLastUpdated !== today || !randomCache) {
    randomLastUpdated = today;
    randomCache = await getRandomRecipes();
  }

  return {
    favoriteRecipes,
    mostRecentHighestRatedCache,
    seasonalCache,
    holidayCache,
    randomCache,
  };
}
