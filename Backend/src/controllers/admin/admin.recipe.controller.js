import Recipe from "../../models/recipe.model.js";

import {
  approveRecipeById,
  getAllDeletedRecipes,
  getAllReportedRecipes,
  getAllUnapprovedRecipes,
} from "../../services/admin/admin.recipe.services.js";

import { getPagination } from "../../utils/getPagination.js";

// Create a route for getting all soft deleted recipes
export async function getDeletedRecipes(req, res) {
  try {
    // Get query information for recipes to send
    const { page, limit, offset } = getPagination(req.query);

    const recipes = await getAllDeletedRecipes(page, limit, offset);

    res.status(200).json({ success: true, recipes });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting all unapproved recipes
export async function getUnapprovedRecipes(req, res) {
  try {
    // Get query information for recipes to send
    const { page, limit, offset } = getPagination(req.query);

    const recipes = await getAllUnapprovedRecipes(page, limit, offset);

    res.status(200).json({ success: true, recipes });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for approving a recipe by id
export async function approveRecipe(req, res) {
  try {
    const { id } = req.params;

    await approveRecipeById(id);

    res
      .status(200)
      .json({ success: true, message: "Recipe approved successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting all reported recipes
export async function getReportedRecipes(req, res) {
  try {
    // Get query information for recipes to send
    const { page, limit, offset } = getPagination(req.query);

    const recipes = await getAllReportedRecipes(page, limit, offset);

    res.status(200).json({ success: true, recipes });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting a recipe permanently by id
export async function deleteRecipePermanently(req, res) {
  try {
    await Recipe.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
