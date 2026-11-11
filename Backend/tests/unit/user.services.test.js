import bcrypt from "bcryptjs";

import User from "../../src/models/user.model.js";
import Cuisine from "../../src/models/cuisine.model.js";
import Ingredient from "../../src/models/ingredient.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Rating from "../../src/models/rating.model.js";
import Comment from "../../src/models/comment.model.js";
import CommentVote from "../../src/models/commentVote.model.js";
import Note from "../../src/models/note.model.js";

import {
  createTestUser,
  createSecondaryTestUser,
  createTestRecipe,
  createTestIngredient,
  createTestComment,
  customComment,
  createTestParentComments,
  createTestChildComments,
  createTestNote,
  customNote,
  queryParamsEmpty,
  createTestRating,
  createTestCommentVote,
} from "../../src/utils/testFunctions.js";

import {
  mapRecipeData,
  deleteAllUserRatings,
  deleteAllUserCommentVotes,
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
} from "../../src/services/user.services.js";

// Base test setup //

let testUser;
let otherUser;
let testRecipe;
let testIngredient;
let testRecipeIndex = 1;
const page = 1;
const limit = 5;
const offset = (page - 1) * limit;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});

  testUser = await createTestUser();
  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    slug: "otheruser",
    displayName: "OtherUser",
    email: `${crypto.randomUUID()}@example.com`,
    password: "Password123",
  });
  testIngredient = await createTestIngredient();

  testRecipe = await createTestRecipe(testUser._id, {
    ingredientSections: [
      {
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
    slug: `test-recipe-0`,
  });
});

// Delete all recipes and comments before each test
beforeEach(async () => {
  await Comment.deleteMany({});
  await CommentVote.deleteMany({});
  await Note.deleteMany({});
  await Cuisine.deleteMany({});
  await Rating.deleteMany({});
});

// Test cases: mapRecipeData //
describe("mapRecipeData", () => {
  test("should return an empty array when given an empty array", async () => {
    const mappedData = await mapRecipeData([]);

    expect(mappedData).toEqual([]);
  });

  test("should return an array of recipes with the correct fields", async () => {
    const recipeData = [testRecipe._id];

    const mappedData = await mapRecipeData(recipeData);

    expect(mappedData).toHaveLength(1);
    expect(mappedData[0]).toHaveProperty("_id", testRecipe._id);
    expect(mappedData[0]).toHaveProperty("title", testRecipe.title);
    expect(mappedData[0]).toHaveProperty("description", testRecipe.description);
    expect(mappedData[0]).toHaveProperty("image");
    expect(mappedData[0]).toHaveProperty(
      "preptimeSeconds",
      testRecipe.preptimeSeconds,
    );
    expect(mappedData[0]).toHaveProperty(
      "cooktimeSeconds",
      testRecipe.cooktimeSeconds,
    );
    expect(mappedData[0]).toHaveProperty(
      "aggregateRating",
      testRecipe.aggregateRating,
    );
    expect(mappedData[0]).toHaveProperty("ratingCount", testRecipe.ratingCount);
    expect(mappedData[0]).toHaveProperty("author");
  });
});

// Test cases: deleteAllUserRatings //
describe("deleteAllUserRatings", () => {
  test("should delete all ratings for the specified user", async () => {
    const testRecipe1 = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      slug: `test-recipe-${testRecipeIndex++}`,
      aggregateRating: 5,
      ratingCount: 1,
      totalRating: 5,
    });

    const testRecipe2 = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      slug: `test-recipe-${testRecipeIndex++}`,
      aggregateRating: 4,
      ratingCount: 1,
      totalRating: 4,
    });

    await createTestRating(testRecipe1._id, testUser._id, { rating: 5 });
    await createTestRating(testRecipe2._id, testUser._id, { rating: 4 });

    const initialRatings = await Rating.find({ authorId: testUser._id });
    expect(initialRatings).toHaveLength(2);

    await deleteAllUserRatings(testUser._id);

    const updatedRecipe1 = await Recipe.findById(testRecipe1._id);
    const updatedRecipe2 = await Recipe.findById(testRecipe2._id);
    const finalRatings = await Rating.find({ authorId: testUser._id });

    expect(finalRatings).toHaveLength(0);
    expect(updatedRecipe1.aggregateRating).toBe(0);
    expect(updatedRecipe1.ratingCount).toBe(0);
    expect(updatedRecipe1.totalRating).toBe(0);
    expect(updatedRecipe2.aggregateRating).toBe(0);
    expect(updatedRecipe2.ratingCount).toBe(0);
    expect(updatedRecipe2.totalRating).toBe(0);
  });

  test("should keep all ratings made by other users", async () => {
    const testRecipe1 = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      slug: `test-recipe-${testRecipeIndex++}`,
      aggregateRating: 4.75,
      ratingCount: 2,
      totalRating: 9.5,
    });

    const testRecipe2 = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      slug: `test-recipe-${testRecipeIndex++}`,
      aggregateRating: 4.5,
      ratingCount: 2,
      totalRating: 9,
    });

    await createTestRating(testRecipe1._id, testUser._id, { rating: 5 });
    await createTestRating(testRecipe1._id, otherUser._id, { rating: 4.5 });
    await createTestRating(testRecipe2._id, testUser._id, { rating: 4 });
    await createTestRating(testRecipe2._id, otherUser._id, { rating: 5 });

    const initialRatings = await Rating.find({ authorId: otherUser._id });
    expect(initialRatings).toHaveLength(2);

    await deleteAllUserRatings(otherUser._id);

    const updatedRecipe1 = await Recipe.findById(testRecipe1._id);
    const updatedRecipe2 = await Recipe.findById(testRecipe2._id);
    const finalRatings = await Rating.find({ authorId: otherUser._id });

    expect(finalRatings).toHaveLength(0);
    expect(updatedRecipe1.aggregateRating).toBe(5);
    expect(updatedRecipe1.ratingCount).toBe(1);
    expect(updatedRecipe1.totalRating).toBe(5);
    expect(updatedRecipe2.aggregateRating).toBe(4);
    expect(updatedRecipe2.ratingCount).toBe(1);
    expect(updatedRecipe2.totalRating).toBe(4);

    const testUserRatings = await Rating.find({ authorId: testUser._id });

    expect(testUserRatings).toHaveLength(2);
  });
});

// Test cases: deleteAllUserCommentVotes //
describe("deleteAllUserCommentVotes", () => {
  test("should delete all comment votes made by the user", async () => {
    const testComment1 = await createTestComment(
      otherUser._id,
      testRecipe._id,
      null,
      { content: "Test comment 1", aggregateVote: 1 },
    );
    const testComment2 = await createTestComment(
      otherUser._id,
      testRecipe._id,
      null,
      { content: "Test comment 2", aggregateVote: -1 },
    );

    await createTestCommentVote(testUser._id, testComment1._id, "upvote");
    await createTestCommentVote(testUser._id, testComment2._id, "downvote");

    const initialCommentVotes = await CommentVote.find({
      authorId: testUser._id,
    });
    expect(initialCommentVotes).toHaveLength(2);

    await deleteAllUserCommentVotes(testUser._id);
    const updatedComment1 = await Comment.findById(testComment1._id);
    const updatedComment2 = await Comment.findById(testComment2._id);

    const finalCommentVotes = await CommentVote.find({
      authorId: testUser._id,
    });
    expect(finalCommentVotes).toHaveLength(0);
    expect(updatedComment1.aggregateVote).toBe(0);
    expect(updatedComment2.aggregateVote).toBe(0);
  });

  test("should not delete comment votes made by other users", async () => {
    const otherTestUser = await createSecondaryTestUser({
      username: `otheruser`,
      slug: `otheruser`,
      displayName: `OtherUser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const testComment1 = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      { content: "Test comment 1", aggregateVote: 2 },
    );

    const testComment2 = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      { content: "Test comment 2", aggregateVote: -2 },
    );

    await createTestCommentVote(otherUser._id, testComment1._id, "upvote");
    await createTestCommentVote(otherUser._id, testComment2._id, "downvote");
    await createTestCommentVote(otherTestUser._id, testComment1._id, "upvote");
    await createTestCommentVote(
      otherTestUser._id,
      testComment2._id,
      "downvote",
    );

    const initialCommentVotes = await CommentVote.find({
      authorId: otherUser._id,
    });
    expect(initialCommentVotes).toHaveLength(2);

    await deleteAllUserCommentVotes(otherUser._id);

    const finalCommentVotes = await CommentVote.find({
      authorId: otherUser._id,
    });
    expect(finalCommentVotes).toHaveLength(0);

    const otherTestUserCommentVotes = await CommentVote.find({
      authorId: otherTestUser._id,
    });
    expect(otherTestUserCommentVotes).toHaveLength(2);

    const updatedComment1 = await Comment.findById(testComment1._id);
    const updatedComment2 = await Comment.findById(testComment2._id);

    expect(updatedComment1.aggregateVote).toBe(1);
    expect(updatedComment2.aggregateVote).toBe(-1);
  });

  test("should delete comment votes made on a child comment", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      { content: "Parent comment", aggregateVote: 0 },
    );

    const childComment1 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      { content: "Child comment", aggregateVote: 1 },
    );

    const childComment2 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      { content: "Child comment", aggregateVote: -1 },
    );

    await createTestCommentVote(testUser._id, childComment1._id, "upvote");
    await createTestCommentVote(testUser._id, childComment2._id, "downvote");

    const initialCommentVotes = await CommentVote.find({
      authorId: testUser._id,
    });
    expect(initialCommentVotes).toHaveLength(2);

    await deleteAllUserCommentVotes(testUser._id);

    const finalCommentVotes = await CommentVote.find({
      authorId: testUser._id,
    });
    expect(finalCommentVotes).toHaveLength(0);

    const updatedChildComment1 = await Comment.findById(childComment1._id);
    const updatedChildComment2 = await Comment.findById(childComment2._id);

    expect(updatedChildComment1.aggregateVote).toBe(0);
    expect(updatedChildComment2.aggregateVote).toBe(0);
  });
});

// Test cases: getCurrentUserComments //
describe("getCurrentUserComments", () => {
  test("should return a blank array when user has no comments", async () => {
    const comments = await getCurrentUserComments(
      testUser._id,
      page,
      limit,
      offset,
    );

    expect(comments.comments).toEqual([]);
    expect(comments.currentPage).toBe(1);
    expect(comments.totalComments).toBe(0);
    expect(comments.totalPages).toBe(0);
  });

  test("should return user's comments with correct pagination for parent comments", async () => {
    await createTestParentComments(testUser._id, testRecipe._id, 12);

    const comments = await getCurrentUserComments(
      testUser._id,
      page,
      limit,
      offset,
    );

    expect(comments.comments).toHaveLength(5);
    expect(comments.currentPage).toBe(1);
    expect(comments.totalComments).toBe(12);
    expect(comments.totalPages).toBe(3);
  });

  test("should return user's comments with correct pagination for child comments", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    await createTestChildComments(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      12,
    );

    const comments = await getCurrentUserComments(
      testUser._id,
      page,
      limit,
      offset,
    );

    expect(comments.comments).toHaveLength(5);
    expect(comments.currentPage).toBe(1);
    expect(comments.totalComments).toBe(13);
    expect(comments.totalPages).toBe(3);
  });

  test("should return user's comments with correct pagination when user has both parent and child comments", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    await createTestParentComments(testUser._id, testRecipe._id, 6);

    await createTestChildComments(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      6,
    );

    const comments = await getCurrentUserComments(
      testUser._id,
      page,
      limit,
      offset,
    );

    expect(comments.comments).toHaveLength(5);
    expect(comments.currentPage).toBe(1);
    expect(comments.totalComments).toBe(13);
    expect(comments.totalPages).toBe(3);
  });

  test("should only return comments for the specified user", async () => {
    await createTestComment(
      otherUser._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const userComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      customComment(2),
    );

    const comments = await getCurrentUserComments(
      testUser._id,
      page,
      limit,
      offset,
    );

    expect(comments.comments).toHaveLength(1);
    expect(comments.comments[0]._id.toString()).toBe(
      userComment._id.toString(),
    );
  });
});

// Test cases: getCurrentUserNotes //
describe("getCurrentUserNotes", () => {
  test("should return a blank array when user has no notes", async () => {
    const notes = await getCurrentUserNotes(testUser._id, page, limit, offset);
    expect(notes.notes).toEqual([]);
    expect(notes.currentPage).toBe(1);
    expect(notes.totalNotes).toBe(0);
    expect(notes.totalPages).toBe(0);
  });

  test("should return user's notes with correct pagination", async () => {
    for (let i = 1; i <= 12; i++) {
      const recipe = await createTestRecipe(testUser._id, {
        title: `Test Recipe for Note ${i}`,
        ingredientSections: [
          {
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        slug: `notes-test-recipe-${i}`,
      });
      await createTestNote(testUser._id, recipe._id, customNote(i));
    }

    const notes = await getCurrentUserNotes(testUser._id, page, limit, offset);

    expect(notes.notes).toHaveLength(5);
    expect(notes.currentPage).toBe(1);
    expect(notes.totalNotes).toBe(12);
    expect(notes.totalPages).toBe(3);
  });

  test("should only return notes for the specified user", async () => {
    await createTestNote(otherUser._id, testRecipe._id, customNote(1));

    const userNote = await createTestNote(
      testUser._id,
      testRecipe._id,
      customNote(2),
    );

    const notes = await getCurrentUserNotes(testUser._id, page, limit, offset);

    expect(notes.notes).toHaveLength(1);
    expect(notes.notes[0]._id.toString()).toBe(userNote._id.toString());
  });
});

// Test cases: validateNewDisplayName //
describe("validateNewDisplayName", () => {
  test("should update the user's displayName and track previous displayName and change date", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const originalDisplayName = newUser.displayName;
    const originalUsername = newUser.username;

    expect(newUser.previousDisplayName).toBeNull();
    expect(newUser.lastDisplayNameChange).toBeNull();

    const newDisplayName = "UpdatedDisplayName";

    await validateNewDisplayName(newUser, newDisplayName);

    const updatedUser = await User.findById(newUser._id).select(
      "+previousDisplayName +lastDisplayNameChange",
    );

    expect(updatedUser.previousDisplayName).toBe(originalDisplayName);
    expect(updatedUser.username).toBe(originalUsername);
    expect(updatedUser.displayName).toBe(newDisplayName);
    expect(updatedUser.lastDisplayNameChange).toBeInstanceOf(Date);
  });

  test("should throw error if a new displayName is not provided", async () => {
    await expect(validateNewDisplayName(testUser._id, "")).rejects.toThrow(
      "New display name is required",
    );
  });

  test("should throw error if new displayName is all whitespace", async () => {
    await expect(validateNewDisplayName(testUser._id, "   ")).rejects.toThrow(
      "New display name is required",
    );
  });

  test("should throw error if new displayName is less than 3 characters", async () => {
    await expect(validateNewDisplayName(testUser._id, "ab")).rejects.toThrow(
      "Display name must be between 3 and 32 characters",
    );
  });

  test("should throw error if new displayName is more than 32 characters", async () => {
    const longDisplayName = "a".repeat(33);
    await expect(
      validateNewDisplayName(testUser._id, longDisplayName),
    ).rejects.toThrow("Display name must be between 3 and 32 characters");
  });

  test("should throw error if the new displayName is the same as the current displayName", async () => {
    await expect(
      validateNewDisplayName(testUser, testUser.displayName),
    ).rejects.toThrow(
      "New display name must be different from the current display name",
    );
  });

  test("should throw error if the new displayName is already taken by another user", async () => {
    const existingUser = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      validateNewDisplayName(testUser._id, existingUser.displayName),
    ).rejects.toThrow("Display name is already taken");
  });

  test("should throw error if the displayName was changed within the last 90 days", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      previousDisplayName: "oldusername",
      lastDisplayNameChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const testUser = await User.findById(user._id).select(
      "+lastDisplayNameChange",
    );

    await expect(
      validateNewDisplayName(testUser, "newdisplayname"),
    ).rejects.toThrow("Display name can be changed in");
  });

  test("should allow displayName change if the last change was more than 90 days ago", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      previousDisplayName: "oldusername",
      lastDisplayNameChange: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    });

    const testUser = await User.findById(user._id).select(
      "+lastDisplayNameChange",
    );

    const originalDisplayName = testUser.displayName;

    await validateNewDisplayName(testUser, "newdisplayname");

    const updatedUser = await User.findById(user._id).select(
      "+previousDisplayName +lastDisplayNameChange",
    );

    expect(updatedUser.displayName).toBe("newdisplayname");
    expect(updatedUser.previousDisplayName).toBe(originalDisplayName);
    expect(updatedUser.lastDisplayNameChange).toBeInstanceOf(Date);
  });
});

// Test cases: validateNewEmail //
describe("validateNewEmail", () => {
  test("should update the user's email and track previous email and change date", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const originalEmail = newUser.email;

    expect(newUser.previousEmail).toBeNull();
    expect(newUser.lastEmailChange).toBeNull();

    const newEmail = `${crypto.randomUUID()}@example.com`;

    await validateNewEmail(newUser, newEmail);

    const updatedUser = await User.findById(newUser._id).select(
      "+lastEmailChange +emailChangeCount +previousEmail",
    );

    expect(updatedUser.email).toBe(newEmail);
    expect(updatedUser.previousEmail).toBe(originalEmail);
    expect(updatedUser.lastEmailChange).toBeInstanceOf(Date);
    expect(updatedUser.emailChangeCount).toBe(1);
  });

  test("should throw error if a new email is not provided", async () => {
    await expect(validateNewEmail(testUser._id)).rejects.toThrow(
      "New email is required",
    );
  });

  test("should throw error if new email is all whitespace", async () => {
    await expect(validateNewEmail(testUser._id, "   ")).rejects.toThrow(
      "New email is required",
    );
  });

  test("should throw error if new email is the same as the current email", async () => {
    await expect(validateNewEmail(testUser, testUser.email)).rejects.toThrow(
      "New email must be different from the current email",
    );
  });

  test("should throw error if the new email is already taken by another user", async () => {
    const existingUser = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      validateNewEmail(testUser, existingUser.email),
    ).rejects.toThrow("Email is already taken");
  });

  test("should throw error if the new email is not formatted correctly with no @ symbol", async () => {
    await expect(validateNewEmail(testUser, "invalidemail")).rejects.toThrow(
      "Invalid email format",
    );
  });

  test("should throw error if the new email is not formatted correctly with no domain", async () => {
    await expect(validateNewEmail(testUser, "invalidemail@")).rejects.toThrow(
      "Invalid email format",
    );
  });

  test("should throw error if the new email is not formatted correctly with no username", async () => {
    await expect(validateNewEmail(testUser, "@example.com")).rejects.toThrow(
      "Invalid email format",
    );
  });

  test("should throw error if last email change was within the last year", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      previousEmail: `${crypto.randomUUID()}@example.com`,
      lastEmailChange: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    });

    const testUser = await User.findById(user._id).select("+lastEmailChange");

    await expect(
      validateNewEmail(testUser, `${crypto.randomUUID()}@example.com`),
    ).rejects.toThrow("Email can be changed in");
  });

  test("should allow email change if the last change was more than a year ago", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      previousEmail: `${crypto.randomUUID()}@example.com`,
      lastEmailChange: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    });

    const testUser = await User.findById(user._id).select("+lastEmailChange");
    const newEmail = `${crypto.randomUUID()}@example.com`;
    const originalEmail = testUser.email;
    await validateNewEmail(testUser, newEmail);

    const updatedUser = await User.findById(user._id).select(
      "+lastEmailChange +emailChangeCount +previousEmail",
    );

    expect(updatedUser.email).toBe(newEmail);
    expect(updatedUser.previousEmail).toBe(originalEmail);
    expect(updatedUser.lastEmailChange).toBeInstanceOf(Date);
    expect(updatedUser.emailChangeCount).toBe(1);
  });

  test("should throw error if email change count exceeds 3", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      previousEmail: `${crypto.randomUUID()}@example.com`,
      lastEmailChange: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      emailChangeCount: 3,
    });

    const testUser = await User.findById(user._id).select(
      "+lastEmailChange +emailChangeCount",
    );
    const newEmail = `${crypto.randomUUID()}@example.com`;

    await expect(validateNewEmail(testUser, newEmail)).rejects.toThrow(
      "Maximum number of email changes exceeded",
    );
  });
});

// Test cases: validateNewPassword //
describe("validateNewPassword", () => {
  test("should update the user's password and track last password change date", async () => {
    const newUser = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    expect(newUser.lastPasswordChange).toBeNull();

    const newPassword = "NewPassword123";

    await validateNewPassword({
      currentPassword: "Password123",
      newPassword: newPassword,
      user: newUser,
    });

    const updatedUser = await User.findById(newUser._id).select(
      "+password +lastPasswordChange",
    );

    expect(updatedUser.lastPasswordChange).toBeInstanceOf(Date);
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    expect(isMatch).toBe(true);
  });

  test("should throw error if a new password is not provided", async () => {
    await expect(
      validateNewPassword({
        currentPassword: testUser.password,
        user: testUser,
      }),
    ).rejects.toThrow("Current and new passwords are required");
  });

  test("should throw error if current password is not provided", async () => {
    await expect(
      validateNewPassword({
        newPassword: "NewPassword123",
        user: testUser,
      }),
    ).rejects.toThrow("Current and new passwords are required");
  });

  test("should throw error if new password is less than 6 characters", async () => {
    await expect(
      validateNewPassword({
        currentPassword: "Password123",
        newPassword: "abc",
        user: testUser,
      }),
    ).rejects.toThrow("Password must be between 6 and 128 characters");
  });

  test("should throw error if new password is more than 128 characters", async () => {
    const longPassword = "a".repeat(129);
    await expect(
      validateNewPassword({
        currentPassword: "Password123",
        newPassword: longPassword,
        user: testUser,
      }),
    ).rejects.toThrow("Password must be between 6 and 128 characters");
  });

  test("should throw error if the current password is incorrect", async () => {
    await expect(
      validateNewPassword({
        currentPassword: "WrongPassword123",
        newPassword: "NewPassword123",
        user: testUser,
      }),
    ).rejects.toThrow("Invalid login information");
  });
});

// Test cases: validateNewProfileImage //

// Test cases: addRecipeToCurrentUserCategory //
describe("addRecipeToCurrentUserCategory", () => {
  test("should add a recipe to the user's specified category collection", async () => {
    const updatedUser = await addRecipeToCurrentUserCategory(
      testUser,
      testRecipe._id,
      "favoriteRecipes",
    );

    expect(updatedUser.favoriteRecipes.length).toBe(1);
    expect(updatedUser.favoriteRecipes).toContainEqual(testRecipe._id);
  });

  test("should not add a recipe to the user's specified category collection if it is already present", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [testRecipe._id],
    });

    const updatedUser = await addRecipeToCurrentUserCategory(
      user,
      testRecipe._id,
      "favoriteRecipes",
    );

    expect(updatedUser.favoriteRecipes.length).toBe(1);
    expect(updatedUser.favoriteRecipes).toContainEqual(testRecipe._id);
  });

  test("should throw an error if the specified recipe does not exist", async () => {
    const nonExistentRecipeId = "000000000000000000000000";
    await expect(
      addRecipeToCurrentUserCategory(
        testUser,
        nonExistentRecipeId,
        "favoriteRecipes",
      ),
    ).rejects.toThrow("Recipe not found");
  });

  test("should throw an error if the specified category is invalid", async () => {
    await expect(
      addRecipeToCurrentUserCategory(
        testUser,
        testRecipe._id,
        "invalidCategory",
      ),
    ).rejects.toThrow("Invalid category");
  });
});

// Test cases: removeRecipeFromCurrentUserCategory //
describe("removeRecipeFromCurrentUserCategory", () => {
  test("should remove a recipe from the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [testRecipe._id],
    });

    const updatedUser = await removeRecipeFromCurrentUserCategory(
      user,
      testRecipe._id,
      "favoriteRecipes",
    );

    expect(updatedUser.favoriteRecipes.length).toBe(0);
    expect(updatedUser.favoriteRecipes).not.toContainEqual(testRecipe._id);
  });

  test("should not remove a recipe from the user's specified category collection if it is not present", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteRecipes: [],
    });

    const updatedUser = await removeRecipeFromCurrentUserCategory(
      user,
      testRecipe._id,
      "favoriteRecipes",
    );

    expect(updatedUser.favoriteRecipes.length).toBe(0);
    expect(updatedUser.favoriteRecipes).not.toContainEqual(testRecipe._id);
  });

  test("should throw an error if the specified category is invalid", async () => {
    await expect(
      removeRecipeFromCurrentUserCategory(
        testUser,
        testRecipe._id,
        "invalidCategory",
      ),
    ).rejects.toThrow("Invalid category");
  });
});

// Test cases: getSpecifiedUserCollection //
describe("getSpecifiedUserCollection", () => {
  test("should return the user's specified category collection with populated data", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [await Cuisine.create({ title: "Italian" })],
      allergies: [await Ingredient.create({ title: "Peanuts" })],
      shoppingList: [await Ingredient.create({ title: "Tomatoes" })],
    });

    const favoriteCuisines = await getSpecifiedUserCollection({
      user,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
    });

    expect(favoriteCuisines).toHaveLength(1);
    expect(favoriteCuisines[0]).toBe("italian");

    const allergies = await getSpecifiedUserCollection({
      user,
      categoryName: "allergies",
      categoryParameters: "title -_id",
    });

    expect(allergies).toHaveLength(1);
    expect(allergies[0]).toBe("peanuts");

    const shoppingList = await getSpecifiedUserCollection({
      user,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
    });

    expect(shoppingList).toHaveLength(1);
    expect(shoppingList[0]).toBe("tomatoes");
  });

  test("should return an empty array if the user's specified category collection is empty", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [],
      allergies: [],
      shoppingList: [],
    });

    const favoriteCuisines = await getSpecifiedUserCollection({
      user,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
    });

    expect(favoriteCuisines).toEqual([]);
  });

  test("should throw an error if the specified category is invalid", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      getSpecifiedUserCollection({
        user,
        categoryName: "invalidCategory",
        categoryParameters: "title -_id",
      }),
    ).rejects.toThrow("Invalid category");
  });
});

// Test cases: addSpecifiedUserCollectionItems //
describe("addSpecifiedUserCollectionItems", () => {
  test("should update the user's specified category collection with new items", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [await Cuisine.create({ title: "italian" })],
    });

    let updatedCollection = await addSpecifiedUserCollectionItems({
      user,
      newItems: ["Mexican"],
      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(2);
    expect(updatedCollection).toContain("italian");
    expect(updatedCollection).toContain("mexican");

    updatedCollection = await addSpecifiedUserCollectionItems({
      user,
      newItems: ["Pizza"],
      collectionModel: Ingredient,
      categoryName: "allergies",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    expect(updatedCollection).toHaveLength(1);
    expect(updatedCollection).toContain("pizza");

    updatedCollection = await addSpecifiedUserCollectionItems({
      user,
      newItems: ["Tomatoes", "Lettuce"],
      collectionModel: Ingredient,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    expect(updatedCollection).toHaveLength(2);
    expect(updatedCollection).toContain("tomatoes");
    expect(updatedCollection).toContain("lettuce");
  });

  test("should return all old and new items in the user's specified category collection after update", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [await Cuisine.create({ title: "italian" })],
    });

    const updatedCollection = await addSpecifiedUserCollectionItems({
      user,
      newItems: ["Mexican"],

      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(2);
    expect(updatedCollection).toContain("italian");
    expect(updatedCollection).toContain("mexican");
  });

  test("should not add duplicate items or empty strings to the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [await Cuisine.create({ title: "italian" })],
    });

    const updatedCollection = await addSpecifiedUserCollectionItems({
      user,
      newItems: ["Italian", "italian", "ITALIAN", "     ", ""],

      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(1);
    expect(updatedCollection).toContain("italian");
  });

  test("should throw an error if the specified category is invalid", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        newItems: ["Item1", "Item2"],
        collectionModel: Cuisine,
        categoryName: "invalidCategory",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Invalid category");
  });

  test("should throw an error if no new items are provided", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if new items are not in an array", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        newItems: "NotAnArray",
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if new items are an empty array", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        newItems: [],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if any new item is less than the minimum length", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        newItems: ["Vegan", "Tacos", "A"],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines must be between 2 and 50 characters long");
  });

  test("should throw an error if any new item is more than the maximum length", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const longItem = "a".repeat(51);

    await expect(
      addSpecifiedUserCollectionItems({
        user,
        newItems: ["Vegan", "Tacos", longItem],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines must be between 2 and 50 characters long");
  });
});

// Test cases: removeSpecifiedUserCollectionItems //
describe("removeSpecifiedUserCollectionItems", () => {
  test("should remove specified items from the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [
        await Cuisine.create({ title: "italian" }),
        await Cuisine.create({ title: "mexican" }),
        await Cuisine.create({ title: "chinese" }),
      ],
      allergies: [
        await Ingredient.create({ title: "walnuts" }),
        await Ingredient.create({ title: "shellfish" }),
      ],
      shoppingList: [
        await Ingredient.create({ title: "potatoes" }),
        await Ingredient.create({ title: "cheese" }),
      ],
    });

    let updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Mexican", "Chinese"],
      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(1);
    expect(updatedCollection).toContain("italian");

    updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Walnuts"],
      collectionModel: Ingredient,
      categoryName: "allergies",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    expect(updatedCollection).toHaveLength(1);
    expect(updatedCollection).toContain("shellfish");

    updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Potatoes"],
      collectionModel: Ingredient,
      categoryName: "shoppingList",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 100,
    });

    expect(updatedCollection).toHaveLength(1);
    expect(updatedCollection).toContain("cheese");
  });

  test("should return an empty array if all items are removed from the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [
        await Cuisine.create({ title: "italian" }),
        await Cuisine.create({ title: "mexican" }),
      ],
    });

    const updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Italian", "Mexican"],

      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toEqual([]);
  });

  test("should return all old items that were not removed from the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [
        await Cuisine.create({ title: "italian" }),
        await Cuisine.create({ title: "mexican" }),
        await Cuisine.create({ title: "chinese" }),
      ],
    });

    const updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Mexican"],

      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(2);
    expect(updatedCollection).toContain("italian");
    expect(updatedCollection).toContain("chinese");
  });

  test("should not remove any empty strings or duplicate items from the user's specified category collection", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      favoriteCuisines: [
        await Cuisine.create({ title: "italian" }),
        await Cuisine.create({ title: "mexican" }),
        await Cuisine.create({ title: "chinese" }),
      ],
    });

    const updatedCollection = await removeSpecifiedUserCollectionItems({
      user,
      oldItems: ["Mexican", "mexican", "     ", ""],
      collectionModel: Cuisine,
      categoryName: "favoriteCuisines",
      categoryParameters: "title -_id",
      minLength: 2,
      maxLength: 50,
    });

    expect(updatedCollection).toHaveLength(2);
    expect(updatedCollection).toContain("italian");
    expect(updatedCollection).toContain("chinese");
  });

  test("should throw an error if the specified category is invalid", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        oldItems: ["Item1", "Item2"],
        collectionModel: Cuisine,
        categoryName: "invalidCategory",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Invalid category");
  });

  test("should throw an error if no old items are provided", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if old items are not in an array", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        oldItems: "NotAnArray",
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if old items are an empty array", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        oldItems: [],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines are required");
  });

  test("should throw an error if any old item is less than the minimum length", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        oldItems: ["Vegan", "Tacos", "A"],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines must be between 2 and 50 characters long");
  });

  test("should throw an error if any old item is more than the maximum length", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const longItem = "a".repeat(51);

    await expect(
      removeSpecifiedUserCollectionItems({
        user,
        oldItems: ["Vegan", "Tacos", longItem],
        collectionModel: Cuisine,
        categoryName: "favoriteCuisines",
        categoryParameters: "title -_id",
        minLength: 2,
        maxLength: 50,
      }),
    ).rejects.toThrow("Cuisines must be between 2 and 50 characters long");
  });
});

// Test cases: deleteCurrentUserAccount //
describe("deleteCurrentUserAccount", () => {
  test("should soft delete the user's account", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: `testuser`,
      displayName: `testuser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const originalUsername = user.username;
    const originalEmail = user.email;
    const originalDisplayName = user.displayName;

    await deleteCurrentUserAccount(user);

    const deletedUser = await User.findById(user._id).select(
      "+previousDisplayName +previousEmail +isDeleted +deletedAt",
    );

    expect(deletedUser.isDeleted).toBe(true);
    expect(deletedUser.deletedAt).toBeInstanceOf(Date);
    expect(deletedUser.username).toBe(
      `deleted_${originalUsername}_${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.email).toBe(
      `deleted.${originalEmail}.${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.displayName).toBe(
      `deleted_${originalDisplayName}_${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.previousDisplayName).toBe(originalDisplayName);
    expect(deletedUser.previousEmail).toBe(originalEmail);
  });

  test("should allow for a new user to register with the same information after deletion and avoid duplicates after deletion", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: `testuser`,
      displayName: `testuser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const originalUsername = user.username;
    const originalSlug = user.slug;
    const originalEmail = user.email;
    const originalDisplayName = user.displayName;

    await deleteCurrentUserAccount(user);

    const deletedUser = await User.findById(user._id);

    expect(deletedUser.username).toBe(
      `deleted_${originalUsername}_${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.slug).toBe(
      `deleted-${originalSlug}-${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.email).toBe(
      `deleted.${originalEmail}.${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.displayName).toBe(
      `deleted_${originalDisplayName}_${user._id.toString().slice(-6)}`,
    );

    const newUser = await User.create({
      username: originalUsername,
      slug: originalSlug,
      displayName: originalDisplayName,
      email: originalEmail,
      password: "Password123",
    });

    expect(newUser).not.toBeNull();

    await deleteCurrentUserAccount(newUser);

    const deletedNewUser = await User.findById(newUser._id);

    expect(deletedNewUser.username).toBe(
      `deleted_${originalUsername}_${newUser._id.toString().slice(-6)}`,
    );
    expect(deletedNewUser.slug).toBe(
      `deleted-${originalSlug}-${newUser._id.toString().slice(-6)}`,
    );
    expect(deletedNewUser.email).toBe(
      `deleted.${originalEmail}.${newUser._id.toString().slice(-6)}`,
    );
    expect(deletedNewUser.displayName).toBe(
      `deleted_${originalDisplayName}_${newUser._id.toString().slice(-6)}`,
    );
  });

  test("should trim down the user's displayname and username to fit within the maximum length if needed upon deletion", async () => {
    const longUsername = "abcdefghijklmnopqrstuvwxyz123456";

    const user = await User.create({
      username: longUsername,
      slug: longUsername,
      displayName: longUsername,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await deleteCurrentUserAccount(user);

    const deletedUser = await User.findById(user._id);

    expect(deletedUser.username).toBe(
      `deleted_${longUsername.slice(0, 17)}_${user._id.toString().slice(-6)}`,
    );
    expect(deletedUser.displayName).toBe(
      `deleted_${longUsername.slice(0, 17)}_${user._id.toString().slice(-6)}`,
    );
  });

  test("should delete the user's recipe ratings upon account deletion", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: `testuser`,
      displayName: `testuser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const recipe = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      slug: `test-recipe-${testRecipeIndex++}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 4,
      ratingCount: 1,
    });

    await createTestRating(recipe._id, user._id, { rating: 4 });

    await deleteCurrentUserAccount(user);

    const rating = await Rating.findOne({
      user: user._id,
      recipe: recipe._id,
    });
    expect(rating).toBeNull();

    const updatedRecipe = await Recipe.findById(recipe._id);

    expect(updatedRecipe.aggregateRating).toBe(0);
    expect(updatedRecipe.ratingCount).toBe(0);
  });

  test("should delete the user's comment votes upon account deletion", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: `testuser`,
      displayName: `testuser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const recipe = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      slug: `test-recipe-${testRecipeIndex++}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(
      otherUser._id,
      testRecipe._id,
      null,
      { content: "Test comment 2", aggregateVote: 1 },
    );

    await createTestCommentVote(user._id, comment._id, "upvote");

    await deleteCurrentUserAccount(user);

    const vote = await CommentVote.findOne({
      authorId: user._id,
      comment: comment._id,
    });
    expect(vote).toBeNull();

    const updatedComment = await Comment.findById(comment._id);

    expect(updatedComment.aggregateVote).toBe(0);
  });

  test("should delete the users personal notes on recipes upon account deletion", async () => {
    const user = await createSecondaryTestUser({
      username: `testuser`,
      slug: `testuser`,
      displayName: `testuser`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const recipe = await createTestRecipe(testUser._id, {
      title: `Test Recipe ${testRecipeIndex}`,
      slug: `test-recipe-${testRecipeIndex++}`,
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestNote(user._id, recipe._id);

    const notes = await Note.find({
      authorId: user._id,
    });
    expect(notes).toHaveLength(1);

    await deleteCurrentUserAccount(user);

    const deletedNotes = await Note.find({
      authorId: user._id,
    });
    expect(deletedNotes).toHaveLength(0);
  });
});

// Test cases: getOtherUserProfileByUsername //
describe("getOtherUserProfileByUsername", () => {
  test("should return the public profile of another user by their username", async () => {
    const otherUser = await createSecondaryTestUser({
      username: "otheruser",
      slug: "otheruser",
      displayName: "Other User",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const profile = await getOtherUserProfileByUsername(otherUser.username);

    expect(profile).toHaveProperty("displayName", otherUser.displayName);
    expect(profile).toHaveProperty("slug", otherUser.slug);
    expect(profile).toHaveProperty("profileImage", otherUser.profileImage);
    expect(profile).toHaveProperty("lastLogin", otherUser.lastLogin);
    expect(profile).toHaveProperty("createdAt", otherUser.createdAt);
  });

  test("should throw an error if the specified user does not exist", async () => {
    const nonExistentUsername = "nonexistent";

    await expect(
      getOtherUserProfileByUsername(nonExistentUsername),
    ).rejects.toThrow("User not found");
  });

  test("should throw an error if the specified user has deleted their account", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isDeleted: true,
    });

    await expect(getOtherUserProfileByUsername(user.username)).rejects.toThrow(
      "User not found",
    );
  });
});

// Test cases: getOtherUserRecipesByUsername //
describe("getOtherUserRecipesByUsername", () => {
  test("should return a empty array if the user has no public recipes", async () => {
    const otherUser = await createSecondaryTestUser({
      username: "otheruser",
      slug: "otheruser",
      displayName: "Other User",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const recipes = await getOtherUserRecipesByUsername(
      otherUser.username,
      queryParamsEmpty,
    );

    expect(recipes.recipeList).toEqual([]);
  });

  test("should return only the public recipes of another user by their username", async () => {
    const otherUser = await createSecondaryTestUser({
      username: "otheruser",
      slug: "otheruser",
      displayName: "Other User",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    const publicRecipe = await createTestRecipe(otherUser._id, {
      title: "Public Recipe",
      slug: "public-recipe",
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
        isApproved: true,
      },
    });

    await createTestRecipe(otherUser._id, {
      title: "Private Recipe",
      slug: "private-recipe",
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const recipes = await getOtherUserRecipesByUsername(
      otherUser.username,
      queryParamsEmpty,
    );

    expect(recipes.recipeList).toHaveLength(1);
    expect(recipes.recipeList[0]).toHaveProperty("title", publicRecipe.title);
    expect(recipes.recipeList[0]).toHaveProperty("slug", publicRecipe.slug);
    expect(recipes.recipeList[0]).toHaveProperty("description", "");
    expect(recipes.recipeList[0]).toHaveProperty(
      "image.imageURL",
      "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
    );
    expect(recipes.recipeList[0]).not.toHaveProperty("image.publicId");
    expect(recipes.recipeList[0]).toHaveProperty("image.isApproved", true);
    expect(recipes.recipeList[0]).toHaveProperty(
      "preptimeSeconds",
      publicRecipe.preptimeSeconds,
    );
    expect(recipes.recipeList[0]).toHaveProperty(
      "cooktimeSeconds",
      publicRecipe.cooktimeSeconds,
    );
    expect(recipes.recipeList[0]).toHaveProperty("aggregateRating", 0);
    expect(recipes.recipeList[0]).toHaveProperty("ratingCount", 0);
    expect(recipes.recipeList[0]).toHaveProperty(
      "author.displayName",
      otherUser.displayName,
    );
    expect(recipes.recipeList[0]).toHaveProperty("isPublished", true);
    expect(recipes.recipeList[0]).not.toHaveProperty("ingredientSections");
    expect(recipes.recipeList[0]).not.toHaveProperty("stepSections");
    expect(recipes.recipeList[0]).not.toHaveProperty("servings");
    expect(recipes.recipeList[0]).not.toHaveProperty("notes");
    expect(recipes.recipeList[0]).not.toHaveProperty("linkedRecipes");
    expect(recipes.recipeList[0]).not.toHaveProperty("tags");
    expect(recipes.recipeList[0]).not.toHaveProperty("holidays");
    expect(recipes.recipeList[0]).not.toHaveProperty("seasons");
    expect(recipes.recipeList[0]).not.toHaveProperty("isDeleted");
    expect(recipes.recipeList[0]).not.toHaveProperty("deletedAt");
  });

  test("should only return recipes that are not deleted", async () => {
    const otherUser = await createSecondaryTestUser({
      username: "otheruser",
      slug: "otheruser",
      displayName: "Other User",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
    });

    await createTestRecipe(otherUser._id, {
      title: "Public Recipe",
      slug: "public-recipe-1",
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestRecipe(otherUser._id, {
      title: "Deleted Recipe",
      slug: "deleted-recipe",
      ingredientSections: [
        {
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const recipes = await getOtherUserRecipesByUsername(
      otherUser.username,
      queryParamsEmpty,
    );

    expect(recipes.recipeList).toHaveLength(1);
    expect(recipes.recipeList[0]).toHaveProperty("title", "Public Recipe");
  });

  test("should throw an error if the specified user does not exist", async () => {
    const nonExistentUsername = "nonexistent";

    await expect(
      getOtherUserRecipesByUsername(nonExistentUsername, queryParamsEmpty),
    ).rejects.toThrow("User not found");
  });

  test("should throw an error if the specified user has deleted their account", async () => {
    const user = await createSecondaryTestUser({
      username: "testuser",
      slug: "testuser",
      displayName: "testuser",
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isDeleted: true,
    });

    await expect(
      getOtherUserRecipesByUsername(user.username, queryParamsEmpty),
    ).rejects.toThrow("User not found");
  });
});
