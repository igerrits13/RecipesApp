import { z } from "zod";

// Zod schema for creating a new comment
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(500, "Comment must be at most 500 characters"),
});
