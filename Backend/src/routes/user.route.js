import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  validateObjectId,
  validateUserExists,
} from "../middleware/validation.middleware.js";
import {
  getUserProfile,
  getUserComments,
  getUserNotes,
  updateUserDisplayName,
  updateUserEmail,
  updateUserPassword,
  updateUserProfileImage,
  updateUserProfileBackgroundImage,
  getUserRecipes,
  getUserFavoriteRecipes,
  addUserFavoriteRecipe,
  removeUserFavoriteRecipe,
  getUserFavoriteCuisines,
  addUserFavoriteCuisine,
  removeUserFavoriteCuisine,
  getUserAllergies,
  addUserAllergy,
  removeUserAllergy,
  getUserShoppingList,
  addUserShoppingListItem,
  removeUserShoppingListItem,
  deleteUserAccount,
  getUserProfileByUsername,
  getUserRecipesByUsername,
} from "../controllers/user.controller.js";
import { checkBannedWord } from "../middleware/bannedWord.middleware.js";

// Create the router using express
const router = express.Router();

// Create a route for getting the current user's profile
router.get("/me", protectRoute, getUserProfile);

// Create a route for getting the current user's comments
router.get("/me/comments", protectRoute, getUserComments);

// Create a route for getting the current user's personal notes
router.get("/me/notes", protectRoute, getUserNotes);

// Create a route for updating the current user's display name
router.put(
  "/me/display-name",
  checkBannedWord(["newUsername"], true),
  protectRoute,
  updateUserDisplayName,
);

// Create a route for updating the current user's email
router.put("/me/email", protectRoute, updateUserEmail);

// Create a route for updating the current user's password
router.put("/me/password", protectRoute, updateUserPassword);

// Create a route for updating the current user's profile image
router.put("/me/profile-image", protectRoute, updateUserProfileImage);

// Create a route for updating the current user's profile background image
router.put(
  "/me/profile-background-image",
  protectRoute,
  updateUserProfileBackgroundImage,
);

// Create a route for getting the current user's recipes
router.get("/me/recipes", protectRoute, getUserRecipes);

// Create a route for getting the current user's favorite recipes
router.get("/me/favorites", protectRoute, getUserFavoriteRecipes);

// Create a route for adding a new recipe to the current user's favorite recipes
router.post(
  "/me/favorites/:recipeId",
  protectRoute,
  validateObjectId("recipeId"),
  addUserFavoriteRecipe,
);

// Create a route for removing a recipe from the current user's favorite recipes
router.delete(
  "/me/favorites/:recipeId",
  protectRoute,
  validateObjectId("recipeId"),
  removeUserFavoriteRecipe,
);

// Create a route for getting the current user's favorite cuisines
router.get("/me/favorite-cuisines", protectRoute, getUserFavoriteCuisines);

// Create a route for adding a list of new favorite cuisines to the current user's favorite cuisines
router.post(
  "/me/favorite-cuisines",
  checkBannedWord(["newCuisines"], true),
  protectRoute,
  addUserFavoriteCuisine,
);

// Create a route for removing a list of favorite cuisines from the current user's favorite cuisines
router.delete("/me/favorite-cuisines", protectRoute, removeUserFavoriteCuisine);

// Create a route for getting the current user's alergies
router.get("/me/allergies", protectRoute, getUserAllergies);

// Create a route for adding a new allergy to the current user's alergies
router.post(
  "/me/allergies",
  checkBannedWord(["newIngredients"], true),
  protectRoute,
  addUserAllergy,
);

// Create a route for removing an allergy from the current user's alergies
router.delete("/me/allergies", protectRoute, removeUserAllergy);

// Create a route for getting the current user's shopping list
router.get("/me/shopping-list", protectRoute, getUserShoppingList);

// Create a route for adding an ingredient to the current user's shopping list
router.post(
  "/me/shopping-list",
  checkBannedWord(["newIngredients"], true),
  protectRoute,
  addUserShoppingListItem,
);

// Create a route for removing an ingredient from the current user's shopping list
router.delete("/me/shopping-list", protectRoute, removeUserShoppingListItem);

// Create a route for deleting the current user's account
router.delete("/me", protectRoute, deleteUserAccount);

// Create a route for getting another user's profile by username
router.get(
  "/:username",
  validateUserExists("username"),
  getUserProfileByUsername,
);

// Create a route for getting another user's recipes by username
router.get(
  "/:username/recipes",
  validateUserExists("username"),
  getUserRecipesByUsername,
);

export default router;
