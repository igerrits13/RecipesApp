import { getPagination } from "../utils/getPagination.js";
import {
  buildRecipeFilters,
  fetchRecipes,
  populateRecipe,
} from "../queries/recipe.queries.js";
import {
  validateRecipeData,
  validateAndSaveNewRecipe,
  validateAndUpdateRecipe,
  updateRecipePublicationStatus,
  softDeleteRecipe,
  restoreDeletedRecipe,
  rateSpecificRecipe,
  removeRatingFromSpecificRecipe,
  getAllRecipeComments,
  validateAndAddComment,
} from "../services/recipe.services.js";

// Create a route for getting all recipes
export async function getAllRecipes(req, res) {
  try {
    // If there is an authenitcated user, get all recipes including theirs whether published or unpublished, otherwise only get published recipes.
    const isPublishedQuery = req.user
      ? { $or: [{ isPublished: true }, { author: req.user._id }] }
      : { isPublished: true };

    const isApprovedQuery = { isApproved: true };
    const isDeletedQuery = { isDeleted: false };

    // Get query information for what recipes to send
    const { page, limit, offset } = getPagination(req.query);
    const query = {
      ...buildRecipeFilters(req.query),
      ...isPublishedQuery,
      ...isApprovedQuery,
      ...isDeletedQuery,
    };

    // Get recipes from a specific author
    if (req.query.author) query.author = req.query.author;

    // Fetch the recipes using the built query and pagination info
    const result = await fetchRecipes({ query, page, limit, offset });

    // Send the recipes and page information in a response
    res.status(200).json({
      ...result,
      success: true,
      message: "Recipes fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
}

// Create a route for creating a new recipe
export async function createRecipe(req, res) {
  try {
    const validatedRecipe = validateRecipeData(req.body);

    // Confirm the request body has valid fields and save the new recipe to the database
    const recipe = await validateAndSaveNewRecipe({
      ...validatedRecipe,
      author: req.user._id,
    });

    const returnRecipe = await populateRecipe(recipe._id);

    // Send the recipe information
    res.status(201).json({
      recipe: returnRecipe,
      success: true,
      message: "Recipe created successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message ? error.message : "Internal server error",
    });
  }
}

// Create a route for getting a specified recipe
export async function getRecipe(req, res) {
  const recipe = await populateRecipe(req.recipe._id);

  try {
    res.status(200).json({
      recipe,
      success: true,
      message: "Recipe retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Create a route for updating a user's specified recipe
export async function updateRecipe(req, res) {
  try {
    const validatedRecipe = await validateRecipeData(req.body);

    // Confirm the request body has valid fields and update the recipe in the database
    const recipe = await validateAndUpdateRecipe({
      updatedRecipeData: validatedRecipe,
      oldRecipe: req.recipe,
      userId: req.user._id,
    });

    const returnRecipe = await populateRecipe(recipe._id);

    res.status(200).json({
      recipe: returnRecipe,
      success: true,
      message: "Recipe updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for updating the publication status of a user's specified recipe (negate the current status)
export async function publishRecipe(req, res) {
  try {
    const recipe = await updateRecipePublicationStatus(
      req.recipe,
      req.user._id,
    );

    const returnRecipe = await populateRecipe(recipe);

    res.status(200).json({
      recipe: returnRecipe,
      success: true,
      message: `Recipe ${req.recipe.isPublished ? "published" : "unpublished"} successfully`,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for soft deleting a user's specified recipe
export async function deleteRecipe(req, res) {
  try {
    await softDeleteRecipe(req.recipe, req.user._id);

    res
      .status(200)
      .json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for restoring a user's specified deleted recipe
export async function restoreRecipe(req, res) {
  try {
    const recipeSlug = req.params.recipeSlug;

    const recipe = await restoreDeletedRecipe(recipeSlug, req.user._id);

    const returnRecipe = await populateRecipe(recipe._id);

    res.status(200).json({
      recipe: returnRecipe,
      success: true,
      message: "Recipe restored successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for adding a rating to a specified recipe
export async function rateRecipe(req, res) {
  try {
    const rating = req.body.rating;

    const recipe = await rateSpecificRecipe(req.recipe, req.user._id, rating);

    const returnRecipe = await populateRecipe(recipe._id);

    res.status(200).json({
      recipe: returnRecipe,
      success: true,
      message: "Recipe rated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for removing a rating from a specified recipe
export async function removeRatingFromRecipe(req, res) {
  try {
    const recipe = await removeRatingFromSpecificRecipe(
      req.recipe,
      req.user._id,
    );

    const returnRecipe = await populateRecipe(recipe._id);

    res.status(200).json({
      recipe: returnRecipe,
      success: true,
      message: "Rating removed successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting the current recipe's comments
export async function getRecipeCommentsById(req, res) {
  try {
    const authorId = req.user ? req.user._id : null;
    const recipe = req.recipe;

    // Get query information for comments to send
    const { page, limit, offset } = getPagination(req.query);

    const comments = await getAllRecipeComments({
      authorId,
      recipe,
      page,
      limit,
      offset,
    });

    res.status(200).json({
      comments,
      success: true,
      message: "Comments retrieved successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for posting a new comment
export async function createCommentByRecipeId(req, res) {
  try {
    const authorId = req.user._id;
    const recipe = req.recipe;
    const { content, parentCommentId } = req.body;

    const comment = await validateAndAddComment({
      authorId,
      recipe,
      content,
      parentCommentId,
    });

    res.status(201).json({
      comment,
      success: true,
      message: "Comment created successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
