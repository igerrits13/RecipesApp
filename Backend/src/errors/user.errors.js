import { AppError } from "./shared.errors.js";

// Invalid information error class
export class InvalidInfoError extends AppError {
  constructor(message = "Invalid information provided") {
    super(message, 400);
  }
}
