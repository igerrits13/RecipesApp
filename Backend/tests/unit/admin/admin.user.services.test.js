import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";

import User from "../../../src/models/user.model.js";

import { createTestUser } from "../../../src/utils/testFunctions.js";

import {
  updateUserBanStatus,
  getAllDeletedUsers,
  getAllUsersWithRoleStatus,
  getUserDetailsById,
  updateUserRole,
} from "../../../src/services/admin/admin.user.services.js";

// Base test setup //

// Create a fresh test recipe before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Test cases: getAllUsersWithRoleStatus //
describe("getAllUsersWithRoleStatus", () => {
  test("should return an empty array if there are no users", async () => {
    const users = await getAllUsersWithRoleStatus(1, 10, 0);

    expect(users.users.length).toBe(0);
    expect(users.currentPage).toBe(1);
    expect(users.totalUsers).toBe(0);
    expect(users.totalPages).toBe(0);
  });

  test("should return all users with their roles and ban, deletion and verified status", async () => {
    for (let i = 0; i < 15; i++) {
      await createTestUser({
        displayName: `Test User ${i}`,
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: "Password123",
        role: i % 3 === 0 ? "admin" : i % 3 === 1 ? "moderator" : "user",
        isBanned: i % 2 === 0,
        isDeleted: i % 2 === 1,
      });
    }

    const users = await getAllUsersWithRoleStatus(1, 10, 0);

    expect(users.users.length).toBe(10);
    // Users should be sorted by role in ascending order (admin, moderator, user)
    for (let i = 0; i < users.users.length - 1; i++) {
      const currentRole = users.users[i].role;
      const nextRole = users.users[i + 1].role;
      expect(
        currentRole === "admin" ||
          (currentRole === "moderator" && nextRole !== "admin") ||
          (currentRole === "user" && nextRole === "user"),
      ).toBe(true);
    }
    expect(users.currentPage).toBe(1);
    expect(users.totalUsers).toBe(15);
    expect(users.totalPages).toBe(2);
    expect(users.users[0]).toHaveProperty("displayName");
    expect(users.users[0]).toHaveProperty("email");
    expect(users.users[0]).toHaveProperty("profileImage");
    expect(users.users[0]).toHaveProperty("role");
    expect(users.users[0]).toHaveProperty("isBanned");
    expect(users.users[0]).toHaveProperty("isDeleted");
    expect(users.users[0]).toHaveProperty("isEmailVerified");
  });
});

// Test cases: getAllDeletedUsers //
describe("getAllDeletedUsers", () => {
  test("should return an empty array if there are no deleted users", async () => {
    const deletedUsers = await getAllDeletedUsers(1, 10, 0);

    expect(deletedUsers.deletedUsers.length).toBe(0);
    expect(deletedUsers.currentPage).toBe(1);
    expect(deletedUsers.totalDeletedUsers).toBe(0);
    expect(deletedUsers.totalPages).toBe(0);
  });

  test("should return all deleted users with their roles and ban, deletion and verified status", async () => {
    for (let i = 0; i < 20; i++) {
      await createTestUser({
        displayName: `Test User ${i}`,
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: "Password123",
        role: i % 3 === 0 ? "admin" : i % 3 === 1 ? "moderator" : "user",
        isBanned: i % 2 === 0,
        isDeleted: i % 2 === 1,
      });
    }

    const deletedUsers = await getAllDeletedUsers(1, 10, 0);

    expect(deletedUsers.deletedUsers.length).toBe(10);
    // Deleted users should be sorted by role in ascending order (admin, moderator, user)
    for (let i = 0; i < deletedUsers.deletedUsers.length - 1; i++) {
      const currentRole = deletedUsers.deletedUsers[i].role;
      const nextRole = deletedUsers.deletedUsers[i + 1].role;
      expect(
        currentRole === "admin" ||
          (currentRole === "moderator" && nextRole !== "admin") ||
          (currentRole === "user" && nextRole === "user"),
      ).toBe(true);
    }
    expect(deletedUsers.currentPage).toBe(1);
    expect(deletedUsers.totalDeletedUsers).toBe(10);
    expect(deletedUsers.totalPages).toBe(1);
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("displayName");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("email");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("profileImage");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("role");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("isBanned");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("isDeleted");
    expect(deletedUsers.deletedUsers[0]).toHaveProperty("isEmailVerified");
  });
});

// Test cases: getUserDetailsById //
describe("getUserDetailsById", () => {
  test("should get all required information for a specific user by id", async () => {
    const testUser = await createTestUser({
      displayName: "Test User",
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
      role: "user",
      isBanned: false,
      isDeleted: false,
    });

    const user = await getUserDetailsById(testUser._id);

    expect(user).toHaveProperty("username");
    expect(user).toHaveProperty("displayName");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("profileImage");
    expect(user).toHaveProperty("role");
    expect(user).toHaveProperty("previousDisplayName");
    expect(user).toHaveProperty("lastDisplayNameChange");
    expect(user).toHaveProperty("previousEmail");
    expect(user).toHaveProperty("lastEmailChange");
    expect(user).toHaveProperty("emailChangeCount");
    expect(user).toHaveProperty("lastLogin");
    expect(user).toHaveProperty("lastFailedLogin");
    expect(user).toHaveProperty("failedLoginAttempts");
    expect(user).toHaveProperty("isBanned");
    expect(user).toHaveProperty("isDeleted");
    expect(user).toHaveProperty("deletedAt");
    expect(user).toHaveProperty("isEmailVerified");
  });

  test("should throw an error if user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    await expect(getUserDetailsById(nonExistentUserId)).rejects.toThrow(
      "User not found",
    );
  });
});

// Test cases: updateUserRole //
describe("updateUserRole", () => {
  test("should update a user's role by id", async () => {
    const testUser = await createTestUser({
      displayName: "Test User",
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
      role: "user",
      isBanned: false,
      isDeleted: false,
    });

    await updateUserRole(testUser._id, "admin");

    const updatedUser = await User.findById(testUser._id).select("role").lean();

    expect(updatedUser.role).toBe("admin");
  });

  test("should throw an error if user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    await expect(updateUserRole(nonExistentUserId, "admin")).rejects.toThrow(
      "User not found",
    );
  });

  test("should throw an error if the new role is invalid", async () => {
    const testUser = await createTestUser({
      displayName: "Test User",
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
      role: "user",
      isBanned: false,
      isDeleted: false,
    });

    await expect(updateUserRole(testUser._id, "invalidRole")).rejects.toThrow(
      "Invalid role",
    );
  });
});

// Test cases: updateUserBanStatus //
describe("updateUserBanStatus", () => {
  test("should update the ban status of a user by id", async () => {
    const testUser = await createTestUser({
      displayName: "Test User",
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
      role: "user",
      isBanned: false,
      isDeleted: false,
    });

    await updateUserBanStatus(testUser._id, true);

    const updatedUser = await User.findById(testUser._id)
      .select("+isBanned")
      .lean();

    expect(updatedUser.isBanned).toBe(true);
  });

  test("should ban a user by their id", async () => {
    const testUser = await createTestUser({
      displayName: "Test User",
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
      role: "user",
      isBanned: true,
      isDeleted: false,
    });

    await updateUserBanStatus(testUser._id, false);

    const updatedUser = await User.findById(testUser._id)
      .select("+isBanned")
      .lean();

    expect(updatedUser.isBanned).toBe(false);
  });

  test("should throw an error if user is not found", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    await expect(updateUserBanStatus(nonExistentUserId, true)).rejects.toThrow(
      "User not found",
    );
  });
});
