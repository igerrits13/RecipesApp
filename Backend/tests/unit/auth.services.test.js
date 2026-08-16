import { describe, expect, test } from "@jest/globals";
import { loginUser, registerUser } from "../../src/services/auth.services.js";

import {
  testUserData,
  unhashedPassword,
  createTestUser,
} from "../../src/utils/testFunctions.js";

import User from "../../src/models/user.model.js";

// Base test setup //

// Delete all users before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Test cases: registerUser //
describe("registerUser", () => {
  test("should register a new user successfully", async () => {
    const user = await registerUser({ ...testUserData });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
    expect(user).toHaveProperty("displayName", testUserData.displayName);
    expect(user).toHaveProperty("email", testUserData.email);
    expect(user).toHaveProperty("profileImage");
  });

  test("should register a new user with a username that has uppercase letters and underscores", async () => {
    const user = await registerUser({
      ...testUserData,
      username: "  New_User  ",
    });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty("username", "new_user");
    expect(user).toHaveProperty("displayName", testUserData.displayName);
    expect(user).toHaveProperty("email", testUserData.email);
  });

  test("should not register a user with a missing email", async () => {
    await expect(
      registerUser({
        displayName: "New User",
        username: "newuser",
        password: "Password123",
      }),
    ).rejects.toThrow("All fields required");
  });

  test("should not register a user with a missing username", async () => {
    await expect(
      registerUser({
        displayName: "New User",
        email: "newuser@example.com",
        password: "Password123",
      }),
    ).rejects.toThrow("All fields required");
  });

  test("should not register a user with a missing displayName", async () => {
    await expect(
      registerUser({
        email: "newuser@example.com",
        username: "newuser",
        password: "Password123",
      }),
    ).rejects.toThrow("All fields required");
  });

  test("should not register a user with a missing password", async () => {
    await expect(
      registerUser({
        username: "newuser",
        displayName: "New User",
        email: "newuser@example.com",
      }),
    ).rejects.toThrow("All fields required");
  });

  test("should not register a user with an invalid email format before '@'", async () => {
    await expect(
      registerUser({
        username: "newuser",
        displayName: "New User",
        email: "invalidemail.com",
        password: "Password123",
      }),
    ).rejects.toThrow("Please enter a valid email address");
  });

  test("should not register a user with an invalid email format after '@'", async () => {
    await expect(
      registerUser({
        username: "newuser",
        displayName: "New User",
        email: "invalidemail@com",
        password: "Password123",
      }),
    ).rejects.toThrow("Please enter a valid email address");
  });

  test("should not register a user with a username that contains spaces", async () => {
    await expect(
      registerUser({
        username: "new user",
        displayName: "New User",
        email: "newuser@example.com",
        password: "Password123",
      }),
    ).rejects.toThrow(
      "Username can only contain letters, numbers, and underscores",
    );
  });

  test("should not register a user with a username that contains special characters", async () => {
    await expect(
      registerUser({
        username: "new-user!",
        displayName: "New User",
        email: "newuser@example.com",
        password: "Password123",
      }),
    ).rejects.toThrow(
      "Username can only contain letters, numbers, and underscores",
    );
  });

  test("should not register a user with a username that is too short", async () => {
    await expect(
      registerUser({
        username: "  ab  ",
        displayName: "New User",
        email: "test@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("Username must be between 3 and 32 characters");
  });

  test("should not register a user with a username that is too long", async () => {
    await expect(
      registerUser({
        username: "a".repeat(33),
        displayName: "New User",
        email: "test@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("Username must be between 3 and 32 characters");
  });

  test("should not register a user with a display name that is too short", async () => {
    await expect(
      registerUser({
        username: "newuser",
        displayName: "  a  ",
        email: "newuser@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("Display name must be between 3 and 32 characters");
  });

  test("should not register a user with a display name that is too long", async () => {
    await expect(
      registerUser({
        username: "newuser",
        displayName: "a".repeat(33),
        email: "newuser@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("Display name must be between 3 and 32 characters");
  });

  test("should not register a user with a password missing a capital letter", async () => {
    await expect(
      registerUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "password123!",
      }),
    ).rejects.toThrow(
      "Password must contain at least one uppercase letter, one number, and one special character",
    );
  });

  test("should not register a user with a password missing a number", async () => {
    await expect(
      registerUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "Password!@#",
      }),
    ).rejects.toThrow(
      "Password must contain at least one uppercase letter, one number, and one special character",
    );
  });

  test("should register a user with a password that contains a space", async () => {
    const user = await registerUser({
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "Password 123!",
    });

    expect(user).toEqual(
      expect.objectContaining({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: expect.any(String),
      }),
    );
  });

  test("should register a user with a password that contains mostly spaces and only the required characters", async () => {
    const user = await registerUser({
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "      A1%",
    });

    expect(user).toEqual(
      expect.objectContaining({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: expect.any(String),
      }),
    );
  });

  test("should not register a user with a password missing a special character", async () => {
    await expect(
      registerUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "Password123",
      }),
    ).rejects.toThrow(
      "Password must contain at least one uppercase letter, one number, and one special character",
    );
  });

  test("should not register a user with a password that is too short", async () => {
    await expect(
      registerUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "Sho1!",
      }),
    ).rejects.toThrow("Password must be between 6 and 128 characters");
  });

  test("should not register a user with a password that is too long", async () => {
    await expect(
      registerUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "a".repeat(129) + "A1!",
      }),
    ).rejects.toThrow("Password must be between 6 and 128 characters");
  });

  test("should not register a user with an email that already exists", async () => {
    await createTestUser();

    await expect(
      registerUser({
        username: "newuser",
        displayName: "New User",
        email: testUserData.email,
        password: "Password123!",
      }),
    ).rejects.toThrow("An account with this email already exists");
  });

  test("should not register a user with a username that already exists", async () => {
    await createTestUser();

    await expect(
      registerUser({
        username: testUserData.username,
        displayName: "New User",
        email: "newuser@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("An account with this username already exists");
  });

  test("should not register a user with a username that already exists in the normalized form", async () => {
    await createTestUser();

    await expect(
      registerUser({
        username: `  ${testUserData.username.toUpperCase()}  `,
        displayName: "New User",
        email: "newuser@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("An account with this username already exists");
  });

  test("should not register a user with a display name that already exists", async () => {
    await createTestUser();

    await expect(
      registerUser({
        username: "newuser",
        displayName: testUserData.displayName,
        email: "newuser@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow("An account with this display name already exists");
  });
});

// Test cases: loginUser //
describe("loginUser", () => {
  test("should login successfully with correct email credentials", async () => {
    await createTestUser();

    const user = await loginUser({
      login: testUserData.email,
      password: unhashedPassword,
    });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
    expect(user).toHaveProperty("displayName", testUserData.displayName);
    expect(user).toHaveProperty("email", testUserData.email);
    expect(user).toHaveProperty("profileImage");
    expect(user.lastLogin).toBeInstanceOf(Date);
  });

  test("should login successfully with email that has different case and whitespace", async () => {
    await createTestUser();

    const user = await loginUser({
      login: `  ${testUserData.email.toUpperCase()}  `,
      password: unhashedPassword,
    });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
    expect(user).toHaveProperty("email", testUserData.email);
  });

  test("should login successfully with correct username credentials", async () => {
    await createTestUser();

    const user = await loginUser({
      login: testUserData.username,
      password: unhashedPassword,
    });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
    expect(user).toHaveProperty("displayName", testUserData.displayName);
    expect(user).toHaveProperty("email", testUserData.email);
    expect(user).toHaveProperty("profileImage");
    expect(user.lastLogin).toBeInstanceOf(Date);
  });

  test("should login successfully with username that has different case and whitespace", async () => {
    await createTestUser();

    const user = await loginUser({
      login: `  ${testUserData.username.toUpperCase()}  `,
      password: unhashedPassword,
    });

    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
    expect(user).toHaveProperty("email", testUserData.email);
  });

  test("should not login with missing email", async () => {
    await expect(
      loginUser({
        password: unhashedPassword,
      }),
    ).rejects.toThrow("Login information required");
  });

  test("should not login with missing password", async () => {
    await expect(
      loginUser({
        login: testUserData.email,
      }),
    ).rejects.toThrow("Login information required");
  });

  test("should not login unregistered email", async () => {
    await expect(
      loginUser({
        login: "nonexistent@example.com",
        password: unhashedPassword,
      }),
    ).rejects.toThrow("Invalid login information");
  });

  test("should not login with unregistered username", async () => {
    await expect(
      loginUser({
        login: "nonexistentuser",
        password: unhashedPassword,
      }),
    ).rejects.toThrow("Invalid login information");
  });

  test("should not login if user is marked as deleted", async () => {
    const user = await createTestUser({ isDeleted: true });

    await expect(
      loginUser({
        login: user.email,
        password: unhashedPassword,
      }),
    ).rejects.toThrow("Invalid login information");
  });

  test("should not login if password has been incorrect 3 or more times within 5 minutes", async () => {
    const user = await createTestUser({ failedLoginAttempts: 3 });

    await expect(
      loginUser({
        login: user.email,
        password: unhashedPassword,
      }),
    ).rejects.toThrow(
      "Account locked due to multiple failed login attempts. Please try again later.",
    );
  });

  test("should reset failed login attempts after 5 minutes and allow login", async () => {
    const user = await createTestUser({ failedLoginAttempts: 3 });

    // Manually update lastFailedLogin to be 5 minutes ago (simulate time passing)
    const userAfterFailedAttempts = await User.findById(user._id).select(
      "+lastFailedLogin",
    );

    userAfterFailedAttempts.lastFailedLogin = new Date(
      Date.now() - 5 * 60 * 1000 - 1,
    );

    await userAfterFailedAttempts.save();

    const loggedInUser = await loginUser({
      login: user.email,
      password: unhashedPassword,
    });

    expect(loggedInUser).toHaveProperty("_id");
    expect(loggedInUser).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
  });

  test("should increment failed login attempts and set lastFailedLogin on incorrect password", async () => {
    const user = await createTestUser();

    await expect(
      loginUser({
        login: user.email,
        password: "WrongPassword",
      }),
    ).rejects.toThrow("Invalid login information");

    const updatedUser = await User.findById(user._id).select(
      "+failedLoginAttempts +lastFailedLogin",
    );

    expect(updatedUser.failedLoginAttempts).toBe(1);
    expect(updatedUser.lastFailedLogin).toBeInstanceOf(Date);
  });

  test("should reset failed login attempts and lastFailedLogin on successful login", async () => {
    const user = await createTestUser({
      failedLoginAttempts: 2,
      lastFailedLogin: new Date(),
    });

    const loggedInUser = await loginUser({
      login: user.email,
      password: unhashedPassword,
    });

    expect(loggedInUser).toHaveProperty("_id");
    expect(loggedInUser).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );

    const updatedUser = await User.findById(user._id).select(
      "+failedLoginAttempts +lastFailedLogin",
    );

    expect(updatedUser.failedLoginAttempts).toBe(0);
    expect(updatedUser.lastFailedLogin).toBeNull();
  });

  test("should not login if password is incorrect 3 times and then allow login after 5 minutes", async () => {
    const user = await createTestUser();

    // Fail login 3 times
    for (let i = 0; i < 3; i++) {
      await expect(
        loginUser({
          login: user.email,
          password: "WrongPassword",
        }),
      ).rejects.toThrow("Invalid login information");
    }

    // Attempt 4th login immediately - should be blocked
    await expect(
      loginUser({
        login: user.email,
        password: unhashedPassword,
      }),
    ).rejects.toThrow(
      "Account locked due to multiple failed login attempts. Please try again later.",
    );

    // Manually update lastFailedLogin to be 5 minutes ago (simulate time passing)
    const userAfterFailedAttempts = await User.findById(user._id).select(
      "+lastFailedLogin",
    );

    userAfterFailedAttempts.lastFailedLogin = new Date(
      Date.now() - 5 * 60 * 1000 - 1,
    );

    await userAfterFailedAttempts.save();

    // Attempt login again - should succeed
    const loggedInUser = await loginUser({
      login: user.email,
      password: unhashedPassword,
    });

    expect(loggedInUser).toHaveProperty("_id");
    expect(loggedInUser).toHaveProperty(
      "username",
      testUserData.username.toLowerCase(),
    );
  });
});
