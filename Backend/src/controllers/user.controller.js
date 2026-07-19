import { getPagination } from "../utils/getPagination.js";
import { buildRecipeFilters, fetchRecipes } from "../queries/recipe.queries.js";
import Tag from "../models/tag.model.js";
import Ingredient from "../models/ingredient.model.js";
import Cuisine from "../models/cuisine.model.js";
import {
  mapRecipeData,
  getCurrentUserComments,
  getCurrentUserNotes,
  validateNewDisplayName,
  validateNewEmail,
  validateNewPassword,
  validateNewProfileImage,
  addRecipeToCurrentUserCategory,
  removeRecipeFromCurrentUserCategory,
  getSpecifiedUserCollection,
  addSpecifiedUserCollectionItems,
  removeSpecifiedUserCollectionItems,
  deleteCurrentUserAccount,
  getOtherUserProfileByUsername,
  getOtherUserRecipesByUsername,
} from "../services/user.services.js";
import { sanitizeUser, sanitizeUserForPublic } from "../utils/sanitizeUser.js";

// Create a route for getting the current user's profile
export async function getUserProfile(req, res) {
  const user = req.user;

  // Get query information for recipes to send
  const { page, limit, offset } = getPagination(req.query);
  const usersQuery = {
    ...buildRecipeFilters(req.query),
    author: user._id,
    isDeleted: false,
  };

  const favoritesQuery = {
    ...buildRecipeFilters(req.query),
    _id: { $in: user.favoriteRecipes },
    $or: [
      { isPublished: true },
      { $and: [{ author: user._id }, { isDeleted: false }] },
    ],
  };

  // Fetch the recipes using the built query and pagination info
  const recipes = await fetchRecipes({
    query: usersQuery,
    page,
    limit,
    offset,
  });
  const favoriteRecipes = await fetchRecipes({
    query: favoritesQuery,
    page,
    limit,
    offset,
  });

  const favoriteCuisines = await getSpecifiedUserCollection({
    user: req.user,
    categoryName: "favoriteCuisines",
    categoryParameters: "title -_id",
  });

  const allergies = await getSpecifiedUserCollection({
    user: req.user,
    categoryName: "allergies",
    categoryParameters: "title -_id",
  });

  const shoppingList = await getSpecifiedUserCollection({
    user: req.user,
    categoryName: "shoppingList",
    categoryParameters: "title -_id",
  });

  try {
    res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        profileBackgroundImage: user.profileBackgroundImage,
        favoriteRecipes,
        favoriteCuisines,
        allergies,
        shoppingList,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      recipes,
      success: true,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.details || "Internal server error",
    });
  }
}

// Create a route for getting the current user's comments with pagination
export async function getUserComments(req, res) {
  try {
    const user = req.user;
    const { page, limit, offset } = getPagination(req.query);

    const comments = await getCurrentUserComments(user, page, limit, offset);

    res.status(200).json({
      comments,
      success: true,
      message: "User comments fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.details || "Internal server error",
    });
  }
}

// Create a route for getting the current user's personal notes with pagination
export async function getUserNotes(req, res) {
  try {
    const user = req.user;
    const { page, limit, offset } = getPagination(req.query);

    const notes = await getCurrentUserNotes(user, page, limit, offset);

    res.status(200).json({
      notes,
      success: true,
      message: "User notes fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.details || "Internal server error",
    });
  }
}

// Create a route for updating the current user's display name
export async function updateUserDisplayName(req, res) {
  try {
    const user = req.user;
    const { newDisplayName } = req.body;

    const updatedUser = await validateNewDisplayName(user, newDisplayName);

    res.status(200).json({
      user: sanitizeUser(updatedUser),
      success: true,
      message: "Display name updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating the current user's email
export async function updateUserEmail(req, res) {
  try {
    const user = req.user;
    const { newEmail } = req.body;

    // Update the email and save the user
    await validateNewEmail(user, newEmail);

    res.status(200).json({
      success: true,
      message: "Email updated successfully, please log in again",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating the current user's password
export async function updateUserPassword(req, res) {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    await validateNewPassword({ currentPassword, newPassword, user });

    res.status(200).json({
      success: true,
      message: "Password updated successfully, please log in again",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating the current user's profile image
export async function updateUserProfileImage(req, res) {
  try {
    const user = req.user;
    const { profileImage } = req.body;

    const updatedUser = await validateNewProfileImage(
      profileImage,
      user,
      "profileImage",
    );

    res.status(200).json({
      user: sanitizeUser(updatedUser),
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating the current user's profile background image
export async function updateUserProfileBackgroundImage(req, res) {
  try {
    const user = req.user;
    const { profileImage } = req.body;

    const updatedUser = await validateNewProfileImage(
      profileImage,
      user,
      "profileBackgroundImage",
    );

    res.status(200).json({
      user: sanitizeUser(updatedUser),
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current user's recipes
export async function getUserRecipes(req, res) {
  try {
    const user = req.user;

    // Get query information for recipes to send
    const { page, limit, offset } = getPagination(req.query);

    const query = {
      ...buildRecipeFilters(req.query),
      author: user._id,
      isDeleted: false,
    };

    // Fetch the recipes using the built query and pagination info
    const result = await fetchRecipes({ query, page, limit, offset });

    res.status(200).json({
      ...result,
      success: true,
      message: "User recipes fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current user's favorite recipes
export async function getUserFavoriteRecipes(req, res) {
  try {
    const user = req.user;

    // Get query information for recipes to send
    const { page, limit, offset } = getPagination(req.query);
    const query = {
      ...buildRecipeFilters(req.query),
      _id: { $in: user.favoriteRecipes },
      $or: [
        { isPublished: true },
        { $and: [{ author: user._id }, { isDeleted: false }] },
      ],
    };

    // Fetch the recipes using the built query and pagination info
    const result = await fetchRecipes({ query, page, limit, offset });

    res.status(200).json({
      ...result,
      success: true,
      message: "User favorite recipes fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.details || "Internal server error",
    });
  }
}

// Create a route for adding a new recipe to the current user's favorite recipes
export async function addUserFavoriteRecipe(req, res) {
  try {
    const user = req.user;
    const { recipeId } = req.params;

    const updatedUser = await addRecipeToCurrentUserCategory(
      user,
      recipeId,
      "favoriteRecipes",
    );

    const favoriteRecipes = await mapRecipeData(updatedUser.favoriteRecipes);

    res.status(200).json({
      favoriteRecipes,
      success: true,
      message: "Recipe added to favorite recipes successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for removing a recipe from the current user's favorite recipes
export async function removeUserFavoriteRecipe(req, res) {
  try {
    const user = req.user;
    const { recipeId } = req.params;

    const updatedUser = await removeRecipeFromCurrentUserCategory(
      user,
      recipeId,
      "favoriteRecipes",
    );

    const recipeList = await mapRecipeData(updatedUser.favoriteRecipes);

    res.status(200).json({
      favoriteRecipes: recipeList,
      success: true,
      message: "Recipe removed from favorite recipes successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current user's favorite cuisines
export async function getUserFavoriteCuisines(req, res) {
  try {
    const favoriteCuisines = await getSpecifiedUserCollection({
      user: req.user,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
    });

    res.status(200).json({
      favoriteCuisines,
      success: true,
      message: "User favorite cuisines fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for adding a list of new favorite cuisines to the current user's favorite cuisines
export async function addUserFavoriteCuisine(req, res) {
  try {
    const user = req.user;
    const { newCuisines } = req.body;

    const cuisines = await addSpecifiedUserCollectionItems({
      user,
      newItems: newCuisines,
      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    res.status(200).json({
      favoriteCuisines: cuisines,
      success: true,
      message: "Cuisines added to favorite cuisines successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for removing a favorite cuisine from the current user's favorite cuisines
export async function removeUserFavoriteCuisine(req, res) {
  try {
    const user = req.user;
    const { oldCuisines } = req.body;

    const cuisines = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: oldCuisines,
      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    res.status(200).json({
      favoriteCuisines: cuisines,
      success: true,
      message: "Cuisines removed from favorite cuisines successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current user's alergies
export async function getUserAllergies(req, res) {
  try {
    const allergies = await getSpecifiedUserCollection({
      user: req.user,
      categoryName: "allergies",
      categoryParameters: "title -_id",
    });

    res.status(200).json({
      allergies,
      success: true,
      message: "User allergies fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for adding a new allergy to the current user's alergies
export async function addUserAllergy(req, res) {
  try {
    const user = req.user;
    const { newIngredients } = req.body;

    const ingredients = await addSpecifiedUserCollectionItems({
      user,
      newItems: newIngredients,
      collectionModel: Ingredient,
      categoryName: "allergies",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    res.status(200).json({
      allergies: ingredients,
      success: true,
      message: "Allergies added to user allergies successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for removing an allergy from the current user's alergies
export async function removeUserAllergy(req, res) {
  try {
    const user = req.user;
    const { oldIngredients } = req.body;

    const ingredients = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: oldIngredients,
      collectionModel: Ingredient,
      categoryName: "allergies",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    res.status(200).json({
      allergies: ingredients,
      success: true,
      message: "Allergies removed from user allergies successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current user's shopping list
export async function getUserShoppingList(req, res) {
  try {
    const shoppingList = await getSpecifiedUserCollection({
      user: req.user,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
    });

    res.status(200).json({
      shoppingList,
      success: true,
      message: "User shopping list fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for adding an ingredient to the current user's shopping list
export async function addUserShoppingListItem(req, res) {
  try {
    const user = req.user;
    const { newIngredients } = req.body;

    const ingredients = await addSpecifiedUserCollectionItems({
      user,
      newItems: newIngredients,
      collectionModel: Ingredient,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    res.status(200).json({
      shoppingList: ingredients,
      success: true,
      message: "Items added to shopping list successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for removing an ingredient from the current user's shopping list
export async function removeUserShoppingListItem(req, res) {
  try {
    const user = req.user;
    const { oldIngredients } = req.body;

    const ingredients = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: oldIngredients,
      collectionModel: Ingredient,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    res.status(200).json({
      shoppingList: ingredients,
      success: true,
      message: "Items removed from shopping list successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting the current user's account
export async function deleteUserAccount(req, res) {
  try {
    const user = req.user;

    await deleteCurrentUserAccount(user);

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting another user's profile by username
export async function getUserProfileByUsername(req, res) {
  try {
    const { username } = req.params;

    const publicUser = await getOtherUserProfileByUsername(username);
    const recipes = await getOtherUserRecipesByUsername(username, req.query);

    res.status(200).json({
      user: sanitizeUserForPublic(publicUser),
      recipes,
      success: true,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting another user's recipes by username
export async function getUserRecipesByUsername(req, res) {
  try {
    const { username } = req.params;

    const result = await getOtherUserRecipesByUsername(username, req.query);

    res.status(200).json({
      ...result,
      success: true,
      message: "User recipes fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
