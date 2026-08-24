import { z } from "zod";

// Zod schema for the form values and errors for creating a new recipe
export const createRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters"),
  ingredientSections: z
    .array(
      z.object({
        sectionTitle: z
          .string()
          .trim()
          .max(100, "Section title must be at most 100 characters"),
        ingredients: z
          .array(
            z.object({
              quantity: z
                .number()
                .min(0, "Quantity must be at least 0")
                .max(99, "Quantity must be at most 99")
                .nullable(),
              measurement: z.string().nullable(),
              ingredient: z
                .string()
                .trim()
                .min(1, "Ingredient is required")
                .min(2, "Ingredient must be at least 2 characters")
                .max(100, "Ingredient must be at most 100 characters"),
              additionalInfo: z
                .string()
                .trim()
                .max(100, "Additional info must be at most 100 characters"),
            }),
          )
          .min(1, "At least one ingredient is required")
          .max(50, "No more than 50 ingredients allowed"),
      }),
    )
    .min(1, "At least one ingredient section is required")
    .max(5, "No more than 5 ingredient sections allowed"),
  stepSections: z
    .array(
      z.object({
        sectionTitle: z
          .string()
          .trim()
          .max(100, "Section title must be at most 100 characters"),
        steps: z
          .array(
            z
              .string()
              .trim()
              .min(1, "Step is required")
              .min(3, "Step must be at least 3 characters")
              .max(500, "Step must be at most 500 characters"),
          )
          .min(1, "At least one step is required")
          .max(50, "No more than 50 steps allowed"),
      }),
    )
    .min(1, "At least one step section is required")
    .max(5, "No more than 5 step sections allowed"),
  preptimeSeconds: z
    .number()
    .min(0, "Prep time must be at least 0 seconds")
    .max(86400, "Prep time must be at most 1 day"),
  cooktimeSeconds: z
    .number()
    .min(0, "Cook time must be at least 0 seconds")
    .max(86400, "Cook time must be at most 1 day"),
  servings: z
    .number()
    .min(0, "Servings must be at least 0")
    .max(99, "Servings must be at most 99"),
  image: z
    .string()
    .trim()
    .max(2048, "Image link must be at most 2048 characters"),
  notes: z.string().trim().max(500, "Notes must be at most 500 characters"),
  linkedRecipes: z
    .array(
      z.object({
        recipeId: z.string(),
        role: z.enum(["component", "pairing", "variation"]),
      }),
    )
    .max(3, "No more than 3 linked recipes allowed"),
  source: z
    .object({
      url: z.union([
        z.literal(""),
        z
          .string()
          .trim()
          .url("Please enter a valid URL")
          .startsWith("https://", "URL must start with https://")
          .max(2048, "URL must be at most 2048 characters"),
      ]),
      name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(50, "Name must be at most 50 characters"),
      note: z.string().trim().max(100, "Note must be at most 100 characters"),
    })
    .nullable(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Tag must be at least 2 characters")
        .max(50, "Tag must be at most 50 characters"),
    )
    .max(10, "No more than 10 tags allowed"),
  cuisines: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Cuisine must be at least 2 characters")
        .max(50, "Cuisine must be at most 50 characters"),
    )
    .max(3, "No more than 3 cuisines allowed"),
  meals: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Meal must be at least 2 characters")
        .max(50, "Meal must be at most 50 characters"),
    )
    .max(3, "No more than 3 meals allowed"),
  holidays: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Holiday must be at least 2 characters")
        .max(50, "Holiday must be at most 50 characters"),
    )
    .max(3, "No more than 3 holidays allowed"),
  seasons: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Season must be at least 2 characters")
        .max(50, "Season must be at most 50 characters"),
    )
    .max(3, "No more than 3 seasons allowed"),
  isPublished: z.boolean(),
});
