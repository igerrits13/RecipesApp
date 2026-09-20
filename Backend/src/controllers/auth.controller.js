import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { loginUser, registerUser } from "../services/auth.services.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

// Create a route for registering a new account
export async function register(req, res) {
  try {
    const { email, username, displayName, password } = req.body;

    // Register the user using the service function
    const user = await registerUser({
      email,
      username,
      displayName,
      password,
    });

    // Generate JWT token and set cookie
    generateTokenAndSetCookie(user._id, res);

    // Send the user information and web token
    res.status(201).json({
      user: sanitizeUser(user),
      success: true,
      message: "Account registered successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for logging into an existing account
export async function login(req, res) {
  try {
    const { login, password } = req.body;

    const user = await loginUser({ login, password });

    // Create the JSON web token
    generateTokenAndSetCookie(user._id, res);

    // Send the user information and web token
    res.status(200).json({
      user: sanitizeUser(user),
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for logging out of an account
export async function logout(req, res) {
  try {
    res.clearCookie("jwt-token");
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Create a route for checking authentication status
export async function authCheck(req, res) {
  try {
    res.status(200).json({
      user: sanitizeUser(req.user),
      success: true,
      message: "Authenticated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
