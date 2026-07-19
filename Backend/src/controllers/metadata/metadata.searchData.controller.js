import User from "../../models/user.model.js";
import Recipe from "../../models/recipe.model.js";
import Ingredient from "../../models/ingredient.model.js";
import Season from "../../models/season.model.js";
import Holiday from "../../models/holiday.model.js";
import Tag from "../../models/tag.model.js";
import Cuisine from "../../models/cuisine.model.js";
import Meal from "../../models/meal.model.js";

// Create a route for getting all basic search data
export async function getSearchData(req, res) {
  try {
    // If there is an authenitcated user, get all recipes including theirs whether published or unpublished, otherwise only get published recipes.
    const isPublishedQuery = req.user
      ? { $or: [{ isPublished: true }, { author: req.user._id }] }
      : { isPublished: true };

    const isDeletedQuery = { isDeleted: false };

    // Get query information for all searchable data
    const [
      userNames,
      recipeNames,
      ingredientNames,
      seasonNames,
      holidayNames,
      tagNames,
      cuisineNames,
      mealNames,
    ] = await Promise.all([
      User.find({ isBanned: false, isDeleted: false })
        .select("_id displayName profileImage")
        .lean(),
      Recipe.find({
        ...isPublishedQuery,
        ...isDeletedQuery,
      })
        .select("_id title slug image isPublished")
        .populate("author", "_id displayName")
        .lean(),
      Ingredient.find().select("_id title indexItem").lean(),
      Season.find().select("_id title").lean(),
      Holiday.find().select("_id title").lean(),
      Tag.find().select("_id title").lean(),
      Cuisine.find().select("_id title").lean(),
      Meal.find().select("_id title").lean(),
    ]);

    res.status(200).json({
      userNames,
      recipeNames,
      ingredientNames,
      seasonNames,
      holidayNames,
      tagNames,
      cuisineNames,
      mealNames,
      message: "Retrieved search data",
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}
