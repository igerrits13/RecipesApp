import mongoose from "mongoose";
import { beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import Comment from "../../src/models/comment.model";
import User from "../../src/models/user.model";
import Recipe from "../../src/models/recipe.model";
import Ingredient from "../../src/models/ingredient.model";
import CommentVote from "../../src/models/commentVote.model";

import {
  createTestUser,
  createSecondaryTestUser,
  createTestRecipe,
  createTestIngredient,
  customComment,
  createTestComment,
  createTestParentComments,
  createTestChildComments,
  createTestCommentVote,
} from "../../src/utils/testFunctions.js";

import {
  categorizeComments,
  getAllCommentIds,
  deleteCommentVotesByCommentId,
  attachUserVotesToComments,
  getAllUserComments,
  updateSpecificCommentById,
  undoSpecificCommentEditById,
  voteOnSpecificCommentById,
  deleteSpecificCommentById,
} from "../../src/services/comment.services";

// Base test setup //

let testUser;
let otherUser;
let testRecipe;
let testIngredient;
let testUserIndex = 0;
const page = 1;
const limit = 5;
const offset = (page - 1) * limit;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser = await createTestUser();
  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    slug: "otheruser",
    displayName: "OtherUser",
    email: `${crypto.randomUUID()}@example.com`,
    password: "Password123",
  });
  testIngredient = await createTestIngredient();
});

// Delete all recipes and comments before each test
beforeEach(async () => {
  await Comment.deleteMany({});
  await Recipe.deleteMany({});
  await CommentVote.deleteMany({});

  testRecipe = await createTestRecipe(testUser._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
  });
});

// Test cases: categorizeComments //
describe("categorizeComments", () => {
  test("should categorize comments into parent and child comments with only parent comments", async () => {
    const comments = await createTestParentComments(
      testUser._id,
      testRecipe._id,
      5,
    );

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(5);
    categorizedComments.forEach((comment) => {
      expect(comment.replies).toBeDefined();
      expect(comment.replies.length).toBe(0);
    });
  });

  test("should categorize comments into parent and child comments with both parent and child comments", async () => {
    // Create 3 parent comments for the test recipe
    const parentComments = await createTestParentComments(
      testUser._id,
      testRecipe._id,
      3,
    );

    // Create 2 child comments for each parent comment
    const childComments = [];
    for (const parentComment of parentComments) {
      const children = await createTestChildComments(
        testUser._id,
        testRecipe._id,
        parentComment._id,
        2,
      );
      childComments.push(...children);
    }

    // Combine the parent and child comments into one array and categorize them
    const allComments = [...parentComments, ...childComments];
    const categorizedComments = categorizeComments(allComments);

    // Check that the parent comments are categorized correctly and that each parent comment has the correct child comments
    expect(categorizedComments.length).toBe(3);
    categorizedComments.forEach((comment) => {
      expect(comment.replies).toBeDefined();
      expect(comment.replies.length).toBe(2);
      comment.replies.forEach((reply) => {
        expect(reply.parentCommentId.toString()).toBe(comment._id.toString());
      });
    });
  });

  test("should not add child comment if the parent comment does not exist", async () => {
    const parentCommentId = new mongoose.Types.ObjectId();

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentCommentId,
      customComment(1),
    );

    const categorizedComments = categorizeComments([childComment]);

    expect(categorizedComments.length).toBe(0);
  });

  test("should not include comments created by banned users", async () => {
    const bannedUser = await createTestUser({
      username: `banneduser${testUserIndex}`,
      slug: `banneduser${testUserIndex}`,
      displayName: `BannedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isBanned: true,
    });

    const nonBannedComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );
    const bannedComment = await createTestComment(
      bannedUser._id,
      testRecipe._id,
      null,
    );
    const bannedChildComment = await createTestComment(
      bannedUser._id,
      testRecipe._id,
      nonBannedComment._id,
    );

    const comments = await Comment.find({
      _id: {
        $in: [nonBannedComment._id, bannedComment._id, bannedChildComment._id],
      },
    }).populate("authorId", "isBanned");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(1);
    expect(categorizedComments[0]._id.toString()).toBe(
      nonBannedComment._id.toString(),
    );
    expect(categorizedComments[0].replies.length).toBe(0);
  });

  test("should not include replies to comments made by banned users", async () => {
    const bannedUser = await createTestUser({
      username: `banneduser${testUserIndex}`,
      slug: `banneduser${testUserIndex}`,
      displayName: `BannedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isBanned: true,
    });

    const nonBannedComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );
    const bannedComment = await createTestComment(
      bannedUser._id,
      testRecipe._id,
      null,
    );
    const nonBannedChildComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      bannedComment._id,
    );

    const comments = await Comment.find({
      _id: {
        $in: [
          nonBannedComment._id,
          bannedComment._id,
          nonBannedChildComment._id,
        ],
      },
    }).populate("authorId", "isBanned");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(1);
    expect(categorizedComments[0]._id.toString()).toBe(
      nonBannedComment._id.toString(),
    );
    expect(categorizedComments[0].replies.length).toBe(0);
  });

  test("should set display name to 'Deleted User' and profile image to null for comments made by deleted users", async () => {
    const deletedUser = await createTestUser({
      username: `deleteduser${testUserIndex}`,
      slug: `deleteduser${testUserIndex}`,
      displayName: `DeletedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isDeleted: true,
    });

    const commentByDeletedUser = await createTestComment(
      deletedUser._id,
      testRecipe._id,
      null,
    );

    const comments = await Comment.find({
      _id: commentByDeletedUser._id,
    }).populate("authorId", "isDeleted");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(1);
    expect(categorizedComments[0]._id.toString()).toBe(
      commentByDeletedUser._id.toString(),
    );
    expect(categorizedComments[0].authorId.displayName).toBe("Deleted User");
    expect(categorizedComments[0].authorId.profileImage).toBeNull();
  });

  test("should set display name to 'Deleted User' and profile image to null for replies to comments made by deleted users", async () => {
    const deletedUser = await createTestUser({
      username: `deleteduser${testUserIndex}`,
      slug: `deleteduser${testUserIndex}`,
      displayName: `DeletedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isDeleted: true,
    });

    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );

    const childComment = await createTestComment(
      deletedUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const comments = await Comment.find({
      _id: { $in: [parentComment._id, childComment._id] },
    }).populate("authorId", "isDeleted");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(1);
    expect(categorizedComments[0]._id.toString()).toBe(
      parentComment._id.toString(),
    );
    expect(categorizedComments[0].replies.length).toBe(1);
    expect(categorizedComments[0].replies[0].authorId.displayName).toBe(
      "Deleted User",
    );
    expect(categorizedComments[0].replies[0].authorId.profileImage).toBeNull();
  });

  test("should not display a parent comment or its child comments if the parent comment's author is banned", async () => {
    const bannedUser = await createTestUser({
      username: `banneduser${testUserIndex}`,
      slug: `banneduser${testUserIndex}`,
      displayName: `BannedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isBanned: true,
    });

    const parentComment = await createTestComment(
      bannedUser._id,
      testRecipe._id,
      null,
    );

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const comments = await Comment.find({
      _id: { $in: [parentComment._id, childComment._id] },
    }).populate("authorId", "isBanned");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(0);
  });

  test("should not display child comments from a user that has been banned", async () => {
    const bannedUser = await createTestUser({
      username: `banneduser${testUserIndex}`,
      slug: `banneduser${testUserIndex}`,
      displayName: `BannedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isBanned: true,
    });

    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );

    const childComment = await createTestComment(
      bannedUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const comments = await Comment.find({
      _id: { $in: [parentComment._id, childComment._id] },
    }).populate("authorId", "isBanned");

    const categorizedComments = categorizeComments(comments);

    expect(categorizedComments.length).toBe(1);
    expect(categorizedComments[0]._id.toString()).toBe(
      parentComment._id.toString(),
    );
    expect(categorizedComments[0].replies.length).toBe(0);
  });
});

// Test cases: getAllCommentIds //
describe("getAllCommentIds", () => {
  test("should return an empty array if there are no comments", () => {
    const commentIds = getAllCommentIds([]);

    expect(commentIds.length).toBe(0);
  });

  test("should return an array of comment IDs from an array of comments and their replies", async () => {
    const comment1 = await createTestComment(testUser._id, testRecipe._id);
    const comment2 = await createTestComment(testUser._id, testRecipe._id);

    comment1.replies = [];
    comment2.replies = [];

    const commentIds = getAllCommentIds([comment1, comment2]);

    expect(commentIds.length).toBe(2);
    expect(commentIds).toContain(comment1._id);
    expect(commentIds).toContain(comment2._id);
  });

  test("should return an array of comment IDs including both parent and child comments", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);
    const childComment1 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      customComment(1),
    );

    const childComment2 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      customComment(2),
    );

    parentComment.replies = [childComment1, childComment2];

    const commentIds = getAllCommentIds([parentComment]);

    expect(commentIds.length).toBe(3);
    expect(commentIds).toContain(parentComment._id);
    expect(commentIds).toContain(childComment1._id);
    expect(commentIds).toContain(childComment2._id);
  });
});

// Test cases: deleteCommentVotesByCommentId //
describe("deleteCommentVotesByCommentId", () => {
  test("should delete all comment votes for a specific comment ID and its child comment IDs", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );
    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const commentVote1 = await createTestCommentVote(
      otherUser._id,
      parentComment._id,
      "upvote",
    );
    const commentVote2 = await createTestCommentVote(
      otherUser._id,
      childComment._id,
      "downvote",
    );

    await deleteCommentVotesByCommentId(parentComment._id);

    const deletedCommentVote1 = await CommentVote.findById(commentVote1._id);
    const deletedCommentVote2 = await CommentVote.findById(commentVote2._id);

    expect(deletedCommentVote1).toBeNull();
    expect(deletedCommentVote2).toBeNull();
  });

  test("should not delete comment votes for parent comment IDs", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );
    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const commentVote1 = await createTestCommentVote(
      otherUser._id,
      parentComment._id,
      "upvote",
    );
    const commentVote2 = await createTestCommentVote(
      otherUser._id,
      childComment._id,
      "downvote",
    );

    await deleteCommentVotesByCommentId(childComment._id);

    const deletedCommentVote1 = await CommentVote.findById(commentVote1._id);
    const deletedCommentVote2 = await CommentVote.findById(commentVote2._id);

    expect(deletedCommentVote1).toBeDefined();
    expect(deletedCommentVote1._id.toString()).toBe(
      commentVote1._id.toString(),
    );
    expect(deletedCommentVote2).toBeNull();
  });

  test("should not delete comment votes for unrelated comment IDs", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
    );
    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );
    const unrelatedComment = await createTestComment(
      testUser._id,
      testRecipe._id,
    );

    const commentVote1 = await createTestCommentVote(
      otherUser._id,
      parentComment._id,
      "upvote",
    );
    const commentVote2 = await createTestCommentVote(
      otherUser._id,
      unrelatedComment._id,
      "downvote",
    );

    await deleteCommentVotesByCommentId(parentComment._id);

    const deletedCommentVote1 = await CommentVote.findById(commentVote1._id);
    const deletedCommentVote2 = await CommentVote.findById(commentVote2._id);

    expect(deletedCommentVote1).toBeNull();
    expect(deletedCommentVote2).toBeDefined();
    expect(deletedCommentVote2._id.toString()).toBe(
      commentVote2._id.toString(),
    );
  });
});

// Test cases: attatchUserVotesToComments //
describe("attachUserVotesToComments", () => {
  test("should return the same comments with userVoteType set to null if the user has not voted on any comments", async () => {
    const comment1 = await createTestComment(testUser._id, testRecipe._id);
    const comment2 = await createTestComment(testUser._id, testRecipe._id);

    comment1.replies = [];
    comment2.replies = [];

    const commentsWithVotes = await attachUserVotesToComments(
      [comment1, comment2],
      testUser._id,
    );

    expect(commentsWithVotes.length).toBe(2);
    commentsWithVotes.forEach((comment) => {
      expect(comment.userVote).toBeNull();
    });
  });

  test("should set userVoteType to 'upvote' for comments the user has upvoted and 'downvote' for comments the user has downvoted", async () => {
    const comment1 = await createTestComment(testUser._id, testRecipe._id);
    const comment2 = await createTestComment(testUser._id, testRecipe._id);

    comment1.replies = [];
    comment2.replies = [];

    await CommentVote.create({
      authorId: testUser._id,
      commentId: comment1._id,
      voteType: "upvote",
    });

    await CommentVote.create({
      authorId: testUser._id,
      commentId: comment2._id,
      voteType: "downvote",
    });

    const commentsWithVotes = await attachUserVotesToComments(
      [comment1, comment2],
      testUser._id,
    );

    expect(commentsWithVotes.length).toBe(2);

    const comment1WithVote = commentsWithVotes.find(
      (comment) => comment._id.toString() === comment1._id.toString(),
    );
    const comment2WithVote = commentsWithVotes.find(
      (comment) => comment._id.toString() === comment2._id.toString(),
    );

    expect(comment1WithVote.userVote).toBe("upvote");
    expect(comment2WithVote.userVote).toBe("downvote");
  });

  test("should set userVoteType to 'upvote' or 'downvote' for any child comments the user has voted on", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      customComment(1),
    );

    parentComment.replies = [childComment];

    await CommentVote.create({
      authorId: testUser._id,
      commentId: childComment._id,
      voteType: "upvote",
    });

    const commentsWithVotes = await attachUserVotesToComments(
      [parentComment],
      testUser._id,
    );

    expect(commentsWithVotes.length).toBe(1);

    const parentCommentWithVote = commentsWithVotes[0];

    expect(parentCommentWithVote.userVote).toBeNull();
    expect(parentCommentWithVote.replies.length).toBe(1);
    expect(parentCommentWithVote.replies[0].userVote).toBe("upvote");
  });
});

// Test cases: getAllUserComments //
describe("getAllUserComments", () => {
  test("should retrieve all comments for a user with pagination", async () => {
    for (let i = 1; i <= 15; i++) {
      await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        customComment(i),
      );
    }

    const result = await getAllUserComments(testUser._id, page, limit, offset);

    expect(result.comments.length).toBe(5);
    expect(result.currentPage).toBe(page);
    expect(result.totalComments).toBe(15);
    expect(result.totalPages).toBe(3);
  });

  test("should return an empty array if the user has no comments", async () => {
    const result = await getAllUserComments(otherUser._id, page, limit, offset);

    expect(result.comments.length).toBe(0);
  });

  test("should not retrieve deleted comments for the user", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);
    await Comment.findByIdAndUpdate(comment._id, { isDeleted: true });

    const result = await getAllUserComments(testUser._id, page, limit, offset);

    expect(result.comments.length).toBe(0);
  });

  test("should not retrieve comments for other users", async () => {
    await createTestComment(testUser._id, testRecipe._id);
    await createTestComment(otherUser._id, testRecipe._id);

    const result = await getAllUserComments(testUser._id, page, limit, offset);

    expect(result.comments.length).toBe(1);
    expect(result.comments[0].authorId._id.toString()).toBe(
      testUser._id.toString(),
    );
  });

  test("should populate user and recipe information for the comments", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const result = await getAllUserComments(testUser._id, page, limit, offset);

    expect(result.comments.length).toBe(1);
    expect(result.comments[0].authorId._id.toString()).toBe(
      testUser._id.toString(),
    );
    expect(result.comments[0].recipeId._id.toString()).toBe(
      testRecipe._id.toString(),
    );
    expect(result.comments[0].authorId.displayName).toBe(testUser.displayName);
    expect(result.comments[0].authorId.profileImage).toBe(
      testUser.profileImage,
    );
    expect(result.comments[0].recipeId.title).toBe(testRecipe.title);
    expect(result.comments[0].recipeId.author._id.toString()).toBe(
      testUser._id.toString(),
    );
    expect(result.comments[0].recipeId.author.displayName).toBe(
      testUser.displayName,
    );
    expect(result.comments[0].recipeId.author.profileImage).toBe(
      testUser.profileImage,
    );
  });
});

// Test cases: updateSpecificCommentById //
describe("updateSpecificCommentById", () => {
  test("should update the content of a comment with valid input", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const newContent = "This is the updated comment content.";

    const updatedComment = await updateSpecificCommentById(
      comment._id,
      testUser._id,
      newContent,
    );

    expect(updatedComment).toBeDefined();
    expect(updatedComment._id.toString()).toBe(comment._id.toString());
    expect(updatedComment.recipeId.toString()).toBe(testRecipe._id.toString());
    expect(updatedComment.authorId._id.toString()).toBe(
      testUser._id.toString(),
    );
    expect(updatedComment.authorId.displayName).toBe(testUser.displayName);
    expect(updatedComment.authorId.profileImage).toBe(testUser.profileImage);
    expect(updatedComment.content).toBe(newContent);
    expect(updatedComment.originalContent).toBe(comment.content);
    expect(updatedComment.isEdited).toBe(true);
    expect(updatedComment.isDeleted).not.toBeDefined();
  });

  test("should not change original content or isEdited if the comment was already edited before", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const firstUpdateContent = "This is the first update to the comment.";

    const firstUpdatedComment = await updateSpecificCommentById(
      comment._id,
      testUser._id,
      firstUpdateContent,
    );

    expect(firstUpdatedComment.originalContent).toBe(comment.content);
    expect(firstUpdatedComment.content).toBe(firstUpdateContent);
    expect(firstUpdatedComment.isEdited).toBe(true);

    const secondUpdateContent = "This is the second update to the comment.";

    const secondUpdatedComment = await updateSpecificCommentById(
      comment._id,
      testUser._id,
      secondUpdateContent,
    );

    expect(secondUpdatedComment.originalContent).toBe(comment.content);
    expect(secondUpdatedComment.content).toBe(secondUpdateContent);
    expect(secondUpdatedComment.isEdited).toBe(true);
  });

  test("should trim extra whitespace from the new content", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const newContent =
      "   This is the updated comment content with extra whitespace.   ";

    const updatedComment = await updateSpecificCommentById(
      comment._id,
      testUser._id,
      newContent,
    );

    expect(updatedComment).toBeDefined();
    expect(updatedComment.content).toBe(newContent.trim());
  });

  test("should allow updating a child comment", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const newContent = "This is the updated child comment content.";

    const updatedComment = await updateSpecificCommentById(
      childComment._id,
      testUser._id,
      newContent,
    );

    expect(updatedComment).toBeDefined();
    expect(updatedComment._id.toString()).toBe(childComment._id.toString());
    expect(updatedComment.content).toBe(newContent);
    expect(updatedComment.parentCommentId.toString()).toBe(
      parentComment._id.toString(),
    );
  });

  test("should throw an error if content is missing", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await expect(
      updateSpecificCommentById(comment._id, testUser._id),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if content is empty after trimming", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const content = "     ";

    await expect(
      updateSpecificCommentById(comment._id, testUser._id, content),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if content exceeds the maximum length", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const content = "a".repeat(501);

    await expect(
      updateSpecificCommentById(comment._id, testUser._id, content),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if the comment does not exist", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();
    const content = "This is an update for a non-existent comment.";

    await expect(
      updateSpecificCommentById(nonExistentCommentId, testUser._id, content),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the user is not the author of the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);
    const content = "This is an update attempt by a different user.";

    await expect(
      updateSpecificCommentById(comment._id, otherUser._id, content),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the comment is deleted", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);
    await Comment.findByIdAndUpdate(comment._id, { isDeleted: true });

    const content = "This is an update attempt for a deleted comment.";

    await expect(
      updateSpecificCommentById(comment._id, testUser._id, content),
    ).rejects.toThrow("Comment not found");
  });
});

// Test cases: undoSpecificCommentEditById //
describe("undoSpecificCommentEditById", () => {
  test("should revert the content of an edited comment to its original content", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const originalComment = comment;

    const newContent = "This is the updated comment content.";

    await Comment.findByIdAndUpdate(comment._id, {
      content: newContent,
      originalContent: comment.content,
      isEdited: true,
    });

    const updatedComment = await Comment.findById(comment._id)
      .populate("authorId", "displayName profileImage")
      .select("content originalContent isEdited recipeId authorId isDeleted");

    expect(updatedComment.content).toBe(newContent);
    expect(updatedComment.originalContent).toBe(comment.content);
    expect(updatedComment.isEdited).toBe(true);

    const undoneComment = await undoSpecificCommentEditById(
      comment._id,
      testUser._id,
    );

    expect(undoneComment.content).toBe(comment.content);
    expect(undoneComment.originalContent).toBeNull();
    expect(undoneComment.isEdited).toBe(false);
    expect(undoneComment._id.toString()).toBe(comment._id.toString());
    expect(undoneComment.recipeId.toString()).toBe(testRecipe._id.toString());
    expect(undoneComment.authorId._id.toString()).toBe(testUser._id.toString());
    expect(undoneComment.authorId.displayName).toBe(testUser.displayName);
    expect(undoneComment.authorId.profileImage).toBe(testUser.profileImage);
    expect(undoneComment.isDeleted).not.toBeDefined();
  });

  test("should throw an error if the comment does not exist", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    await expect(
      undoSpecificCommentEditById(nonExistentCommentId, testUser._id),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the user is not the author of the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await expect(
      undoSpecificCommentEditById(comment._id, otherUser._id),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the comment is not edited", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await expect(
      undoSpecificCommentEditById(comment._id, testUser._id),
    ).rejects.toThrow("No edit to undo for this comment");
  });

  test("should throw an error if the comment does not have original content to revert to", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    comment.isEdited = true;
    await comment.save();

    await expect(
      undoSpecificCommentEditById(comment._id, testUser._id),
    ).rejects.toThrow("No edit to undo for this comment");
  });
});

// Test cases: voteOnSpecificCommentById //
describe("voteOnSpecificCommentById", () => {
  test("should add a upvote from the other user to the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    expect(comment.aggregateVote).toBe(0);

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "upvote",
    );

    const commentVote = await CommentVote.findOne({
      commentId: comment._id,
      authorId: otherUser._id,
    });

    expect(updatedComment.aggregateVote).toBe(1);
    expect(commentVote).toBeDefined();
    expect(commentVote.commentId.toString()).toBe(
      updatedComment._id.toString(),
    );
    expect(commentVote.authorId.toString()).toBe(otherUser._id.toString());
    expect(commentVote.voteType).toBe("upvote");
  });

  test("should remove the upvote from the other user if they have already upvoted the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const commentVote = await CommentVote.create({
      commentId: comment._id,
      authorId: otherUser._id,
      voteType: "upvote",
    });

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "upvote",
    );

    const removedCommentVote = await CommentVote.findById(commentVote._id);

    expect(updatedComment.aggregateVote).toBe(-1);
    expect(removedCommentVote).toBeNull();
  });

  test("should change a downvote from the other user to an upvote", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const commentVote = await CommentVote.create({
      commentId: comment._id,
      authorId: otherUser._id,
      voteType: "downvote",
    });

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "upvote",
    );

    const updatedCommentVote = await CommentVote.findById(commentVote._id);

    expect(updatedComment.aggregateVote).toBe(2);
    expect(updatedCommentVote).toBeDefined();
    expect(updatedCommentVote._id.toString()).toBe(commentVote._id.toString());
    expect(updatedCommentVote.commentId.toString()).toBe(
      updatedComment._id.toString(),
    );
    expect(updatedCommentVote.authorId.toString()).toBe(
      otherUser._id.toString(),
    );
    expect(updatedCommentVote.voteType).toBe("upvote");
  });

  test("should add a downvote from the other user to the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    expect(comment.aggregateVote).toBe(0);

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "downvote",
    );

    const commentVote = await CommentVote.findOne({
      commentId: comment._id,
      authorId: otherUser._id,
    });

    expect(updatedComment.aggregateVote).toBe(-1);
    expect(commentVote).toBeDefined();
    expect(commentVote.commentId.toString()).toBe(
      updatedComment._id.toString(),
    );
    expect(commentVote.authorId.toString()).toBe(otherUser._id.toString());
    expect(commentVote.voteType).toBe("downvote");
  });

  test("should remove the downvote from the other user if they have already downvoted the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const commentVote = await CommentVote.create({
      commentId: comment._id,
      authorId: otherUser._id,
      voteType: "downvote",
    });

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "downvote",
    );

    const removedCommentVote = await CommentVote.findById(commentVote._id);

    expect(updatedComment.aggregateVote).toBe(1);
    expect(removedCommentVote).toBeNull();
  });

  test("should change an upvote from the other user to a downvote", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const commentVote = await CommentVote.create({
      commentId: comment._id,
      authorId: otherUser._id,
      voteType: "upvote",
    });

    const updatedComment = await voteOnSpecificCommentById(
      comment._id,
      otherUser._id,
      "downvote",
    );

    const updatedCommentVote = await CommentVote.findById(commentVote._id);

    expect(updatedComment.aggregateVote).toBe(-2);
    expect(updatedCommentVote).toBeDefined();
    expect(updatedCommentVote._id.toString()).toBe(commentVote._id.toString());
    expect(updatedCommentVote.commentId.toString()).toBe(
      updatedComment._id.toString(),
    );
    expect(updatedCommentVote.authorId.toString()).toBe(
      otherUser._id.toString(),
    );
    expect(updatedCommentVote.voteType).toBe("downvote");
  });

  test("should throw an error if the comment does not exist", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    await expect(
      voteOnSpecificCommentById(
        nonExistentCommentId,
        otherUser._id,
        "downvote",
      ),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the user tries to vote on their own comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await expect(
      voteOnSpecificCommentById(comment._id, testUser._id, "downvote"),
    ).rejects.toThrow("Users cannot vote on their own comments");
  });
});

// Test cases: deleteSpecificCommentById //
describe("deleteSpecificCommentById", () => {
  test("should soft delete the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await deleteSpecificCommentById(comment._id, testUser._id);

    const deletedComment = await Comment.findById(comment._id)
      .populate("authorId", "displayName profileImage")
      .select(
        "isDeleted recipeId authorId content originalContent parentCommentId isEdited",
      );

    expect(deletedComment).toBeDefined();
    expect(deletedComment._id.toString()).toBe(comment._id.toString());
    expect(deletedComment.isDeleted).toBe(true);
    expect(deletedComment.recipeId.toString()).toBe(testRecipe._id.toString());
    expect(deletedComment.authorId._id.toString()).toBe(
      testUser._id.toString(),
    );
    expect(deletedComment.authorId.displayName).toBe(testUser.displayName);
    expect(deletedComment.authorId.profileImage).toBe(testUser.profileImage);
    expect(deletedComment.content).toBe(comment.content);
    expect(deletedComment.originalContent).toBe(comment.originalContent);
    expect(deletedComment.parentCommentId).toBe(comment.parentCommentId);
    expect(deletedComment.isEdited).toBe(comment.isEdited);
  });

  test("should soft delete all child comments when a parent comment is deleted", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);

    const childComment1 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const childComment2 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    await deleteSpecificCommentById(parentComment._id, testUser._id);

    const deletedParentComment = await Comment.findById(
      parentComment._id,
    ).select("isDeleted");
    const deletedChildComment1 = await Comment.findById(
      childComment1._id,
    ).select("isDeleted");
    const deletedChildComment2 = await Comment.findById(
      childComment2._id,
    ).select("isDeleted");

    expect(deletedParentComment.isDeleted).toBe(true);
    expect(deletedChildComment1.isDeleted).toBe(true);
    expect(deletedChildComment2.isDeleted).toBe(true);
  });

  test("should soft delete a child comment without affecting the parent comment", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    await deleteSpecificCommentById(childComment._id, testUser._id);

    const deletedChildComment = await Comment.findById(childComment._id).select(
      "isDeleted",
    );

    const parentCommentAfterDeletion = await Comment.findById(
      parentComment._id,
    ).select("isDeleted");

    expect(deletedChildComment.isDeleted).toBe(true);
    expect(parentCommentAfterDeletion.isDeleted).toBe(false);
  });

  test("should delete all comment votes associated with the deleted comment and its child comments", async () => {
    const parentComment = await createTestComment(testUser._id, testRecipe._id);
    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
    );

    const commentVote1 = await createTestCommentVote(
      otherUser._id,
      parentComment._id,
      "upvote",
    );
    const commentVote2 = await createTestCommentVote(
      otherUser._id,
      childComment._id,
      "downvote",
    );

    await deleteSpecificCommentById(parentComment._id, testUser._id);

    const deletedCommentVote1 = await CommentVote.findById(commentVote1._id);
    const deletedCommentVote2 = await CommentVote.findById(commentVote2._id);

    expect(deletedCommentVote1).toBeNull();
    expect(deletedCommentVote2).toBeNull();
  });

  test("should throw an error if the comment does not exist", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    await expect(
      deleteSpecificCommentById(nonExistentCommentId, testUser._id),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the user is not the author of the comment", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    await expect(
      deleteSpecificCommentById(comment._id, otherUser._id),
    ).rejects.toThrow("Comment not found");
  });

  test("should throw an error if the comment is already deleted", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);
    await Comment.findByIdAndUpdate(comment._id, { isDeleted: true });

    await expect(
      deleteSpecificCommentById(comment._id, testUser._id),
    ).rejects.toThrow("Comment not found");
  });
});
