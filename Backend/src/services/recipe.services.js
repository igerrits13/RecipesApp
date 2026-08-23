import { uploadPhoto, deletePhoto } from "../utils/photoUpload.js";
import { slugify } from "../utils/slugify.js";

import Recipe from "../models/recipe.model.js";
import Ingredient from "../models/ingredient.model.js";
import Measurement from "../models/measurement.model.js";
import Tag from "../models/tag.model.js";
import Cuisine from "../models/cuisine.model.js";
import Meal from "../models/meal.model.js";
import Holiday from "../models/holiday.model.js";
import Season from "../models/season.model.js";
import Rating from "../models/rating.model.js";
import Comment from "../models/comment.model.js";
import CommentVote from "../models/commentVote.model.js";
import Note from "../models/note.model.js";

import {
  attachUserVotesToComments,
  categorizeComments,
} from "./comment.services.js";
import { generateUniqueDeletedName } from "../utils/generateUnique.js";

const allowedLinkedRecipeTypes = ["component", "pairing", "variation"];
const allowedMeasurementUnits = [
  "teaspoon",
  "tablespoon",
  "cup",
  "pint",
  "quart",
  "gallon",
  "ounce",
  "fluid ounce",
  "pound",
  "milliliter",
  "liter",
  "gram",
  "kilogram",
  "a pinch",
  "a dash",
  "to taste",
];

// Helper function to validate that all object fields are filled in correctly
export function validateRecipeData(recipe) {
  let normalizedRecipe = {
    preptimeSeconds: recipe.preptimeSeconds,
    cooktimeSeconds: recipe.cooktimeSeconds,
    servings: recipe.servings,
  };

  const errors = [];

  // Confirm required fields are present
  if (
    recipe.title == null ||
    recipe.ingredientSections == null ||
    recipe.stepSections == null ||
    recipe.preptimeSeconds == null ||
    recipe.cooktimeSeconds == null ||
    recipe.servings == null
  ) {
    const err = new Error("Missing required recipe fields");
    pushUnique(errors, err.message);
  }

  normalizedRecipe.title = validateRecipeTitle(recipe.title, errors);
  normalizedRecipe.description = validateRecipeDescription(
    recipe.description,
    errors,
  );
  normalizedRecipe.ingredientSections = validateRecipeIngredients(
    recipe.ingredientSections,
    errors,
  );
  normalizedRecipe.stepSections = validateRecipeSteps(
    recipe.stepSections,
    errors,
  );
  validateRecipeTime(recipe.preptimeSeconds, recipe.cooktimeSeconds, errors);
  validateRecipeServings(recipe.servings, errors);
  normalizedRecipe.notes = validateRecipeNotes(recipe.notes, errors);
  normalizedRecipe.linkedRecipes = validateLinkedRecipesArray(
    recipe.linkedRecipes || [],
    recipe._id,
    errors,
  );
  normalizedRecipe.image = validateRecipeImage(recipe.image, errors);
  normalizedRecipe.source = recipe.source
    ? validateRecipeSource(recipe.source, errors)
    : null;
  normalizedRecipe.tags = validateRecipeArray({
    arr: recipe.tags || [],
    minLength: 2,
    maxLength: 50,
    maxArrayLength: 10,
    itemName: "Tags",
    errors,
  });
  normalizedRecipe.cuisines = validateRecipeArray({
    arr: recipe.cuisines || [],
    minLength: 2,
    maxLength: 50,
    maxArrayLength: 3,
    itemName: "Cuisines",
    errors,
  });
  normalizedRecipe.meals = validateRecipeArray({
    arr: recipe.meals || [],
    minLength: 2,
    maxLength: 50,
    maxArrayLength: 3,
    itemName: "Meals",
    errors,
  });
  normalizedRecipe.holidays = validateRecipeArray({
    arr: recipe.holidays || [],
    minLength: 2,
    maxLength: 50,
    maxArrayLength: 3,
    itemName: "Holidays",
    errors,
  });
  normalizedRecipe.seasons = validateRecipeArray({
    arr: recipe.seasons || [],
    minLength: 2,
    maxLength: 50,
    maxArrayLength: 3,
    itemName: "Seasons",
    errors,
  });
  normalizedRecipe.isPublished = recipe.isPublished || false;

  if (errors.length > 0) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return normalizedRecipe;
}

// Helper function to prevent duplicate error messages
function pushUnique(errors, message) {
  if (!errors.includes(message)) {
    errors.push(message);
  }
}

// Helper function to validate the recipe title
function validateRecipeTitle(title, errors) {
  if (
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.trim().length > 100
  ) {
    pushUnique(
      errors,
      "Title must be a string between 3 and 100 characters long",
    );
    return "";
  }

  return title.trim();
}

// Helper function to validate recipe description
function validateRecipeDescription(description, errors) {
  if (
    description &&
    (typeof description !== "string" || description.trim().length > 500)
  ) {
    pushUnique(
      errors,
      "Description must be a string and cannot exceed 500 characters",
    );
    return "";
  }

  return description ? description.trim() : "";
}

// Helper function to validate recipe ingredients
function validateRecipeIngredients(ingredientSections, errors) {
  // Validate structure and size of ingredient sections and ingredients, confirm all ingredient name lengths are valid and quantities are valid numbers
  if (!Array.isArray(ingredientSections)) {
    pushUnique(errors, "Ingredient sections must be an array");
    return [];
  }

  if (ingredientSections.length === 0) {
    pushUnique(errors, "A recipe must have at least one ingredient section");
    return [];
  }

  if (ingredientSections.length > 5) {
    pushUnique(errors, "A recipe cannot have more than 5 ingredient sections");
    return [];
  }

  let validSections = [];

  // Verify each ingredient section has valid section title and ingredients, and that all ingredient names and quantities are valid
  for (const section of ingredientSections) {
    if (
      section.sectionTitle &&
      (typeof section.sectionTitle !== "string" ||
        section.sectionTitle.trim().length > 100)
    ) {
      pushUnique(
        errors,
        "Ingredient section titles must be a string and cannot exceed 100 characters",
      );
      return [];
    }

    if (!Array.isArray(section.ingredients)) {
      pushUnique(errors, "Ingredients must be an array");
      return [];
    }

    const validIngredients = section.ingredients
      .filter(
        (item) =>
          typeof item.ingredient === "string" &&
          item.ingredient.trim().length !== 0,
      )
      .map((item) => ({
        ...item,
        ingredient: item.ingredient.trim(),
        measurement: item.measurement ? item.measurement.trim() : null,
      }));

    if (validIngredients.length === 0) {
      pushUnique(errors, "A recipe must have at least one ingredient");
      return [];
    }

    if (validIngredients.length > 50) {
      pushUnique(errors, "A recipe cannot have more than 50 ingredients");
      return [];
    }

    // confirm all ingredient name lengths are valid and quantities are valid numbers
    validIngredients.forEach((item) => {
      if (item.ingredient.length < 2 || item.ingredient.length > 100) {
        pushUnique(
          errors,
          "Ingredient names must be a string between 2 and 100 characters long",
        );
        return [];
      }

      if (item.quantity !== null && (item.quantity < 0 || item.quantity > 99)) {
        pushUnique(errors, "Ingredient quantities must be between 0 and 99");
        return [];
      }

      if (
        item.measurement &&
        !allowedMeasurementUnits.includes(item.measurement)
      ) {
        pushUnique(errors, "Invalid measurement unit");
        return [];
      }

      if (item.additionalInfo) {
        if (
          typeof item.additionalInfo !== "string" ||
          item.additionalInfo.trim().length > 100
        ) {
          pushUnique(
            errors,
            "Additional information for ingredients must be a string and cannot exceed 100 characters",
          );
          return [];
        } else item.additionalInfo = item.additionalInfo.trim();
      }
    });

    validSections.push({
      sectionTitle: section.sectionTitle ? section.sectionTitle.trim() : "",
      ingredients: validIngredients,
    });
  }

  return validSections;
}

// Helper function to validate recipe steps
function validateRecipeSteps(stepSections, errors) {
  // Validate structure and size of step sections and steps, confirm all step lengths are valid
  if (!Array.isArray(stepSections)) {
    pushUnique(errors, "Step sections must be an array");
    return [];
  }

  if (stepSections.length === 0) {
    pushUnique(errors, "A recipe must have at least one step section");
    return [];
  }

  if (stepSections.length > 5) {
    pushUnique(errors, "A recipe cannot have more than 5 step sections");
    return [];
  }

  let validSections = [];

  // Verify each step section has valid section title and steps, and that all steps are valid
  for (const section of stepSections) {
    if (
      section.sectionTitle &&
      (typeof section.sectionTitle !== "string" ||
        section.sectionTitle.trim().length > 100)
    ) {
      pushUnique(
        errors,
        "Step section titles must be a string and cannot exceed 100 characters",
      );
      return [];
    }

    if (!Array.isArray(section.steps)) {
      pushUnique(errors, "Steps must be an array");
      return [];
    }

    const validSteps = section.steps
      .filter((step) => typeof step === "string" && step.trim().length !== 0)
      .map((step) => step.trim());

    if (validSteps.length === 0) {
      pushUnique(errors, "A recipe must have at least one step");
      return [];
    }

    if (validSteps.length > 50) {
      pushUnique(errors, "A recipe cannot have more than 50 steps");
      return [];
    }

    // Confirm all step lengths are valid
    validSteps.forEach((step) => {
      if (step.length < 3 || step.length > 500) {
        pushUnique(
          errors,
          "Each step must be between 3 and 500 characters long",
        );
        return [];
      }
    });

    validSections.push({
      sectionTitle: section.sectionTitle ? section.sectionTitle.trim() : "",
      steps: validSteps,
    });
  }

  return validSections;
}

// Helper function to validate recipe prep time and cook time
function validateRecipeTime(preptimeSeconds, cooktimeSeconds, errors) {
  if (
    typeof preptimeSeconds !== "number" ||
    preptimeSeconds < 0 ||
    preptimeSeconds > 86400
  ) {
    pushUnique(errors, "Prep time must be a number between 0 and 1 day");
  }

  if (
    typeof cooktimeSeconds !== "number" ||
    cooktimeSeconds < 0 ||
    cooktimeSeconds > 86400
  ) {
    pushUnique(errors, "Cook time must be a number between 0 and 1 day");
  }
}

// Helper function to validate recipe servings
function validateRecipeServings(servings, errors) {
  if (typeof servings !== "number" || servings < 0 || servings > 99) {
    pushUnique(errors, "Servings must be a number between 0 and 99");
  }
}

// Helper function to validate recipe notes
function validateRecipeNotes(notes, errors) {
  if (notes && (typeof notes !== "string" || notes.trim().length > 500)) {
    pushUnique(
      errors,
      "Notes must be a string and cannot exceed 500 characters",
    );
    return "";
  }

  return notes ? notes.trim() : "";
}

// Helper function to validate linked recipes
function validateLinkedRecipesArray(linkedRecipes, recipeId, errors) {
  if (linkedRecipes.length === 0) return [];

  if (!Array.isArray(linkedRecipes)) {
    pushUnique(errors, "Linked recipes must be an array");
    return [];
  }

  // Ensure all linked recipes are different from the current recipe and each other
  const recipeIds = linkedRecipes.map((recipe) => {
    if (!recipe.recipeId) {
      pushUnique(errors, "Each linked recipe must have a valid recipeId");
      return null;
    }
    if (!allowedLinkedRecipeTypes.includes(recipe.role)) {
      pushUnique(errors, "Each linked recipe must have a valid role");
      return null;
    }
    return recipe.recipeId;
  });

  const uniqueRecipeIds = new Set(recipeIds.filter((id) => id !== null));

  if (uniqueRecipeIds.size !== recipeIds.length) {
    pushUnique(errors, "Each linked recipe must be unique");
    return [];
  }

  if (recipeId && uniqueRecipeIds.has(recipeId.toString())) {
    pushUnique(errors, "Recipe cannot link to itself");
    return [];
  }

  if (linkedRecipes.length > 3) {
    pushUnique(errors, "A recipe cannot have more than 3 linked recipes");
    return [];
  }

  return linkedRecipes;
}

// Helper function to validate recipe image
function validateRecipeImage(image, errors) {
  if (image && (typeof image !== "string" || image.trim().length > 2048)) {
    pushUnique(
      errors,
      "Image URL must be a string and cannot exceed 2048 characters",
    );
    return null;
  }
  return image ? image.trim() : null;
}

// Helper function to validate recipe source
function validateRecipeSource(source, errors) {
  // Ensure the source has a name
  if (!source.name) {
    pushUnique(errors, "Source must have a name");
    return null;
  }

  if (
    source.url &&
    (typeof source.url !== "string" || source.url.trim().length > 2048)
  ) {
    pushUnique(
      errors,
      "Source URL must be a string and cannot exceed 2048 characters",
    );
    return null;
  }

  if (
    source.name &&
    (typeof source.name !== "string" || source.name.trim().length > 100)
  ) {
    pushUnique(
      errors,
      "Source name must be a string and cannot exceed 100 characters",
    );
    return null;
  }

  if (
    source.note &&
    (typeof source.note !== "string" || source.note.trim().length > 100)
  ) {
    pushUnique(
      errors,
      "Source note must be a string and cannot exceed 100 characters",
    );
    return null;
  }

  return source;
}

// Helper function to validate recipe optional arrays
function validateRecipeArray({
  arr,
  minLength,
  maxLength,
  maxArrayLength,
  itemName,
  errors,
}) {
  if (!Array.isArray(arr)) {
    pushUnique(errors, `${itemName} must be an array`);
    return [];
  }

  if (arr.length > maxArrayLength) {
    pushUnique(
      errors,
      `A recipe cannot have more than ${maxArrayLength} ${itemName.toLowerCase()}`,
    );
    return [];
  }

  const validatedItems = arr.map((item) => {
    if (typeof item !== "string") {
      pushUnique(
        errors,
        `All ${itemName.toLowerCase()} must be in string format`,
      );
      return [];
    }

    const trimmedItem = item.trim();

    if (trimmedItem.length < minLength || trimmedItem.length > maxLength) {
      pushUnique(
        errors,
        `${itemName} must be between ${minLength} and ${maxLength} characters long`,
      );
      return [];
    }
    return trimmedItem;
  });

  // Ensure all items in the array are unique
  const uniqueItems = new Set(validatedItems);

  return Array.from(uniqueItems);
}

// Helper function to save any items to their respective collection that do not already exist
export async function saveNewCollection({
  newItems,
  collectionModel,
  getName,
  mapResults,
}) {
  // Normalize and filter to get all valid items
  const validItems = newItems
    .map((item) => ({
      originalItem: item,
      name: getName(item)?.trim().toLowerCase(),
    }))
    .filter((item) => item.name);

  if (validItems.length === 0) return [];

  const itemNames = validItems.map((item) => item.name);

  // Do not create any duplicate items in the collection
  const existingDocs = await collectionModel
    .find({ title: { $in: itemNames } })
    .lean();

  const existingItems = new Map(
    existingDocs.map((doc) => [doc.title, doc._id]),
  );

  // Get the list of items that need to be created in the collection
  const missingItems = itemNames.filter((name) => !existingItems.has(name));

  // Create the missing items in the collection
  let newDocs = [];
  if (missingItems.length > 0) {
    newDocs = await collectionModel.insertMany(
      missingItems.map((item) => ({ title: item })),
      { ordered: false },
    );
  }

  const allItems = new Map(newDocs.map((doc) => [doc.title, doc._id]));

  return validItems.map(({ originalItem, name }) => {
    const id = existingItems.get(name) || allItems.get(name);
    return mapResults ? mapResults(originalItem, id) : id;
  });
}

// Helper function to delete all comment votes for a specific comment ID and its child comment IDs
export async function deleteCommentVotesByCommentIds(commentIds) {
  // Get comment ID and all child comment IDs to delete their votes
  const commentIdsToDelete = Array.isArray(commentIds)
    ? commentIds
    : [commentIds];

  await CommentVote.deleteMany({ commentId: { $in: commentIdsToDelete } });
}

// Validate and save a new recipe
export async function validateAndSaveNewRecipe({
  title,
  description,
  ingredientSections,
  stepSections,
  preptimeSeconds,
  cooktimeSeconds,
  servings,
  image,
  notes,
  linkedRecipes,
  source,
  tags,
  cuisines,
  meals,
  holidays,
  seasons,
  isPublished,
  author,
}) {
  // Ensure the user does not already have a recipe with the same title
  const existingRecipe = await Recipe.findOne({
    title: title,
    author,
    isDeleted: false,
  }).lean();
  if (existingRecipe) {
    const err = new Error("You already have a recipe with this title");
    err.statusCode = 409;
    throw err;
  }

  // Upload the image to cloudinary if one was provided and update all collections
  const imageURL = await uploadPhoto(image);

  // Ensure the image url length is less than 2048 characters
  if (imageURL && imageURL.length > 2048) {
    const err = new Error("Image URL is too long");
    err.statusCode = 400;
    throw err;
  }

  // Get all new measurements to prepare for saving ingredients
  const measurementNames = ingredientSections.flatMap((section) =>
    section.ingredients
      .map((item) => item.measurement?.trim().toLowerCase())
      .filter((item) => item),
  );

  // Save all new measurements to prepare for saving ingredients
  const measurementDocs = await Measurement.find({
    title: { $in: measurementNames },
  });

  const measurementMap = new Map(
    measurementDocs.map((measurement) => [measurement.title, measurement._id]),
  );

  // Save all new ingredients for each section of the ingredient sections
  const ingredientSectionIds = [];

  for (const section of ingredientSections) {
    const ingredientIds = await saveNewCollection({
      newItems: section.ingredients,
      collectionModel: Ingredient,
      getName: (item) => item.ingredient,
      mapResults: (item, ingredientId) => ({
        quantity: item.quantity || null,
        // measurement: item.measurement || null,
        measurement: item.measurement
          ? measurementMap.get(item.measurement.trim().toLowerCase())
          : null,
        ingredient: ingredientId,
        additionalInfo: item.additionalInfo || "",
      }),
    });
    ingredientSectionIds.push({
      sectionTitle: section.sectionTitle,
      ingredients: ingredientIds,
    });
  }

  const tagIds = await saveNewCollection({
    newItems: tags || [],
    collectionModel: Tag,
    getName: (item) => item,
  });
  const cuisineIds = await saveNewCollection({
    newItems: cuisines || [],
    collectionModel: Cuisine,
    getName: (item) => item,
  });
  const mealIds = await saveNewCollection({
    newItems: meals || [],
    collectionModel: Meal,
    getName: (item) => item,
  });
  const holidayIds = await saveNewCollection({
    newItems: holidays || [],
    collectionModel: Holiday,
    getName: (item) => item,
  });
  const seasonIds = await saveNewCollection({
    newItems: seasons || [],
    collectionModel: Season,
    getName: (item) => item,
  });

  // Ensure all linked recipes exist and are published
  if (linkedRecipes && linkedRecipes.length > 0) {
    const recipeIds = linkedRecipes.map((recipe) => recipe.recipeId);

    const existingRecipes = await Recipe.find({
      _id: { $in: recipeIds },
      isPublished: true,
    }).lean();

    if (existingRecipes.length !== recipeIds.length) {
      const err = new Error(
        "One or more linked recipes do not exist or are not published",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Generate a unique slug
  const slug = await slugify(title, Recipe);

  // If the new recipe is valid, create a new recipe object
  const recipe = new Recipe({
    title,
    slug,
    description,
    ingredientSections: ingredientSectionIds,
    stepSections,
    preptimeSeconds,
    cooktimeSeconds,
    servings,
    image: imageURL,
    notes,
    linkedRecipes,
    source,
    tags: tagIds,
    cuisines: cuisineIds,
    meals: mealIds,
    holidays: holidayIds,
    seasons: seasonIds,
    isPublished,
    author,
  });

  // Save the newly created recipe
  await recipe.save();

  return recipe;
}

// Update an existing recipe with new data
export async function validateAndUpdateRecipe({
  updatedRecipeData,
  oldRecipe,
  userId,
}) {
  let newSlug = null;
  let imageURL = oldRecipe.image || "";

  // Confirm the user is the author of the recipe
  if (oldRecipe.author._id.toString() !== userId.toString()) {
    const err = new Error("You do not have permission to edit this recipe");
    err.statusCode = 403;
    throw err;
  }

  // Confirm title uniqueness if it is being updated
  if (
    updatedRecipeData.title !== undefined &&
    updatedRecipeData.title !== oldRecipe.title
  ) {
    newSlug = await slugify(updatedRecipeData.title, Recipe);
    const existingRecipe = await Recipe.findOne({
      title: updatedRecipeData.title,
      author: userId,
      isDeleted: false,
    });
    if (existingRecipe) {
      const err = new Error("You already have a recipe with this title");
      err.statusCode = 409;
      throw err;
    }
  }

  // Update the image if a new one is provided
  if (updatedRecipeData.image && updatedRecipeData.image !== oldRecipe.image) {
    try {
      imageURL = await uploadPhoto(updatedRecipeData.image);
    } catch (uploadError) {
      const err = new Error("Error uploading new recipe image");
      err.statusCode = 500;
      throw err;
    }
    if (oldRecipe.image && oldRecipe.image.includes("cloudinary")) {
      try {
        await deletePhoto(oldRecipe.image);
      } catch (deleteError) {
        const err = new Error("Error deleting old recipe image");
        err.statusCode = 500;
        throw err;
      }
    }
  }

  // Save all new ingredients for each section of the ingredient sections if the ingredient sections are being updated
  const ingredientSectionIds = [];

  // Get all new measurements to prepare for saving ingredients
  if (updatedRecipeData.ingredientSections !== undefined) {
    const measurementNames = updatedRecipeData.ingredientSections.flatMap(
      (section) =>
        section.ingredients
          .map((item) => item.measurement?.trim().toLowerCase())
          .filter((item) => item),
    );

    // Save all new measurements to prepare for saving ingredients
    const measurementDocs = await Measurement.find({
      title: { $in: measurementNames },
    });

    const measurementMap = new Map(
      measurementDocs.map((measurement) => [
        measurement.title,
        measurement._id,
      ]),
    );

    for (const section of updatedRecipeData.ingredientSections) {
      const ingredientIds = await saveNewCollection({
        newItems: section.ingredients,
        collectionModel: Ingredient,
        getName: (item) => item.ingredient,
        mapResults: (item, ingredientId) => ({
          quantity: item.quantity || null,
          // measurement: item.measurement || null,
          measurement: item.measurement
            ? measurementMap.get(item.measurement.trim().toLowerCase())
            : null,
          ingredient: ingredientId,
          additionalInfo: item.additionalInfo || "",
        }),
      });
      ingredientSectionIds.push({
        sectionTitle: section.sectionTitle,
        ingredients: ingredientIds,
      });
    }
  }

  // Save all new tags, cuisines, meals, holidays, and seasons if they are being updated
  const tagIds =
    updatedRecipeData.tags !== undefined
      ? await saveNewCollection({
          newItems: updatedRecipeData.tags,
          collectionModel: Tag,
          getName: (item) => item,
        })
      : oldRecipe.tags;

  const cuisineIds =
    updatedRecipeData.cuisines !== undefined
      ? await saveNewCollection({
          newItems: updatedRecipeData.cuisines,
          collectionModel: Cuisine,
          getName: (item) => item,
        })
      : oldRecipe.cuisines;

  const mealIds =
    updatedRecipeData.meals !== undefined
      ? await saveNewCollection({
          newItems: updatedRecipeData.meals,
          collectionModel: Meal,
          getName: (item) => item,
        })
      : oldRecipe.meals;

  const holidayIds =
    updatedRecipeData.holidays !== undefined
      ? await saveNewCollection({
          newItems: updatedRecipeData.holidays,
          collectionModel: Holiday,
          getName: (item) => item,
        })
      : oldRecipe.holidays;

  const seasonIds =
    updatedRecipeData.seasons !== undefined
      ? await saveNewCollection({
          newItems: updatedRecipeData.seasons,
          collectionModel: Season,
          getName: (item) => item,
        })
      : oldRecipe.seasons;

  // Update all applicable fields in the recipe object
  const recipe = await Recipe.findByIdAndUpdate(
    oldRecipe._id,
    {
      title:
        updatedRecipeData.title !== undefined
          ? updatedRecipeData.title
          : oldRecipe.title,
      slug: newSlug ? newSlug : oldRecipe.slug,
      description:
        updatedRecipeData.description !== undefined
          ? updatedRecipeData.description
          : oldRecipe.description,
      ingredientSections:
        ingredientSectionIds.length > 0
          ? ingredientSectionIds
          : oldRecipe.ingredientSections,
      stepSections:
        updatedRecipeData.stepSections !== undefined
          ? updatedRecipeData.stepSections
          : oldRecipe.stepSections,
      preptimeSeconds:
        updatedRecipeData.preptimeSeconds !== undefined
          ? updatedRecipeData.preptimeSeconds
          : oldRecipe.preptimeSeconds,
      cooktimeSeconds:
        updatedRecipeData.cooktimeSeconds !== undefined
          ? updatedRecipeData.cooktimeSeconds
          : oldRecipe.cooktimeSeconds,
      servings:
        updatedRecipeData.servings !== undefined
          ? updatedRecipeData.servings
          : oldRecipe.servings,
      image: imageURL,
      notes:
        updatedRecipeData.notes !== undefined
          ? updatedRecipeData.notes
          : oldRecipe.notes,
      linkedRecipes:
        updatedRecipeData.linkedRecipes !== undefined
          ? updatedRecipeData.linkedRecipes
          : oldRecipe.linkedRecipes,
      source:
        updatedRecipeData.source !== undefined
          ? updatedRecipeData.source
          : oldRecipe.source,
      tags: tagIds,
      cuisines: cuisineIds,
      meals: mealIds,
      holidays: holidayIds,
      seasons: seasonIds,
      isPublished:
        updatedRecipeData.isPublished !== undefined
          ? updatedRecipeData.isPublished
          : oldRecipe.isPublished,
    },
    { new: true },
  );

  return recipe;
}

// Update the publication status of the recipe (negate the current status)
export async function updateRecipePublicationStatus(recipe, userId) {
  // Ensure that the current user is the author of the recipe
  if (recipe.author._id.toString() !== userId.toString()) {
    const err = new Error("You do not have permission to update this recipe");
    err.statusCode = 403;
    throw err;
  }

  // Negate the current publication status and save the recipe
  recipe.isPublished = !recipe.isPublished;
  await recipe.save();

  return recipe;
}

// Update the recipe to be soft deleted
export async function softDeleteRecipe(recipe, userId) {
  // Ensure that the current user is the author of the recipe
  if (recipe.author._id.toString() !== userId.toString()) {
    const err = new Error("You do not have permission to delete this recipe");
    err.statusCode = 403;
    throw err;
  }

  // Soft delete the recipe by setting isDeleted to true and deletedAt to current date. Update title and slug to reflect that the recipe is now deleted
  recipe.isDeleted = true;
  recipe.deletedAt = new Date();
  recipe.isPublished = false;
  recipe.title = await generateUniqueDeletedName(
    recipe.title,
    recipe._id,
    "recipe",
  );
  recipe.slug = await slugify(`deleted-${recipe.slug}`, Recipe);

  // Delete any existing ratings for the recipe
  await Rating.deleteMany({ recipeId: recipe._id });

  // Delete any existing personal notes for the recipe
  await Note.deleteMany({ recipeId: recipe._id });

  // Delete all parent and child comments, as well as any votes on those comments, for the recipe
  const comments = await Comment.find({ recipeId: recipe._id });
  await deleteCommentVotesByCommentIds(comments.map((comment) => comment._id));
  await Comment.deleteMany({ recipeId: recipe._id });

  await recipe.save();
}

// Update the recipe to be restored from a soft deleted state
export async function restoreDeletedRecipe(recipeSlug, userId) {
  // Ensure the recipe exists and is currently soft deleted
  const recipe = await Recipe.findOne({
    slug: recipeSlug,
    isDeleted: true,
  });
  if (!recipe) {
    const err = new Error("Recipe not found or not deleted");
    err.statusCode = 404;
    throw err;
  }

  // Ensure that the current user is the author of the recipe
  if (recipe.author._id.toString() !== userId.toString()) {
    const err = new Error("You do not have permission to restore this recipe");
    err.statusCode = 403;
    throw err;
  }

  // Confirm the user does not already have a recipe with the same title
  const originalTitle = recipe.title.replace("[Deleted] ", "");

  const existingRecipeTitle = await Recipe.findOne({
    title: originalTitle,
    author: userId,
    isDeleted: false,
  });
  if (existingRecipeTitle) {
    const err = new Error("You already have a recipe with this title");
    err.statusCode = 409;
    throw err;
  }

  // Update the slug to be unique if a recipe with the same slug already exists, otherwise restore the original slug
  const originalSlug = recipe.slug.replace("-deleted", "");

  const existingRecipeSlug = await Recipe.findOne({
    slug: originalSlug,
  });
  if (existingRecipeSlug) {
    recipe.slug = await slugify(originalTitle, Recipe);
  } else {
    recipe.slug = originalSlug;
  }

  // Reset the soft delete fields
  recipe.isDeleted = false;
  recipe.deletedAt = null;
  recipe.isPublished = true;
  recipe.title = originalTitle;

  await recipe.save();

  return recipe;
}

// Add a new rating to the recipe from a user, or update the existing rating if the user has already rated the recipe
export async function rateSpecificRecipe(recipe, userId, rating) {
  // Ensure the user is not the author of the current recipe
  if (recipe.author._id.toString() === userId.toString()) {
    const err = new Error("You cannot rate your own recipe");
    err.statusCode = 403;
    throw err;
  }

  // Ensure the rating is a number between 1 and 5
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    const err = new Error("Rating must be a number between 1 and 5");
    err.statusCode = 400;
    throw err;
  }

  // Check if the user has already rated the recipe
  const existingRating = await Rating.findOne({
    recipeId: recipe._id,
    authorId: userId,
  });
  // If the user has already rated the recipe, update their existing rating and adjust the recipe's ratings accordingly
  if (existingRating) {
    const diff = rating - existingRating.rating;
    existingRating.rating = rating;
    await existingRating.save();

    recipe.totalRating = recipe.totalRating + diff;
    recipe.aggregateRating = recipe.totalRating / recipe.ratingCount;
    await recipe.save();
  }
  // If the user has not already rated the recipe, create a new rating and adjust the recipe's ratings accordingly
  else {
    const newRating = new Rating({
      recipeId: recipe._id,
      authorId: userId,
      rating,
    });
    await newRating.save();

    recipe.totalRating = recipe.totalRating + rating;
    recipe.ratingCount += 1;
    recipe.aggregateRating = recipe.totalRating / recipe.ratingCount;
    await recipe.save();
  }

  return recipe;
}

// Remove a user's rating from the recipe and adjust the recipe's ratings accordingly
export async function removeRatingFromSpecificRecipe(recipe, userId) {
  // Ensure the user has already rated the recipe
  const existingRating = await Rating.findOne({
    recipeId: recipe._id,
    authorId: userId,
  });
  if (!existingRating) {
    const err = new Error("You have not rated this recipe");
    err.statusCode = 404;
    throw err;
  }

  // Remove the rating and update the recipe's ratings
  await Rating.deleteOne({ _id: existingRating._id });

  recipe.totalRating = recipe.totalRating - existingRating.rating;
  recipe.ratingCount -= 1;
  recipe.aggregateRating =
    recipe.ratingCount > 0 ? recipe.totalRating / recipe.ratingCount : 0;
  await recipe.save();

  return recipe;
}

// Get all recipe comments with pagination
export async function getAllRecipeComments({
  authorId,
  recipe,
  page,
  limit,
  offset,
}) {
  // Get all parent comments
  const allParentComments = await Comment.find({
    recipeId: recipe._id,
    parentCommentId: null,
    isDeleted: false,
  })
    .populate("authorId", "displayName profileImage isBanned isDeleted")
    .sort({ createdAt: -1 });

  // Filter out any comments where the user is banned
  const filteredParentComments = allParentComments.filter(
    (comment) => comment.authorId && !comment.authorId.isBanned,
  );

  // Apply pagination to the filtered parent comments and get the count of total comments after filtering
  const parentComments = filteredParentComments.slice(
    (page - 1) * limit + offset,
    (page - 1) * limit + limit + offset,
  );
  const totalComments = filteredParentComments.length;

  // Get all replies to the parent comments, sorted by most recent first
  const replies = await Comment.find({
    parentCommentId: { $in: parentComments.map((comment) => comment._id) },
    isDeleted: false,
  })
    .populate("authorId", "displayName profileImage isBanned isDeleted")
    .sort({ createdAt: -1 });

  // Categorize the parent comments and their replies into a nested structure
  let categorizedComments = categorizeComments([...parentComments, ...replies]);

  // If the user is authenticated, attach the user's vote type to each comment in the nested structure
  if (authorId) {
    categorizedComments = await attachUserVotesToComments(
      categorizedComments,
      authorId,
    );
  }

  return {
    comments: categorizedComments,
    currentPage: page,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
  };
}

// Validate comment content and parent comment, then create the comment
export async function validateAndAddComment({
  authorId,
  recipe,
  content,
  parentCommentId,
}) {
  // Ensure the content is not empty and does not exceed the maximum length
  if (
    typeof content !== "string" ||
    content.trim().length < 1 ||
    content.trim().length > 500
  ) {
    const err = new Error("Comment must be between 1 and 500 characters");
    err.statusCode = 400;
    throw err;
  }

  // If a parent comment ID is provided, ensure the parent comment exists and belongs to the same recipe
  if (parentCommentId) {
    const parentComment = await Comment.findOne({
      _id: parentCommentId,
      recipeId: recipe._id,
      isDeleted: false,
    });

    if (!parentComment) {
      const err = new Error("Parent comment not found");
      err.statusCode = 404;
      throw err;
    }

    // Only allow one level of nesting for replies, so if the parent comment is already a reply to another comment, throw an error
    if (parentComment.parentCommentId) {
      const err = new Error("Cannot reply to a child comment");
      err.statusCode = 400;
      throw err;
    }
  }

  // Create and save the new comment to the database
  let newComment = await Comment.create({
    authorId,
    recipeId: recipe._id,
    content: content.trim(),
    parentCommentId: parentCommentId || null,
  });

  // Get the newly created comment with populated user and recipe fields
  newComment = await Comment.findById(newComment._id).populate(
    "authorId",
    "displayName profileImage",
  );

  return newComment;
}
