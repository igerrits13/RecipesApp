import { AppError } from "./shared.errors.js";

// Authentication error class
export class AuthError extends AppError {
  constructor(message = "Invalid login information") {
    super(message, 401);
  }
}

// Duplicate resource error class
export class DuplicateError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}
