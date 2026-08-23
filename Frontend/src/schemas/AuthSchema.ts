import { z } from "zod";

// Zod schema for the form values and errors for registering a new user
export const registrationSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(32, "Username must be at most 32 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .min(3, "Display name must be at least 3 characters")
      .max(32, "Display name must be at most 32 characters"),
    email: z.string().trim().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
        "Password must contain at least one uppercase letter, one number, and one special character",
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Zod schema for the form values and errors for logging in an existing user
export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});
