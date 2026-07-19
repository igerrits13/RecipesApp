import { describe, expect, test } from "@jest/globals";

import {
  createTestUser,
  createTestIngredient,
  createTestRecipe,
  createTestComment,
} from "../../../src/utils/testFunctions.js";

import Recipe from "../../../src/models/recipe.model.js";
import User from "../../../src/models/user.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";
import Comment from "../../../src/models/comment.model.js";

import {
  getAllDeletedComments,
  getAllReportedComments,
  deleteCommentById,
} from "../../../src/services/admin/admin.comment.services.js";

// Base test setup //

let testUser;
let testIngredient;
let testRecipe;

// Create a test user and ingredient to be used in the tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});

  testUser = await createTestUser();
  testIngredient = await createTestIngredient();
  testRecipe = await createTestRecipe(testUser._id, {
    title: `Test Recipe`,
    slug: `test-recipe`,
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
    description: "This is a test recipe.",
  });
});

// Create a fresh test recipe before each test
beforeEach(async () => {
  await Comment.deleteMany({});
});

// Test cases: getAllDeletedComments //
describe("getAllDeletedComments", () => {
  test("should return an empty array if there are no soft deleted comments", async () => {
    const deletedComments = await getAllDeletedComments(1, 10, 0);

    expect(deletedComments.deletedComments.length).toBe(0);
    expect(deletedComments.totalComments).toBe(0);
    expect(deletedComments.totalPages).toBe(0);
    expect(deletedComments.currentPage).toBe(1);
  });

  test("should get all comments that have been soft deleted with pagination", async () => {
    const deletedCommentsData = [];

    for (let i = 0; i < 30; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          isDeleted: i % 2 === 0, // Soft delete every other comment
        },
      );
      deletedCommentsData.push(comment);
    }

    const deletedComments = await getAllDeletedComments(1, 10, 0);

    expect(deletedComments.deletedComments.length).toBe(10);
    expect(deletedComments.totalComments).toBe(15);
    expect(deletedComments.totalPages).toBe(2);
    expect(deletedComments.currentPage).toBe(1);
    // Check that the deleted comments are returned in the correct order (oldest first)
    for (let i = 0; i < deletedComments.deletedComments.length - 1; i++) {
      const currentComment = deletedComments.deletedComments[i];
      const nextComment = deletedComments.deletedComments[i + 1];
      expect(
        new Date(currentComment.createdAt) <= new Date(nextComment.createdAt),
      ).toBe(true);
      expect(currentComment._id.toString()).toBe(
        deletedCommentsData[i * 2]._id.toString(),
      );
    }
  });

  test("should get all comments regardless if they are a parent or child comment", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      {
        content: "This is a parent comment",
        isDeleted: true,
      },
    );

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      {
        content: "This is a child comment",
        isDeleted: true,
      },
    );

    const deletedComments = await getAllDeletedComments(1, 10, 0);

    expect(deletedComments.deletedComments.length).toBe(2);
    expect(deletedComments.totalComments).toBe(2);
    expect(deletedComments.totalPages).toBe(1);
    expect(deletedComments.currentPage).toBe(1);
    expect(deletedComments.deletedComments[0]._id.toString()).toBe(
      parentComment._id.toString(),
    );
    expect(deletedComments.deletedComments[1]._id.toString()).toBe(
      childComment._id.toString(),
    );
  });
});

// Test cases: getAllReportedComments //
describe("getAllReportedComments", () => {
  test("should return an empty array if there are no reported comments", async () => {
    const reportedComments = await getAllReportedComments(1, 10, 0);

    expect(reportedComments.reportedComments.length).toBe(0);
    expect(reportedComments.totalComments).toBe(0);
    expect(reportedComments.totalPages).toBe(0);
    expect(reportedComments.currentPage).toBe(1);
  });

  test("should get all comments that have been reported with pagination", async () => {
    const reportedCommentsData = [];

    for (let i = 0; i < 30; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          reportCount: i % 2 === 0 ? Math.min(i + 1, 5) : 0, // Report every other comment with increasing report count up to 5
        },
      );
      reportedCommentsData.push(comment);
    }

    const reportedComments = await getAllReportedComments(1, 10, 0);

    expect(reportedComments.reportedComments.length).toBe(10);
    expect(reportedComments.totalComments).toBe(15);
    expect(reportedComments.totalPages).toBe(2);
    expect(reportedComments.currentPage).toBe(1);
    // Check that the reported comments are returned in the correct order (most reported first, then oldest first)
    for (let i = 0; i < reportedComments.reportedComments.length - 1; i++) {
      const currentComment = reportedComments.reportedComments[i];
      const nextComment = reportedComments.reportedComments[i + 1];
      expect(currentComment.reportCount).toBeGreaterThan(0);
      expect(nextComment.reportCount).toBeGreaterThan(0);
      if (currentComment.reportCount === nextComment.reportCount) {
        expect(
          new Date(currentComment.createdAt) <= new Date(nextComment.createdAt),
        ).toBe(true);
      } else {
        expect(currentComment.reportCount >= nextComment.reportCount).toBe(
          true,
        );
      }
    }
  });

  test("should get all comments regardless if they are a parent or child comment", async () => {
    const parentComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      null,
      {
        content: "This is a parent comment",
        reportCount: 5,
      },
    );

    const childComment = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      {
        content: "This is a child comment",
        reportCount: 3,
      },
    );

    const childComment2 = await createTestComment(
      testUser._id,
      testRecipe._id,
      parentComment._id,
      {
        content: "This is another child comment",
        reportCount: 5,
      },
    );

    const reportedComments = await getAllReportedComments(1, 10, 0);

    expect(reportedComments.reportedComments.length).toBe(3);
    expect(reportedComments.totalComments).toBe(3);
    expect(reportedComments.totalPages).toBe(1);
    expect(reportedComments.currentPage).toBe(1);
    // The parent comment and child comment 2 should be returned first since they have the same report count and
    //  parent comment is older than child comment 2, then the child comment should be returned last since it has a
    //  lower report count
    expect(reportedComments.reportedComments[0]._id.toString()).toBe(
      parentComment._id.toString(),
    );
    expect(reportedComments.reportedComments[1]._id.toString()).toBe(
      childComment2._id.toString(),
    );
    expect(reportedComments.reportedComments[2]._id.toString()).toBe(
      childComment._id.toString(),
    );
  });
});

// Test cases: deleteCommentById //
describe("deleteCommentById", () => {
  test("should permanently delete the comment from the database", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const commentInDb = await Comment.findById(comment._id);
    expect(commentInDb).not.toBeNull();

    await deleteCommentById(comment._id);

    const deletedComment = await Comment.findById(comment._id);

    expect(deletedComment).toBeNull();
  });

  test("should throw an error if the comment was not found", async () => {
    const nonExistentCommentId = "64b64c8f9f1b2c0012345678";

    await expect(deleteCommentById(nonExistentCommentId)).rejects.toThrow(
      "Comment not found",
    );
  });
});
