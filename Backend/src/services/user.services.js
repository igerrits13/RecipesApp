import bcrypt from "bcryptjs";

import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Note from "../models/note.model.js";
import Recipe from "../models/recipe.model.js";
import Rating from "../models/rating.model.js";

import { AuthError } from "../errors/auth.errors.js";
import { getPagination } from "../utils/getPagination.js";
import { uploadPhoto, deletePhoto } from "../utils/photoUpload.js";
import { buildRecipeFilters, fetchRecipes } from "../queries/recipe.queries.js";
import CommentVote from "../models/commentVote.model.js";
import {
  generateUniqueDeletedEmail,
  generateUniqueDeletedName,
} from "../utils/generateUnique.js";

const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;
const validRecipeCategories = ["favoriteRecipes"];
const validOtherCategories = ["favoriteCuisines", "allergies", "shoppingList"];

// Helper function to map the recipe's data
export async function mapRecipeData(recipeArray) {
  const recipeList = await Promise.all(
    recipeArray.map(async (recipe) => {
      const recipeData = await Recipe.findById(recipe._id).populate(
        "author",
        "username",
      );
      const currRecipe = {
        _id: recipeData._id,
        title: recipeData.title,
        description: recipeData.description,
        image: recipeData.image,
        preptimeSeconds: recipeData.preptimeSeconds,
        cooktimeSeconds: recipeData.cooktimeSeconds,
        aggregateRating: recipeData.aggregateRating,
        ratingCount: recipeData.ratingCount,
        author: recipeData.author.username,
      };
      return currRecipe;
    }),
  );

  return recipeList;
}

// Helper function to delete all user ratings
export async function deleteAllUserRatings(userId) {
  // Get all user ratings
  const ratings = await Rating.find({ authorId: userId });

  // Iterate over all ratings, updating the associated recipe's aggregate rating and rating count
  for (const rating of ratings) {
    const recipe = await Recipe.findByIdAndUpdate(
      rating.recipeId,
      {
        $inc: {
          ratingCount: -1,
          totalRating: -rating.rating,
        },
      },
      { new: true },
    );

    const newAggregateRating =
      recipe.ratingCount > 0 ? recipe.totalRating / recipe.ratingCount : 0;

    await Recipe.findByIdAndUpdate(rating.recipeId, {
      $set: {
        aggregateRating: newAggregateRating,
      },
    });
  }

  // Delete all ratings made by the user
  await Rating.deleteMany({ authorId: userId });
}

// Helper function to delete all user comment votes
export async function deleteAllUserCommentVotes(userId) {
  // Get all comments the user has voted on
  const commentVotes = await CommentVote.find({ authorId: userId });

  // Iterate over all comment votes, updating the associated comment's vote count
  for (const vote of commentVotes) {
    await Comment.findByIdAndUpdate(
      vote.commentId,
      {
        $inc: {
          aggregateVote: vote.voteType === "upvote" ? -1 : 1,
        },
      },
      { new: true },
    );
  }

  // Delete all comment votes made by the user
  await CommentVote.deleteMany({ authorId: userId });
}

// Get all comments made by the user and return them
export async function getCurrentUserComments(user, page, limit, offset) {
  // Get the total number of comments made by the user for pagination
  const totalComments = await Comment.countDocuments({ authorId: user._id });

  const comments = await Comment.find({ authorId: user._id })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    comments,
    currentPage: page,
    totalComments: totalComments,
    totalPages: Math.ceil(totalComments / limit),
  };
}

// Get all personal notes made by the user and return them
export async function getCurrentUserNotes(user, page, limit, offset) {
  // Get the total number of notes made by the user for pagination
  const totalNotes = await Note.countDocuments({ authorId: user._id });

  const notes = await Note.find({ authorId: user._id })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    notes,
    currentPage: page,
    totalNotes: totalNotes,
    totalPages: Math.ceil(totalNotes / limit),
  };
}

// Confirm new display name entered is allowed and save it
export async function validateNewDisplayName(user, newDisplayName) {
  // Ensure a new display name is provided
  if (!newDisplayName || newDisplayName.trim().length === 0) {
    const err = new Error("New display name is required");
    err.statusCode = 400;
    throw err;
  }

  // Ensure a valid display name format
  const normalizedDisplayName = newDisplayName.trim();
  if (normalizedDisplayName.length < 3 || normalizedDisplayName.length > 32) {
    const err = new Error("Display name must be between 3 and 32 characters");
    err.statusCode = 400;
    throw err;
  }

  // Ensure that the display name is different from the current one
  if (normalizedDisplayName === user.displayName) {
    const err = new Error(
      "New display name must be different from the current display name",
    );
    err.statusCode = 400;
    throw err;
  }

  // Check if the new display name is already taken
  const existingUser = await User.findOne({
    displayName: normalizedDisplayName,
    _id: { $ne: user._id },
  });
  if (existingUser) {
    const err = new Error("Display name is already taken");
    err.statusCode = 400;
    throw err;
  }

  // Do not allow display name change if it has already been changed once within the last 90 days
  if (user.lastDisplayNameChange) {
    const timeSinceLastChange =
      Date.now() - user.lastDisplayNameChange.getTime();
    if (timeSinceLastChange < NINETY_DAYS_IN_MS) {
      const timeRemaining = Math.ceil(
        (NINETY_DAYS_IN_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000),
      );
      const err = new Error(
        "Display name can be changed in " + timeRemaining + " days",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  user.previousDisplayName = user.displayName;
  user.displayName = normalizedDisplayName;
  user.lastDisplayNameChange = Date.now();

  await user.save();

  return user;
}

// Confirm new email entered is allowed
export async function validateNewEmail(user, newEmail) {
  // Ensure a new email is provided
  if (!newEmail || newEmail.trim().length === 0) {
    const err = new Error("New email is required");
    err.statusCode = 400;
    throw err;
  }

  // Normalize email and username
  const normalizedEmail = newEmail.toLowerCase().trim();

  // Ensure the new email is different from the current one
  if (normalizedEmail === user.email) {
    const err = new Error("New email must be different from the current email");
    err.statusCode = 400;
    throw err;
  }

  // Check if the new email is already taken
  const existingUser = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: user._id },
  });
  if (existingUser) {
    const err = new Error("Email is already taken");
    err.statusCode = 400;
    throw err;
  }

  // Ensure a valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    const err = new Error("Invalid email format");
    err.statusCode = 400;
    throw err;
  }

  // Do not allow email change if it has already been changed once within the last year
  if (user.lastEmailChange) {
    const timeSinceLastChange = Date.now() - user.lastEmailChange.getTime();
    if (timeSinceLastChange < ONE_YEAR_IN_MS) {
      const timeRemaining = Math.ceil(
        (ONE_YEAR_IN_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000),
      );
      const err = new Error(
        "Email can be changed in " + timeRemaining + " days",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Do not allow more than 3 email changes total
  if (user.emailChangeCount >= 3) {
    const err = new Error("Maximum number of email changes exceeded");
    err.statusCode = 400;
    throw err;
  }

  user.previousEmail = user.email;
  user.email = normalizedEmail;
  user.lastEmailChange = Date.now();
  user.emailChangeCount = (user.emailChangeCount || 0) + 1;
  await user.save();
}

// Confirm the new password entered is allowed and save a hashed version
export async function validateNewPassword({
  currentPassword,
  newPassword,
  user,
}) {
  // Ensure passwords are provided
  if (!currentPassword || !newPassword) {
    const err = new Error("Current and new passwords are required");
    err.statusCode = 400;
    throw err;
  }

  // Validate password length
  if (newPassword.length < 6 || newPassword.length > 128) {
    const err = new Error("Password must be between 6 and 128 characters");
    err.statusCode = 400;
    throw err;
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isPasswordCorrect) throw new AuthError();

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update the password
  user.password = hashedPassword;
  user.lastPasswordChange = Date.now();
  await user.save();
}

// Confirm the new profile image entered is allowed
export async function validateNewProfileImage(profileImage, user, imageType) {
  // Delete old profile image from cloudinary and upload new one
  if (profileImage && profileImage !== user[imageType]) {
    // Upload new profile image and delete old one if it exists
    if (user[imageType] && user[imageType].includes("cloudinary")) {
      try {
        await deletePhoto(user[imageType]);
      } catch (deleteError) {
        const err = new Error("Failed to delete old profile image");
        err.statusCode = 500;
        throw err;
      }
    }
    try {
      const newImageURL = await uploadPhoto(profileImage);
    } catch (uploadError) {
      const err = new Error("Failed to upload new profile image");
      err.statusCode = 500;
      throw err;
    }
  } else {
    const err = new Error("A new profile image must be provided");
    err.statusCode = 400;
    throw err;
  }

  user[imageType] = newImageURL;
  await user.save();

  return user;
}

// Add a recipe to the user's specified category collection
export async function addRecipeToCurrentUserCategory(user, recipeId, category) {
  // Check if the recipe exists
  const recipe = await Recipe.findById(recipeId).select("+isDeleted").lean();
  if (!recipe || recipe.isDeleted || !recipe.isApproved) {
    const err = new Error("Recipe not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure that the category is valid
  if (!validRecipeCategories.includes(category)) {
    const err = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  // Add the recipe to the user's category if not already present
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $addToSet: { [category]: recipeId } },
    { new: true },
  ).lean();

  return updatedUser;
}

// Remove a recipe from the user's specified category collection
export async function removeRecipeFromCurrentUserCategory(
  user,
  recipeId,
  category,
) {
  // Ensure that the category is valid
  if (!validRecipeCategories.includes(category)) {
    const err = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $pull: { [category]: recipeId } },
    { new: true },
  ).lean();

  return updatedUser;
}

// Get a user's specified collection
export async function getSpecifiedUserCollection({
  user,
  categoryName,
  categoryParameters,
}) {
  // Ensure that the collection is valid
  if (!validOtherCategories.includes(categoryName)) {
    const err = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  // Build favorite cuisines list
  const updatedUser = await User.findById(user._id)
    .select([categoryName])
    .populate(categoryName, categoryParameters)
    .lean();

  const collection = updatedUser[categoryName].map((item) => item.title);

  return collection;
}

// Update collection and appropriate user field
export async function addSpecifiedUserCollectionItems({
  user,
  newItems,
  collectionModel,
  categoryName,
  categoryParameters,
  minLength,
  maxLength,
}) {
  // Ensure that the category is valid
  if (!validOtherCategories.includes(categoryName)) {
    const err = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  // Ensure new items are provided
  if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
    const err = new Error(`${collectionModel.modelName}s are required`);
    err.statusCode = 400;
    throw err;
  }

  // Normalize and filter items, removing empty strings
  const itemNames = newItems
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  // Remove duplicate items
  const uniqueItemNames = Array.from(new Set(itemNames));

  // Ensure the item is provided and properly formatted
  for (const itemName of uniqueItemNames) {
    if (itemName.length < minLength || itemName.length > maxLength) {
      const err = new Error(
        `${collectionModel.modelName}s must be between ${minLength} and ${maxLength} characters long`,
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Save each item to the appropriate collection and store their IDs
  const items = await Promise.all(
    uniqueItemNames.map(async (itemName) => {
      const item = await collectionModel.findOneAndUpdate(
        { title: itemName.toLowerCase() },
        { title: itemName.toLowerCase() },
        { upsert: true, new: true },
      );
      return item;
    }),
  );

  // Add each item to user's favorite cuisines
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $addToSet: { [categoryName]: { $each: items.map((item) => item._id) } },
    },
    { new: true },
  )
    .select(categoryName)
    .populate(categoryName, categoryParameters)
    .lean();

  return updatedUser[categoryName].map((item) => item.title);
}

// Remove items from user collection
export async function removeSpecifiedUserCollectionItems({
  user,
  oldItems,
  collectionModel,
  categoryName,
  categoryParameters,
  minLength,
  maxLength,
}) {
  // Ensure that the category is valid
  if (!validOtherCategories.includes(categoryName)) {
    const err = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  // Ensure old items are provided
  if (!oldItems || !Array.isArray(oldItems) || oldItems.length === 0) {
    const err = new Error(`${collectionModel.modelName}s are required`);
    err.statusCode = 400;
    throw err;
  }

  // Normalize and find items to remove
  const itemNames = oldItems
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  // Ensure the item is provided and properly formatted
  for (const itemName of itemNames) {
    if (itemName.length < minLength || itemName.length > maxLength)
      throw new Error(
        `${collectionModel.modelName}s must be between ${minLength} and ${maxLength} characters long`,
      );
  }

  // Find each item in the collection
  const items = await collectionModel.find({ title: { $in: itemNames } });

  const filteredItems = items.filter((item) => item !== null);

  // Remove the item from the user's favorite cuisines
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $pull: {
        [categoryName]: { $in: filteredItems.map((item) => item._id) },
      },
    },
    { new: true },
  )
    .select(categoryName)
    .populate(categoryName, categoryParameters)
    .lean();

  return updatedUser[categoryName].map((item) => item.title);
}

// Soft delete user's account
export async function deleteCurrentUserAccount(user) {
  user.isDeleted = true;
  user.deletedAt = new Date();

  // Deleted any previously created votes or ratings made by the user
  await deleteAllUserRatings(user._id);
  await deleteAllUserCommentVotes(user._id);

  // Delete any existing personal notes for the recipe
  await Note.deleteMany({ authorId: user._id });

  // Update the user's username, email, and display name to prevent conflicts with other users in the future
  user.previousDisplayName = user.displayName;
  user.previousEmail = user.email;
  user.username = await generateUniqueDeletedName(
    user.username,
    user._id,
    "user",
  );
  user.email = await generateUniqueDeletedEmail(user.email, user._id);
  user.displayName = await generateUniqueDeletedName(
    user.displayName,
    user._id,
    "user",
  );

  await user.save();
}

// Get another user's profile by username, excluding sensitive information
export async function getOtherUserProfileByUsername(username) {
  const user = await User.findOne({ username }).select("+isDeleted").lean();

  if (!user || user.isDeleted) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
}

// Get another user's recipes by username
export async function getOtherUserRecipesByUsername(username, queryParams) {
  // Get the user to ensure they exist and are not deleted
  const user = await User.findOne({ username }).select("+isDeleted").lean();

  if (!user || user.isDeleted) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Get query information for recipes to send
  const { page, limit, offset } = getPagination(queryParams);

  const query = {
    ...buildRecipeFilters(queryParams),
    author: user._id,
    isDeleted: false,
    isPublished: true,
  };

  // Fetch the recipes using the built query and pagination info
  const result = await fetchRecipes({ query, page, limit, offset });

  return result;
}
