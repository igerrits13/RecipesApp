import mongoose from "mongoose";

import User from "../models/user.model.js";
import Recipe from "../models/recipe.model.js";

// Verify that a given parameter is a valid MongoDB ObjectId
export function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }
    next();
  };
}

// Verify that a user with the given username exists
export function validateUserExists(username) {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.params[username] })
        .select("+isDeleted")
        .lean();

      if (!user || user.isDeleted) {
        // return res.status(404).json({
        //   success: false,
        //   message: "User not found",
        // });
        const err = new Error("User not found");
        err.statusCode = 404;
        return next(err);
      }

      next();
    } catch (error) {
      error.statusCode = error.statusCode || 500;
      return next(error);
    }
  };
}

// Verity that a recipe with the given slug exists and is either authored by the current user or is published
export function validateRecipeExists(recipeSlug) {
  return async (req, res, next) => {
    try {
      const recipe = await Recipe.findOne({
        slug: req.params[recipeSlug],
        isDeleted: false,
        isApproved: true,
        $or: [{ author: req.user?._id }, { isPublished: true }],
      });

      if (!recipe) {
        // return res.status(404).json({
        //   success: false,
        //   message: "Recipe not found",
        // });
        const err = new Error("Recipe not found");
        err.statusCode = 404;
        return next(err);
      }

      req.recipe = recipe;

      next();
    } catch (error) {
      error.statusCode = error.statusCode || 500;
      return next(error);
    }
  };
}
