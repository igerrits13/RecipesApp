import Recipe from "../../models/recipe.model.js";

// Get all recipes that have been soft deleted with pagination
export async function getAllDeletedRecipes(page, limit, offset) {
  const totalRecipes = await Recipe.countDocuments({ isDeleted: true });

  // Get the soft deleted recipes with pagination, showing the oldest deleted recipes first
  const deletedRecipes = await Recipe.find({ isDeleted: true })
    .select("+reportCount")
    .populate("author", "displayName profileImage")
    .sort({ createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    deletedRecipes,
    currentPage: page,
    totalRecipes,
    totalPages: Math.ceil(totalRecipes / limit),
  };
}

// Get all recipes that have not been approved with pagination
export async function getAllUnapprovedRecipes(page, limit, offset) {
  const totalRecipes = await Recipe.countDocuments({
    isApproved: false,
    isDeleted: false,
  });

  // Get the unapproved recipes with pagination, showing the oldest unapproved recipes first
  const unapprovedRecipes = await Recipe.find({
    isApproved: false,
    isDeleted: false,
  })
    .select("+reportCount")
    .populate("author", "displayName profileImage")
    .sort({ createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    unapprovedRecipes,
    currentPage: page,
    totalRecipes,
    totalPages: Math.ceil(totalRecipes / limit),
  };
}

// Approve the recipe by setting isApproved to true
export async function approveRecipeById(recipeId) {
  // Ensure the recipe exists and is not already approved or deleted
  const recipe = await Recipe.findById(recipeId).select("isDeleted");

  if (!recipe || recipe.isDeleted) {
    const error = new Error("Recipe not found");
    error.statusCode = 404;
    throw error;
  }

  if (recipe.isApproved) {
    return; // Recipe is already approved, no action needed
  }

  // Approve the recipe
  recipe.isApproved = true;
  await recipe.save();
}

// Get all recipes that have been reported with pagination
export async function getAllReportedRecipes(page, limit, offset) {
  const totalRecipes = await Recipe.countDocuments({
    reportCount: { $gt: 0 },
    isDeleted: false,
  });

  // Get the reported recipes with pagination, showing the most reported recipes first and then the oldest recipes first
  const reportedRecipes = await Recipe.find({
    reportCount: { $gt: 0 },
    isDeleted: false,
  })
    .select("+reportCount")
    .populate("author", "displayName profileImage")
    .sort({ reportCount: -1, createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    reportedRecipes,
    currentPage: page,
    totalRecipes,
    totalPages: Math.ceil(totalRecipes / limit),
  };
}
