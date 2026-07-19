import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model";
import Comment from "../../src/models/comment.model";
import Recipe from "../../src/models/recipe.model";
import Ingredient from "../../src/models/ingredient.model";
import Report from "../../src/models/report.model";

import {
  testUserData,
  createTestUser,
  getAuthenticatedAgent,
  createTestComment,
  createTestRecipe,
  createTestIngredient,
} from "../../src/utils/testFunctions.js";

// Base test setup //

let testUser1;
let loginAgent1;
let testComment;
let testRecipe;
let testIngredient;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Comment.deleteMany({});
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});

  testUser1 = await createTestUser(testUserData);
  loginAgent1 = await getAuthenticatedAgent(testUser1);

  testIngredient = await createTestIngredient();
  testRecipe = await createTestRecipe(testUser1._id, {
    ingredientSections: [
      {
        sectionTitle: "Test Section",
        ingredients: [{ ingredient: testIngredient._id }],
      },
    ],
  });

  testComment = await createTestComment(testUser1._id, testRecipe._id);
});

// Delete all reports before each test
beforeEach(async () => {
  await Report.deleteMany({});
});

// Test cases: reportCommentById //
describe("POST /api/reports/comment/:commentId", () => {
  it("should report a comment by its ID", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/comment/${testComment._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comment reported successfully");

    const report = await Report.findOne({ reportType: "report_comment" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("report_comment");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBe("Comment");
    expect(report.targetId.toString()).toBe(testComment._id.toString());
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the comment does not exist", async () => {
    const invalidCommentId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .post(`/api/v1/reports/comment/${invalidCommentId}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Comment not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .post(`/api/v1/reports/comment/${testComment._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the comment ID is invalid", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/comment/invalidCommentId`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid commentId");
  });
});

// Test cases: reportRecipeById //
describe("POST /api/reports/recipe/:recipeId", () => {
  it("should report a recipe by its ID", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/recipe/${testRecipe._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Recipe reported successfully");

    const report = await Report.findOne({ reportType: "report_recipe" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("report_recipe");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBe("Recipe");
    expect(report.targetId.toString()).toBe(testRecipe._id.toString());
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the recipe does not exist", async () => {
    const invalidRecipeId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .post(`/api/v1/reports/recipe/${invalidRecipeId}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Recipe not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .post(`/api/v1/reports/recipe/${testRecipe._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the recipe ID is invalid", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/recipe/invalidRecipeId`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid recipeId");
  });
});

// Test cases: reportUserById //
describe("POST /api/reports/user/:userId", () => {
  it("should report a user by their ID", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/user/${testUser1._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User reported successfully");

    const report = await Report.findOne({ reportType: "report_user" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("report_user");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBe("User");
    expect(report.targetId.toString()).toBe(testUser1._id.toString());
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the user does not exist", async () => {
    const invalidUserId = new mongoose.Types.ObjectId();

    const res = await loginAgent1
      .post(`/api/v1/reports/user/${invalidUserId}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .post(`/api/v1/reports/user/${testUser1._id}`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user ID is invalid", async () => {
    const res = await loginAgent1
      .post(`/api/v1/reports/user/invalidUserId`)
      .send({
        description: "Test report",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid userId");
  });
});

// Test cases: reportBug //
describe("POST /api/reports/bug", () => {
  it("should report a bug", async () => {
    const res = await loginAgent1.post(`/api/v1/reports/bug`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Bug reported successfully");

    const report = await Report.findOne({ reportType: "report_bug" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("report_bug");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBeNull();
    expect(report.targetId).toBeNull();
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).post(`/api/v1/reports/bug`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});

// Test cases: submitFeedback //
describe("POST /api/reports/feedback", () => {
  it("should submit feedback", async () => {
    const res = await loginAgent1.post(`/api/v1/reports/feedback`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Feedback submitted successfully");

    const report = await Report.findOne({ reportType: "feedback" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("feedback");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBeNull();
    expect(report.targetId).toBeNull();
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).post(`/api/v1/reports/feedback`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});

// Test cases: submitGeneralReport //
describe("POST /api/reports/general", () => {
  it("should submit a general report", async () => {
    const res = await loginAgent1.post(`/api/v1/reports/general`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Report submitted successfully");

    const report = await Report.findOne({ reportType: "other" });

    expect(report).toBeDefined();
    expect(report.reportingUserId.toString()).toBe(testUser1._id.toString());
    expect(report.reportType).toBe("other");
    expect(report.status).toBe("pending");
    expect(report.collectionName).toBeNull();
    expect(report.targetId).toBeNull();
    expect(report.description).toBe("Test report");
    expect(report.resolutionNotes).toBe("Pending resolution");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).post(`/api/v1/reports/general`).send({
      description: "Test report",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});
