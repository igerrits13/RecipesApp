import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model";
import Comment from "../../src/models/comment.model";
import Recipe from "../../src/models/recipe.model";
import Ingredient from "../../src/models/ingredient.model";
import BannedWord from "../../src/models/bannedWord.model.js";
import Report from "../../src/models/report.model.js";

import {
  testUserData,
  testUserData2,
  createTestUser,
  getAuthenticatedAgent,
  customRecipe,
  createTestRecipe,
  createTestIngredient,
  customComment,
  createTestComment,
  createTestBannedWord,
} from "../../src/utils/testFunctions.js";

// Base test setup //

let testUser1;
let loginAgent1;
let testUser2;
let loginAgent2;
let testRecipe;
let testIngredient;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});

  testUser1 = await createTestUser(testUserData);
  testUser2 = await createTestUser(testUserData2);

  loginAgent1 = await getAuthenticatedAgent(testUser1);
  loginAgent2 = await getAuthenticatedAgent(testUser2);
  testIngredient = await createTestIngredient();
});

// Delete all recipes and comments before each test
beforeEach(async () => {
  await Comment.deleteMany({});
  await Recipe.deleteMany({});
  await BannedWord.deleteMany({});
  await Report.deleteMany({});

  testRecipe = await createTestRecipe(testUser1._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
  });
});

// Test cases: getUserComments //
describe("GET /api/comments/", () => {
  it("should fetch all comments for the authenticated user with no comments", async () => {
    const res = await loginAgent1.get("/api/v1/comments");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.comments).toBeInstanceOf(Array);
    expect(res.body.comments.totalComments).toBe(0);
  });

  it("should fetch all comments for the authenticated user with multiple comments", async () => {
    for (let i = 1; i <= 15; i++) {
      const newRecipe = await createTestRecipe(
        testUser1._id,
        customRecipe(i, testIngredient),
      );
      await createTestComment(
        testUser1._id,
        newRecipe._id,
        null,
        customComment(i),
      );
    }

    const res = await loginAgent1.get("/api/v1/comments");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.comments).toBeInstanceOf(Array);
    expect(res.body.comments.totalComments).toBe(15);
    expect(res.body.comments.comments.length).toBe(10);
  });

  it("should fetch comments for only the current user", async () => {
    const recipes = [];
    for (let i = 1; i <= 5; i++) {
      const newRecipe = await createTestRecipe(
        testUser1._id,
        customRecipe(i, testIngredient),
      );
      recipes.push(newRecipe);
    }

    for (let i = 0; i < recipes.length; i++) {
      await createTestComment(
        testUser1._id,
        recipes[i]._id,
        null,
        customComment(i + 1),
      );
      await createTestComment(
        testUser2._id,
        recipes[i]._id,
        null,
        customComment(i + 1),
      );
    }

    const res = await loginAgent1.get("/api/v1/comments");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.comments).toBeInstanceOf(Array);
    expect(res.body.comments.totalComments).toBe(5);
    res.body.comments.comments.forEach((comment) => {
      expect(comment.authorId._id).toBe(testUser1._id.toString());
    });
  });

  it("should not fetch comments for an unauthenticated user", async () => {
    const res = await request(app).get("/api/v1/comments");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});

// Test cases: updateCommentById //
describe("PUT /api/comments/:commentId", () => {
  it("should update the content of an existing comment", async () => {
    const comment = await createTestComment(
        testUser1._id,
        testRecipe._id,
        null,
        customComment(1),
      ),
      updatedContent = "This is the updated comment content.";

    const res = await loginAgent1
      .put(`/api/v1/comments/${comment._id}`)
      .send({ content: updatedContent });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment._id).toBe(comment._id.toString());
    expect(res.body.comment.authorId._id).toBe(testUser1._id.toString());
    expect(res.body.comment.recipeId).toBe(testRecipe._id.toString());
    expect(res.body.comment.content).toBe(updatedContent);
    expect(res.body.comment.originalContent).toBe(comment.content);
    expect(res.body.comment.parentCommentId).toBe(comment.parentCommentId);
    expect(res.body.comment.aggregateVote).toBe(comment.aggregateVote);
    expect(res.body.comment.isEdited).toBe(true);
  });

  it("should not update a comment for an unauthenticated user", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await request(app)
      .put(`/api/v1/comments/${comment._id}`)
      .send({ content: "This update should not be applied." });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should not update a comment if it contains a blocked banned word", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const bannedWord = await createTestBannedWord(testUser1._id, {
      word: "bannedword",
    });

    const res = await loginAgent1
      .put(`/api/v1/comments/${comment._id}`)
      .send({ content: "This contains bannedword" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      `Content contains banned word: ${bannedWord.word}`,
    );
  });

  it("should update comment and create a report if it contains a flagged banned word", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const flaggedWord = await createTestBannedWord(testUser1._id, {
      word: "flaggedword",
      severity: "flag",
    });

    const res = await loginAgent1
      .put(`/api/v1/comments/${comment._id}`)
      .send({ content: "This contains flaggedword" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.content).toBe("This contains flaggedword");

    const report = await Report.findOne({
      reportType: "report_banned_word",
    });

    expect(report).toBeDefined();
    expect(report.reportingUserId).toBeNull();
    expect(report.reportType).toBe("report_banned_word");
    expect(report.collectionName).toBe("comments");
    expect(report.targetId.toString()).toBe(comment._id.toString());
    expect(report.description).toBe(
      `Content contains banned word: ${flaggedWord.word}`,
    );
    expect(report.status).toBe("pending");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should return 400 error for an invalid comment ID", async () => {
    const res = await loginAgent1
      .put(`/api/v1/comments/invalidCommentId`)
      .send({ content: "This update should not be applied." });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });

  it("should return 404 error for a non-existent comment ID", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .put(`/api/v1/comments/${nonExistentCommentId}`)
      .send({ content: "This update should not be applied." });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});

// Test cases: undoCommentEditById //
describe("PUT /api/comments/:commentId/undo", () => {
  it("should undo the edit of an existing comment", async () => {
    const comment = await createTestComment(
        testUser1._id,
        testRecipe._id,
        null,
        customComment(1),
      ),
      updatedContent = "This is the updated comment content.";

    await Comment.findByIdAndUpdate(comment._id, {
      content: updatedContent,
      originalContent: comment.content,
      isEdited: true,
    });

    const res = await loginAgent1.put(`/api/v1/comments/${comment._id}/undo`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment._id).toBe(comment._id.toString());
    expect(res.body.comment.content).toBe(comment.content);
    expect(res.body.comment.originalContent).toBeNull();
    expect(res.body.comment.isEdited).toBe(false);
  });

  it("should not undo a comment edit for an unauthenticated user", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await request(app).put(`/api/v1/comments/${comment._id}/undo`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return 400 error for an invalid comment ID", async () => {
    const res = await loginAgent1.put(`/api/v1/comments/invalidCommentId/undo`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });

  it("should return 404 error for a non-existent comment ID", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.put(
      `/api/v1/comments/${nonExistentCommentId}/undo`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});

// Test cases: voteUpCommentById //
describe("POST /api/comments/:commentId/vote-up", () => {
  it("should upvote an existing comment", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await loginAgent2.post(
      `/api/v1/comments/${comment._id}/vote-up`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment upvoted successfully");
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment._id).toBe(comment._id.toString());
    expect(res.body.comment.aggregateVote).toBe(1);
  });

  it("should not upvote a comment for an unauthenticated user", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await request(app).post(
      `/api/v1/comments/${comment._id}/vote-up`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return 400 error for an invalid comment ID", async () => {
    const res = await loginAgent1.post(
      `/api/v1/comments/invalidCommentId/vote-up`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });

  it("should return 404 error for a non-existent comment ID", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.post(
      `/api/v1/comments/${nonExistentCommentId}/vote-up`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});

// Test cases: voteDownCommentById //
describe("POST /api/comments/:commentId/vote-down", () => {
  it("should downvote an existing comment", async () => {
    const comment = await createTestComment(
        testUser1._id,
        testRecipe._id,
        null,
        customComment(1),
      ),
      res = await loginAgent2.post(`/api/v1/comments/${comment._id}/vote-down`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment downvoted successfully");
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment._id).toBe(comment._id.toString());
    expect(res.body.comment.aggregateVote).toBe(-1);
  });

  it("should not downvote a comment for an unauthenticated user", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await request(app).post(
      `/api/v1/comments/${comment._id}/vote-down`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return 400 error for an invalid comment ID", async () => {
    const res = await loginAgent1.post(
      `/api/v1/comments/invalidCommentId/vote-down`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });

  it("should return 404 error for a non-existent comment ID", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.post(
      `/api/v1/comments/${nonExistentCommentId}/vote-down`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});

// Test cases: deleteCommentById //
describe("DELETE /api/comments/:commentId", () => {
  it("should soft delete an existing comment", async () => {
    const comment = await createTestComment(
        testUser1._id,
        testRecipe._id,
        null,
        customComment(1),
      ),
      res = await loginAgent1.delete(`/api/v1/comments/${comment._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment deleted successfully");

    const deletedComment = await Comment.findById(comment._id).select(
      "+isDeleted",
    );

    expect(deletedComment).toBeDefined();
    expect(deletedComment.isDeleted).toBe(true);
  });

  it("should not delete a comment for an unauthenticated user", async () => {
    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      customComment(1),
    );

    const res = await request(app).delete(`/api/v1/comments/${comment._id}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return 400 error for an invalid comment ID", async () => {
    const res = await loginAgent1.delete(`/api/v1/comments/invalidCommentId`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });

  it("should return 404 error for a non-existent comment ID", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1.delete(
      `/api/v1/comments/${nonExistentCommentId}`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });
});
