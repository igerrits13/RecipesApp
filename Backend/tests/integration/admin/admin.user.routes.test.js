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

// Base test setup //

let testUser;
let loginAgent;
let moderatorUser;
let moderatorAgent;
let adminUser;
let adminAgent;

// Delete all users and create a new authenticated agent before running the tests
beforeEach(async () => {
  await User.deleteMany({});

  testUser = await createTestUser(testUserData);
  loginAgent = await getAuthenticatedAgent(testUser);
  moderatorUser = await createTestModeratorUser();
  moderatorAgent = await getAuthenticatedAgent(moderatorUser);
  adminUser = await createTestAdminUser();
  adminAgent = await getAuthenticatedAgent(adminUser);
});

// Test cases: getAllUsersWithRoles //
describe("GET /api/v1/admin/users", () => {
  it("should return a list of all users with their roles and ban/deletion status", async () => {
    const res = await adminAgent.get("/api/v1/admin/users");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.users.length).toBe(3);
    expect(res.body.users.currentPage).toBe(1);
    expect(res.body.users.totalUsers).toBe(3);
    expect(res.body.users.totalPages).toBe(1);
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/users");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/users");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/users");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/users");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: getDeletedUsers //
describe("GET /api/v1/admin/users/deleted", () => {
  it("should return a list of all soft deleted users", async () => {
    for (let i = 0; i < 5; i++) {
      const user = await createTestUser({
        username: `${testUserData.username}${i}`,
        displayName: `${testUserData.displayName}${i}`,
        password: "Password123",
        email: `${testUserData.email}${i}`,
        isDeleted: true,
      });
    }

    const res = await adminAgent.get("/api/v1/admin/users/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.deletedUsers.length).toBe(5);
    expect(res.body.users.currentPage).toBe(1);
    expect(res.body.users.totalDeletedUsers).toBe(5);
    expect(res.body.users.totalPages).toBe(1);
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/users/deleted");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/users/deleted");

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/users/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get("/api/v1/admin/users/deleted");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

// Test cases: getUserDetails //
describe("GET /api/v1/admin/users/:id", () => {
  it("should return the details of a specific user by id", async () => {
    const res = await adminAgent.get(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(testUserData.username.toLowerCase());
    expect(res.body.user.displayName).toBe(testUserData.displayName);
    expect(res.body.user.email).toBe(testUserData.email);
    expect(res.body.user.isDeleted).toBe(false);
    expect(res.body.user.isBanned).toBe(false);
    expect(res.body.user.role).toBe("user");
  });

  it("should throw an error if the user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const res = await adminAgent.get(
      `/api/v1/admin/users/${nonExistentUserId}`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).get(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.get(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.get(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.get(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error if the id is not a valid ObjectId", async () => {
    const res = await adminAgent.get(`/api/v1/admin/users/invalid-id`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: changeUserRole //
describe("PATCH /api/v1/admin/users/:id/role", () => {
  it("should change the role of a specific user by id", async () => {
    const res = await adminAgent
      .patch(`/api/v1/admin/users/${testUser._id}/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User role updated successfully");
  });

  it("should throw an error if the user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const res = await adminAgent
      .patch(`/api/v1/admin/users/${nonExistentUserId}/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${testUser._id}/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent
      .patch(`/api/v1/admin/users/${testUser._id}/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should return an error if the user is a moderator", async () => {
    const res = await moderatorAgent
      .patch(`/api/v1/admin/users/${testUser._id}/role`)
      .send({ newRole: "admin" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent
      .patch(`/api/v1/admin/users/${testUser._id}/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error if the id is not a valid ObjectId", async () => {
    const res = await adminAgent
      .patch(`/api/v1/admin/users/invalid-id/role`)
      .send({ newRole: "moderator" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: banUser //
describe("PATCH /api/v1/admin/users/:id/ban", () => {
  it("should ban a specific user by id", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${testUser._id}/ban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User banned successfully");
  });

  it("should throw an error if the user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${nonExistentUserId}/ban`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).patch(
      `/api/v1/admin/users/${testUser._id}/ban`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.patch(
      `/api/v1/admin/users/${testUser._id}/ban`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.patch(
      `/api/v1/admin/users/${testUser._id}/ban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${testUser._id}/ban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error if the id is not a valid ObjectId", async () => {
    const res = await adminAgent.patch(`/api/v1/admin/users/invalid-id/ban`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: unbanUser //
describe("PATCH /api/v1/admin/users/:id/unban", () => {
  it("should unban a specific user by id", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${testUser._id}/unban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User unbanned successfully");
  });

  it("should throw an error if the user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${nonExistentUserId}/unban`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app).patch(
      `/api/v1/admin/users/${testUser._id}/unban`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.patch(
      `/api/v1/admin/users/${testUser._id}/unban`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is a moderator", async () => {
    const res = await moderatorAgent.patch(
      `/api/v1/admin/users/${testUser._id}/unban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/users/${testUser._id}/unban`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error if the id is not a valid ObjectId", async () => {
    const res = await adminAgent.patch(`/api/v1/admin/users/invalid-id/unban`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: deleteUserPermanently //
describe("DELETE /api/v1/admin/users/:id", () => {
  it("should delete a specific user permanently by id", async () => {
    const res = await adminAgent.delete(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should throw an error if the user not authenticated", async () => {
    const res = await request(app).delete(
      `/api/v1/admin/users/${testUser._id}`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error if the user is a general user", async () => {
    const res = await loginAgent.delete(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should return an error if the user is a moderator", async () => {
    const res = await moderatorAgent.delete(
      `/api/v1/admin/users/${testUser._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow access if the user is an admin", async () => {
    const res = await adminAgent.delete(`/api/v1/admin/users/${testUser._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error if the id is not a valid ObjectId", async () => {
    const res = await adminAgent.delete(`/api/v1/admin/users/invalid-id`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid id");
  });
});
