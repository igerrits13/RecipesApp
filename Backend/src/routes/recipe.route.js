import express from "express";
import {
  optionalProtectRoute,
  protectRoute,
} from "../middleware/auth.middleware.js";
import { validateRecipeExists } from "../middleware/validation.middleware.js";
import {
  getAllRecipes,
  createRecipe,
  getRecipe,
  updateRecipe,
  publishRecipe,
  deleteRecipe,
  restoreRecipe,
  rateRecipe,
  removeRatingFromRecipe,
  getRecipeCommentsById,
  createCommentByRecipeId,
} from "../controllers/recipe.controller.js";
import { checkBannedWord } from "../middleware/bannedWord.middleware.js";

// Create the router using express
const router = express.Router();

// Create a route for getting all recipes
router.get("/", optionalProtectRoute, getAllRecipes);

// Create a route for creating a new recipe
router.post(
  "/",
  checkBannedWord(
    [
      "title",
      "description",
      "ingredientSections",
      "stepSections",
      "notes",
      "tags",
      "holidays",
      "seasons",
    ],
    true,
  ),
  protectRoute,
  createRecipe,
);

// Create a route for getting a specified recipe
router.get(
  "/:recipeSlug",
  optionalProtectRoute,
  validateRecipeExists("recipeSlug"),
  getRecipe,
);

// Create a route for updating a user's specified recipe
router.put(
  "/:recipeSlug",
  checkBannedWord(
    [
      "title",
      "description",
      "ingredientSections",
      "stepSections",
      "notes",
      "tags",
      "holidays",
      "seasons",
    ],
    true,
  ),
  protectRoute,
  validateRecipeExists("recipeSlug"),
  updateRecipe,
);

// Create a route for updating the publication status of a user's specified recipe (negate the current status)
router.patch(
  "/:recipeSlug/publish",
  protectRoute,
  validateRecipeExists("recipeSlug"),
  publishRecipe,
);

// Create a route for soft deleting a user's specified recipe
router.delete(
  "/:recipeSlug",
  protectRoute,
  validateRecipeExists("recipeSlug"),
  deleteRecipe,
);

// Create a route for restoring a user's specified deleted recipe
router.patch("/:recipeSlug/restore", protectRoute, restoreRecipe);

// Create a route for adding a rating to a specified recipe
router.post(
  "/:recipeSlug/rating",
  protectRoute,
  validateRecipeExists("recipeSlug"),
  rateRecipe,
);

// Create a route for removing a rating from a specified recipe
router.delete(
  "/:recipeSlug/rating",
  protectRoute,
  validateRecipeExists("recipeSlug"),
  removeRatingFromRecipe,
);

// Create a route for getting the current recipe's comments
router.get(
  "/:recipeSlug/comments",
  optionalProtectRoute,
  validateRecipeExists("recipeSlug"),
  getRecipeCommentsById,
);

// Create a route for posting a new comment to a specific recipe
router.post(
  "/:recipeSlug/comments",
  checkBannedWord(["content"], true),
  protectRoute,
  validateRecipeExists("recipeSlug"),
  createCommentByRecipeId,
);

export default router;
