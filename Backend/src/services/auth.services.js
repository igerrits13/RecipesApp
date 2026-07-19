import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { AuthError, DuplicateError } from "../errors/auth.errors.js";

// Ensure a unique email and username and save a new user
export async function registerUser({ email, username, displayName, password }) {
  // Ensure all registration data is provided
  if (!email || !username || !displayName || !password) {
    const error = new Error("All fields required");
    error.statusCode = 400;
    throw error;
  }

  // Normalize email and displayName
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedDisplayName = displayName.trim();
  const normalizedEmail = email.toLowerCase().trim();

  // Ensure a valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error("Please enter a valid email address");
    error.statusCode = 400;
    throw error;
  }

  // Ensure username only contains allowed characters
  const usernameRegex = /^[a-z0-9_]+$/;

  if (!usernameRegex.test(normalizedUsername)) {
    const error = new Error(
      "Username can only contain letters, numbers, and underscores",
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate username, displayName and password length
  if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
    const error = new Error("Username must be between 3 and 32 characters");
    error.statusCode = 400;
    throw error;
  }
  if (normalizedDisplayName.length < 3 || normalizedDisplayName.length > 32) {
    const error = new Error("Display name must be between 3 and 32 characters");
    error.statusCode = 400;
    throw error;
  }
  if (password.length < 6 || password.length > 128) {
    const error = new Error("Password must be between 6 and 128 characters");
    error.statusCode = 400;
    throw error;
  }

  // Check if the email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail)
    throw new DuplicateError("An account with this email already exists");

  // Check if the username already exists
  const existingUsername = await User.findOne({ username: normalizedUsername });
  if (existingUsername)
    throw new DuplicateError("An account with this username already exists");

  // Check if the display name already exists
  const existingDisplayName = await User.findOne({
    displayName: normalizedDisplayName,
  });
  if (existingDisplayName)
    throw new DuplicateError(
      "An account with this display name already exists",
    );

  // Generate a random avatar
  const profileImage = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${username}&size=64`;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create the new user
  const user = new User({
    username: normalizedUsername,
    displayName: normalizedDisplayName,
    email,
    password: hashedPassword,
    profileImage,
  });

  // Save the user to the database
  await user.save();

  // Return the user data
  return user;
}

// Authenticate a user and return their data
export async function loginUser({ login, password }) {
  // Ensure login data is provided
  if (!login || !password) {
    const error = new Error("Login information required");
    error.statusCode = 400;
    throw error;
  }

  // Normalize email and username, passsing along whichever login method was provided
  const email = login.includes("@") ? login.toLowerCase().trim() : null;
  const username = !email ? login.toLowerCase().trim() : null;

  // Check if the user exists based on the provided login (email or username)
  const user = email
    ? await User.findOne({ email }).select(
        "+password +failedLoginAttempts +lastFailedLogin +isDeleted",
      )
    : await User.findOne({ username }).select(
        "+password +failedLoginAttempts +lastFailedLogin +isDeleted",
      );
  if (!user || user.isDeleted) throw new AuthError();

  // If last failed login was over 5 minutes ago, reset failed attempts
  if (
    user.lastFailedLogin &&
    Date.now() - user.lastFailedLogin > 5 * 60 * 1000
  ) {
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = null;
  }

  // If there have been 3 or more failed login attempts, block the login
  if (user.failedLoginAttempts >= 3) {
    throw new AuthError(
      "Account locked due to multiple failed login attempts. Please try again later.",
    );
  }

  // Check if password is correct, if it is, update last login timestamp and failed attempts
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    user.failedLoginAttempts += 1;
    user.lastFailedLogin = Date.now();
    await user.save();

    throw new AuthError();
  }

  // Update last login timestamp and reset failed login attempts
  user.lastLogin = Date.now();
  user.failedLoginAttempts = 0;
  user.lastFailedLogin = null;
  await user.save();

  // Return the user data
  return user;
}
