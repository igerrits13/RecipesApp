import mongoose from "mongoose";
import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../../src/app.js";

import {
  createTestRecipe,
  getAuthenticatedAgent,
  createTestUser,
  createTestIngredient,
  testUserData,
  createTestModeratorUser,
  createTestAdminUser,
  createTestComment,
} from "../../../src/utils/testFunctions.js";

import User from "../../../src/models/user.model.js";
import Recipe from "../../../src/models/recipe.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";
import Comment from "../../../src/models/comment.model.js";

// Base test setup //

let testUser;
let loginAgent;
let moderatorUser;
let moderatorAgent;
let adminUser;
let adminAgent;
let testRecipe;
let testIngredient;

// Delete all users and create a new authenticated agent before running the tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser = await createTestUser(testUserData);
  loginAgent = await getAuthenticatedAgent(testUser);
  moderatorUser = await createTestModeratorUser();
  moderatorAgent = await getAuthenticatedAgent(moderatorUser);
  adminUser = await createTestAdminUser();
  adminAgent = await getAuthenticatedAgent(adminUser);
  testIngredient = await createTestIngredient();
});

beforeEach(async () => {
  await Recipe.deleteMany({});
  await Comment.deleteMany({});

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

// Test cases: getDeletedComments //
describe("GET /api/v1/admin/comments/deleted", () => {
  it("should return an empty array if there are no deleted comments", async () => {
    const res = await adminAgent.get("/api/v1/admin/comments/deleted");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.deletedComments.length).toBe(0);
    expect(res.body.comments.currentPage).toBe(1);
    expect(res.body.comments.totalComments).toBe(0);
    expect(res.body.comments.totalPages).toBe(0);
  });

  it("should return all deleted comments with pagination in order oldest first", async () => {
    // Create 15 comments and soft delete them
    const comments = [];
    for (let i = 0; i < 15; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          isDeleted: true,
        },
      );
      comments.push(comment);
    }

    const res = await adminAgent.get("/api/v1/admin/comments/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.deletedComments.length).toBe(10);
    expect(res.body.comments.currentPage).toBe(1);
    expect(res.body.comments.totalComments).toBe(15);
    expect(res.body.comments.totalPages).toBe(2);
  });

  it("should return all deleted comments with pagination in order oldest first with query parameters", async () => {
    // Create 15 comments and soft delete them
    const comments = [];
    for (let i = 0; i < 15; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          isDeleted: true,
        },
      );
      comments.push(comment);
    }

    const res = await adminAgent.get(
      "/api/v1/admin/comments/deleted?page=2&limit=5",
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.deletedComments.length).toBe(5);
    expect(res.body.comments.currentPage).toBe(2);
    expect(res.body.comments.totalComments).toBe(15);
    expect(res.body.comments.totalPages).toBe(3);
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/comments/deleted");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/comments/deleted");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/comments/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/comments/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: getReportedComments //
describe("GET /api/v1/admin/comments/reported", () => {
  it("should return an empty array if there are no reported comments", async () => {
    const res = await adminAgent.get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.reportedComments.length).toBe(0);
    expect(res.body.comments.currentPage).toBe(1);
    expect(res.body.comments.totalComments).toBe(0);
    expect(res.body.comments.totalPages).toBe(0);
  });

  it("should return all reported comments with pagination in order most reported first and then oldest first", async () => {
    // Create 15 comments and report them with varying report counts
    const comments = [];

    for (let i = 0; i < 15; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          reportCount: i % 5 === 0 ? 5 : i % 5, // Report every 5th comment with 5 reports and the rest with varying reports from 0 to 4
        },
      );
      comments.push(comment);
    }

    const res = await adminAgent.get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.reportedComments.length).toBe(10);
    expect(res.body.comments.currentPage).toBe(1);
    expect(res.body.comments.totalComments).toBe(15);
    expect(res.body.comments.totalPages).toBe(2);
    // Check that the reported comments are returned in the correct order (most reported first, then oldest first)
    for (let i = 0; i < res.body.comments.reportedComments.length - 1; i++) {
      const currentComment = res.body.comments.reportedComments[i];
      const nextComment = res.body.comments.reportedComments[i + 1];
      expect(currentComment.reportCount).toBeGreaterThanOrEqual(
        nextComment.reportCount,
      );
      if (currentComment.reportCount === nextComment.reportCount) {
        expect(
          new Date(currentComment.createdAt) <= new Date(nextComment.createdAt),
        ).toBe(true);
      }
    }
  });

  it("should return all reported comments with pagination in order most reported first and then oldest first with query parameters", async () => {
    // Create 15 comments and report them with varying report counts
    const comments = [];

    for (let i = 0; i < 15; i++) {
      const comment = await createTestComment(
        testUser._id,
        testRecipe._id,
        null,
        {
          content: `Test comment ${i + 1}`,
          reportCount: i % 5 === 0 ? 5 : i % 5, // Report every 5th comment with 5 reports and the rest with varying reports from 0 to 4
        },
      );
      comments.push(comment);
    }

    const res = await adminAgent.get(
      "/api/v1/admin/comments/reported?page=2&limit=5",
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.reportedComments.length).toBe(5);
    expect(res.body.comments.currentPage).toBe(2);
    expect(res.body.comments.totalComments).toBe(15);
    expect(res.body.comments.totalPages).toBe(3);
    // Check that the reported comments are returned in the correct order (most reported first, then oldest first)
    for (let i = 0; i < res.body.comments.reportedComments.length - 1; i++) {
      const currentComment = res.body.comments.reportedComments[i];
      const nextComment = res.body.comments.reportedComments[i + 1];
      expect(currentComment.reportCount).toBeGreaterThanOrEqual(
        nextComment.reportCount,
      );
      if (currentComment.reportCount === nextComment.reportCount) {
        expect(
          new Date(currentComment.createdAt) <= new Date(nextComment.createdAt),
        ).toBe(true);
      }
    }
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/comments/reported");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: deleteCommentPermanently //
describe("DELETE /api/v1/admin/comments/:id", () => {
  it("should permanently delete the comment from the database", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const res = await adminAgent.delete(
      `/api/v1/admin/comments/${comment._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment deleted permanently");

    const deletedComment = await Comment.findById(comment._id);
    expect(deletedComment).toBeNull();
  });

  it("should return an error if the comment ID is invalid", async () => {
    const res = await adminAgent.delete("/api/v1/admin/comments/invalidId");

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });

  it("should return an error if the user is not authenticated", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const res = await request(app).delete(
      `/api/v1/admin/comments/${comment._id}`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const res = await loginAgent.delete(
      `/api/v1/admin/comments/${comment._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should return an error if the user is a moderator", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const res = await moderatorAgent.delete(
      `/api/v1/admin/comments/${comment._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is an admin", async () => {
    const comment = await createTestComment(testUser._id, testRecipe._id);

    const res = await adminAgent.delete(
      `/api/v1/admin/comments/${comment._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment deleted permanently");
  });

  it("should return an error if the comment was not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent.delete(
      `/api/v1/admin/comments/${nonExistentId}`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});
