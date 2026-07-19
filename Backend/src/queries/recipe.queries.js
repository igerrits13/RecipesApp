import mongoose from "mongoose";
import Recipe from "../models/recipe.model.js";

// Build recipe filters based on query parameters
export function buildRecipeFilters(queryParams) {
  const query = {};

  // Additional query filters if provided
  if (queryParams.tags) query.tags = queryParams.tags;
  if (queryParams.cuisines) query.cuisines = queryParams.cuisines;
  if (queryParams.meals) query.meals = queryParams.meals;
  if (queryParams.holidays) query.holidays = queryParams.holidays;
  if (queryParams.seasons) query.seasons = queryParams.seasons;

  return query;
}

// Fetch basic information for recipe card views based on query and pagination
export async function fetchRecipes({ query, page, limit, offset }) {
  // Get the total number of recipes matching the query
  const totalRecipes = await Recipe.countDocuments(query);

  // Create the array of recipes with the given query guidelines, most recent first with author information
  const recipes = await Recipe.find(query)
    .select(
      "title slug description image preptimeSeconds cooktimeSeconds author aggregateRating ratingCount isPublished isApproved",
    )
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate({ path: "author", select: "displayName isDeleted" })
    .lean();

  // Map the recipes to the desired format
  const recipeList = populateRecipePreview(recipes);

  return {
    recipeList,
    currentPage: page,
    totalRecipes,
    totalPages: Math.ceil(totalRecipes / limit),
  };
}

// Helper function to populate a preview of a recipes for recipe card views
export function populateRecipePreview(recipes) {
  // Map the recipes to the desired format
  const recipeList = recipes.map((recipe) => ({
    _id: recipe._id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description || "",
    image: recipe.image || "",
    preptimeSeconds: recipe.preptimeSeconds,
    cooktimeSeconds: recipe.cooktimeSeconds,
    aggregateRating: recipe.aggregateRating,
    ratingCount: recipe.ratingCount,
    author:
      recipe.author?.displayName && !recipe.author.isDeleted
        ? {
            _id: recipe.author._id,
            username: recipe.author.username,
            displayName: recipe.author.displayName,
          }
        : { _id: null, username: null, displayName: "Deleted User" },
    isPublished: recipe.isPublished,
    isApproved: recipe.isApproved,
  }));
  return recipeList;
}

// Helper function to populate all important fields of a recipe for full recipe views
export async function populateRecipe(recipeId) {
  const recipe = await Recipe.findById(recipeId)
    .populate("ingredientSections.ingredients.measurement", "title")
    .populate("ingredientSections.ingredients.ingredient", "title")
    .populate("author", "displayName profileImage isBanned isDeleted")
    .populate("tags", "title")
    .populate("cuisines", "title")
    .populate("meals", "title")
    .populate("holidays", "title")
    .populate("seasons", "title")
    .populate({
      path: "linkedRecipes.recipeId",
      select:
        "title slug description image preptimeSeconds cooktimeSeconds author aggregateRating ratingCount isPublished isApproved isDeleted",
      populate: {
        path: "author",
        select: "displayName profileImage isBanned isDeleted",
      },
    })
    .lean();

  if (!recipe) return null;

  // If the author of the recipe is banned or deleted, set the author name to "Deleted User", set the profile image to null and remove the isDeleted field
  if (!recipe.author) {
    recipe.author = {
      displayName: "Deleted User",
      profileImage: null,
    };
  } else if (recipe.author.isBanned || recipe.author.isDeleted) {
    recipe.author.displayName = "Deleted User";
    recipe.author.profileImage = null;
  }

  const { isDeleted, isBanned, ...authorWithoutIsDeleted } = recipe.author;
  recipe.author = authorWithoutIsDeleted;

  // Filter out any linked recipes that are deleted, unpublished or not approved
  recipe.linkedRecipes = recipe.linkedRecipes.filter(
    (linked) =>
      linked.recipeId &&
      !linked.recipeId.isDeleted &&
      linked.recipeId.isPublished &&
      linked.recipeId.isApproved,
  );

  // If any of the linked recipes have a banned or deleted author, set their author name to "Deleted User"
  recipe.linkedRecipes.forEach((linked) => {
    if (!linked.recipeId.author) {
      linked.recipeId.author = {
        displayName: "Deleted User",
        profileImage: null,
      };
    } else if (
      linked.recipeId.author.isBanned ||
      linked.recipeId.author.isDeleted
    ) {
      linked.recipeId.author.displayName = "Deleted User";
      linked.recipeId.author.profileImage = null;
    }

    const { isDeleted, isBanned, ...authorWithoutIsDeleted } =
      linked.recipeId.author;
    linked.recipeId.author = authorWithoutIsDeleted;
  });

  return recipe;
}
