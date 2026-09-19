import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Ingredient from "../../src/models/ingredient.model.js";
import Measurement from "../../src/models/measurement.model.js";
import Comment from "../../src/models/comment.model.js";
import CommentVote from "../../src/models/commentVote.model.js";
import Note from "../../src/models/note.model.js";
import Tag from "../../src/models/tag.model.js";
import Cuisine from "../../src/models/cuisine.model.js";
import Meal from "../../src/models/meal.model.js";
import Holiday from "../models/holiday.model.js";
import Season from "../models/season.model.js";
import Rating from "../models/rating.model.js";
import BannedWord from "../models/BannedWord.model.js";
import Log from "../models/log.model.js";
import Report from "../models/report.model.js";

let secondaryTestUserCounter = 0;

export const queryParamsEmpty = {
  page: 1,
  limit: 10,
  tags: null,
  holidays: null,
  seasons: null,
};

// Helper function for calculating the expected dates based on rules
export function getNthWeekdayOfMonth(year, month, weekday, week) {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (week - 1) * 7;

  return new Date(year, month, day);
}

//#region Test User Helpers

// Create example users for testing
export const testUserData = {
  email: `${crypto.randomUUID()}@example.com`,
  username: "TestUser",
  displayName: "TestUser",
  password: await hashPassword("Password123!"),
};

const moderatorTestUserData = {
  email: `${crypto.randomUUID()}@example.com`,
  username: "ModeratorUser",
  displayName: "ModeratorUser",
  password: await hashPassword("Password123!"),
  role: "moderator",
};

const adminTestUserData = {
  email: `${crypto.randomUUID()}@example.com`,
  username: "AdminUser",
  displayName: "AdminUser",
  password: await hashPassword("Password123!"),
  role: "admin",
};

export const testUserData2 = {
  email: `${crypto.randomUUID()}@example.com`,
  username: "testuser2",
  displayName: "TestUser2",
  password: await hashPassword("Password123!"),
};

export const unhashedPassword = "Password123!";

export async function createTestUser(overrides = {}) {
  const user = await User.create({ ...testUserData, ...overrides });
  return user;
}

export async function createTestModeratorUser(overrides = {}) {
  const user = await User.create({ ...moderatorTestUserData, ...overrides });
  return user;
}

export async function createTestAdminUser(overrides = {}) {
  const user = await User.create({
    ...adminTestUserData,
    ...overrides,
  });
  return user;
}

export async function createSecondaryTestUser({
  username,
  displayName,
  email,
  password,
  ...overrides
}) {
  const user = await User.create({
    username: `${username}${++secondaryTestUserCounter}`,
    displayName: `${displayName}${secondaryTestUserCounter}`,
    email,
    password: await hashPassword(password),
    ...overrides,
  });
  return user;
}

// Helper function to salt and hash a password for testing
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function getAuthenticatedAgent(user) {
  const token = generateTestToken(user);
  const agent = request.agent(app);
  agent.set("Cookie", `jwt-token=${token}`);

  return agent;
}

export function generateTestToken(user) {
  return jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

// Helper function to add a recipe to a user's favorites
export async function addRecipeToFavorites(user, recipe) {
  user.favoriteRecipes.push(recipe);
  await user.save();
}

//#endregion

//#region Test Recipe and Ingredient Helpers

// Create example recipes for testing
export const testRecipeData = {
  title: "Test Recipe",
  slug: `test-recipe`,
  stepSections: [
    {
      steps: [{ step: "Step 1" }, { step: "Step 2" }],
    },
  ],
  preptimeSeconds: 600,
  cooktimeSeconds: 1200,
  servings: 4,
  isPublished: true,
};

export const customRecipe = (index, testIngredient) => {
  return {
    ...testRecipeData,
    title: `Test Recipe ${index}`,
    slug: `test-recipe-${index}`,
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
    isPublished: true,
  };
};

export async function createTestRecipe(authorId, overrides = {}) {
  const recipe = await Recipe.create({
    ...testRecipeData,
    isApproved: true,
    author: authorId,
    ...overrides,
  });
  return recipe;
}

const fullTestRecipeData = {
  title: "Full Test Recipe",
  description: "This is a test recipe.",
  stepSections: [
    {
      steps: [{ step: "Step 1" }, { step: "Step 2" }],
    },
  ],
  preptimeSeconds: 600,
  cooktimeSeconds: 1200,
  servings: 4,
  image: "",
  notes: "These are test notes.",
  isPublished: true,
};

export const fullTestRecipeDataComplete = {
  title: "Full Test Recipe",
  ingredientSections: [
    {
      sectionTitle: "Test Section",
      ingredients: [
        { quantity: "1", ingredient: "ingredient1" },
        { quantity: "2", ingredient: "ingredient2" },
      ],
    },
  ],
  description: "This is a test recipe.",
  stepSections: [
    {
      steps: [{ step: "Step 1" }, { step: "Step 2" }],
    },
  ],
  preptimeSeconds: 600,
  cooktimeSeconds: 1200,
  servings: 4,
  image: "",
  source: {
    name: "Test source",
    note: "Test note",
  },
  tags: ["tag1", "tag2"],
  cuisines: ["cuisine1", "cuisine2"],
  meals: ["meal1", "meal2"],
  notes: "These are test notes.",
  linkedRecipes: [],
  seasons: ["season1", "season2"],
  holidays: ["holiday1", "holiday2"],
  isPublished: true,
};

export const customFullRecipe = ({
  index,
  testIngredients,
  tags,
  linkedRecipes,
  holidays,
  seasons,
}) => {
  return {
    ...fullTestRecipeData,
    title: `Full Test Recipe ${index}`,
    ingredients: testIngredients.map((ingredient) => ({
      ingredient: ingredient._id,
    })),
    tags: tags ? tags.map((tag) => tag._id) : [],
    linkedRecipes: linkedRecipes
      ? linkedRecipes.map((recipe) => ({
          recipeId: recipe._id,
          role: "component",
        }))
      : [],
    holidays: holidays ? holidays.map((holiday) => holiday._id) : [],
    seasons: seasons ? seasons.map((season) => season._id) : [],
  };
};

export async function createFullTestRecipe(authorId, overrides = {}) {
  const recipe = await Recipe.create({
    ...fullTestRecipeData,
    author: authorId,
    ...overrides,
  });
  return recipe;
}

// Create example ingredients for testing
const testIngredientData = {
  title: "Test Ingredient",
};

export const customIngredient = (index) => {
  return {
    title: `Test Ingredient ${index}`,
  };
};

export async function createTestIngredient(overrides = {}) {
  const ingredient = await Ingredient.create({
    ...testIngredientData,
    ...overrides,
  });
  return ingredient;
}

//#endregion

//#region Test Comment Helpers

// Create example comments for testing
const testCommentData = {
  content: "This is a test comment.",
};

export const customComment = (index, parentCommentId = null) => {
  return {
    content: `This is test comment number ${index}.`,
    parentCommentId,
  };
};

export async function createTestComment(
  authorId,
  recipeId,
  parentCommentId = null,
  overrides = {},
) {
  const comment = await Comment.create({
    authorId,
    recipeId,
    ...testCommentData,
    ...overrides,
    parentCommentId,
  });
  return comment;
}

// Helper function to create multiple parent comments for a recipe
export async function createTestParentComments(authorId, recipeId, count) {
  const comments = [];
  for (let i = 1; i <= count; i++) {
    comments.push(
      createTestComment(authorId, recipeId, null, customComment(i)),
    );
  }

  return Promise.all(comments);
}

// Helper function to create multiple child comments for a parent comment
export async function createTestChildComments(
  authorId,
  recipeId,
  parentCommentId,
  count,
) {
  const comments = [];
  for (let i = 1; i <= count; i++) {
    comments.push(
      createTestComment(authorId, recipeId, parentCommentId, customComment(i)),
    );
  }

  return Promise.all(comments);
}

export async function createTestCommentVote(authorId, commentId, voteType) {
  const commentVote = await CommentVote.create({
    authorId,
    commentId,
    voteType,
  });
  return commentVote;
}

//#endregion

//#region Test Note Helpers

// Create a example note for testing
export const testNoteData = {
  content: "This is a test note.",
};

export const customNote = (index) => {
  return {
    content: `This is test note number ${index}.`,
  };
};

export async function createTestNote(authorId, recipeId, overrides = {}) {
  const note = await Note.create({
    authorId,
    recipeId,
    ...testNoteData,
    ...overrides,
  });
  return note;
}

//#endregion

//#region Test Tag Helpers

// Create example tags for testing
const testTagData = {
  title: "Test Tag",
};

export const customTag = (index) => {
  return {
    title: `Test Tag ${index}`,
  };
};

export async function createTestTag(overrides = {}) {
  const tag = await Tag.create({
    ...testTagData,
    ...overrides,
  });
  return tag;
}

//#endregion

//#region Test Meal Helpers

// Create example meals for testing
const testMealData = {
  title: "Test Meal",
};

export const customMeal = (index) => {
  return {
    title: `Test Meal ${index}`,
  };
};

export async function createTestMeal(overrides = {}) {
  const meal = await Meal.create({
    ...testMealData,
    ...overrides,
  });
  return meal;
}

//#endregion

//#region Test Ciuisine Helpers

// Create example cuisines for testing
const testCuisineData = {
  title: "Test Cuisine",
};

export const customCuisine = (index) => {
  return {
    title: `Test Cuisine ${index}`,
  };
};

export async function createTestCuisine(overrides = {}) {
  const cuisine = await Cuisine.create({
    ...testCuisineData,
    ...overrides,
  });
  return cuisine;
}

//#endregion

//#region Test Holiday Helpers

// Create example holidays for testing
const testHolidayData = {
  title: "Test Holiday",
};

export const customHoliday = (index) => {
  return {
    title: `Test Holiday ${index}`,
  };
};

export async function createTestHoliday(overrides = {}) {
  const holiday = await Holiday.create({
    ...testHolidayData,
    ...overrides,
  });
  return holiday;
}

//#endregion

//#region Test Season Helpers

// Create example seasons for testing
const testSeasonData = {
  title: "Test Season",
};

export const customSeason = (index) => {
  return {
    title: `Test Season ${index}`,
  };
};

export async function createTestSeason(overrides = {}) {
  const season = await Season.create({
    ...testSeasonData,
    ...overrides,
  });
  return season;
}

//#endregion

//#region Test Rating Helpers

// Create example ratings for testing
const testRatingData = {
  rating: 5,
};

export const customRating = (index) => {
  return {
    rating: 5,
  };
};

export async function createTestRating(recipeId, authorId, overrides = {}) {
  const rating = await Rating.create({
    recipeId,
    authorId,
    ...testRatingData,
    ...overrides,
  });
  return rating;
}

//#endregion

//#region Test Measurement Helpers

// Create example measurements for testing
export const customMeasurement = (title) => {
  return {
    title,
    system: "us customary",
    baseUnit: "volume",
    toBaseFactor: 1,
  };
};

export async function createTestMeasurement(overrides = {}) {
  const measurement = await Measurement.create({
    ...customMeasurement("cup"),
    ...overrides,
  });
  return measurement;
}

//#endregion

//#region Test Banned Word Helpers

// Create example banned words for testing
export const customBannedWord = (word, severity) => {
  return {
    word,
    severity,
  };
};

export async function createTestBannedWord(authorId, overrides = {}) {
  const bannedWord = await BannedWord.create({
    ...customBannedWord("test word", "block"),
    ...overrides,
    authorId,
  });
  return bannedWord;
}

export async function createTestBannedWordFlagged(authorId, overrides = {}) {
  const bannedWord = await BannedWord.create({
    ...customBannedWord("test word flagged", "flag"),
    ...overrides,
    authorId,
  });
  return bannedWord;
}

//#endregion

//#region Test Log Helpers

// Create example log entries for testing
export const customLog = (action, notes, targetId, reportId) => {
  return {
    action,
    notes,
    targetId: targetId || null,
    reportId: reportId || null,
  };
};

export async function createTestLog(
  adminId,
  action,
  targetId,
  reportId,
  overrides = {},
) {
  const log = await Log.create({
    ...customLog(action, "This is a test log entry.", targetId, reportId),
    ...overrides,
    adminId,
  });
  return log;
}

//#endregion

//#region Test Report Helpers

// Create example report entries for testing
export const customReport = ({
  reportingUserId,
  reportType,
  status,
  targetId,
  description,
  resolutionNotes,
  collectionName,
}) => {
  return {
    reportingUserId: reportingUserId,
    reportType: reportType || "other",
    status: status || "pending",
    targetId: targetId || null,
    description: description || null,
    resolutionNotes: resolutionNotes || "Pending resolution",
    collectionName: collectionName,
  };
};

export async function createTestReport(
  reportingUserId,
  reportType,
  status,
  targetId,
  resolutionNotes,
  collectionName,
  overrides = {},
) {
  const report = await Report.create({
    ...customReport({
      reportingUserId: reportingUserId || null,
      reportType: reportType || "other",
      status: status || "pending",
      targetId: targetId || null,
      description: "Test report",
      resolutionNotes: resolutionNotes || "Pending resolution",
      collectionName: collectionName || null,
    }),
    ...overrides,
  });
  return report;
}

//#endregion
