import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max image size
const MAX_IMAGE_PIXELS = 25_000_000; // 25MP max image resolution
const ACCEPTED_TYPES = ["image/jpeg", "image/png"]; // Only allow JPEG and PNG

// Check the images resolution and size before uploading them to the server
const checkImageResolution = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a temporary URL for the image
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    // Load the image and check its resolution
    img.onload = () => {
      const resolution = img.width * img.height;
      URL.revokeObjectURL(objectUrl);
      resolve(resolution <= MAX_IMAGE_PIXELS);
    };

    // If the image fails to load, reject the promise
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(false);
    };

    img.src = objectUrl;
  });
};

// Check to make sure the prep or cook time does not go over one full day
const durationSchema = z
  .object({
    hours: z
      .number({ message: "Hours must be a number" })
      .finite({ message: "Hours must be a number" })
      .min(0, "Hours must be at least 0")
      .max(24, "Hours must be at most 24"),
    minutes: z
      .number({ message: "Minutes must be a number" })
      .finite({ message: "Minutes must be a number" })
      .min(0, "Minutes must be at least 0")
      .max(59, "Minutes must be at most 59"),
  })
  .refine((data) => data.hours * 3600 + data.minutes * 60 <= 86400, {
    message: "Total duration must not exceed 24 hours",
    path: ["hours"],
  });

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
                .string()
                .trim()
                .max(10, "Quantity must be at most 10 characters")
                .regex(
                  /^(?:(?:0(?!\.0+$)\.\d+|[1-9]\d?(?:\.\d+)?)|(?:[1-9]\d?\s+[1-9]\d*\/[1-9]\d*)|(?:[1-9]\d*\/[1-9]\d*))$/,
                  "Quantity must be a valid number or fraction bertween 0 and 99",
                )
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
            z.object({
              step: z
                .string()
                .trim()
                .min(1, "Step is required")
                .min(3, "Step must be at least 3 characters")
                .max(500, "Step must be at most 500 characters"),
            }),
          )
          .min(1, "At least one step is required")
          .max(50, "No more than 50 steps allowed"),
      }),
    )
    .min(1, "At least one step section is required")
    .max(5, "No more than 5 step sections allowed"),
  preptime: durationSchema,
  cooktime: durationSchema,
  servings: z
    .number({ message: "Servings must be a whole number" })
    .int({ message: "Servings must be a whole number" })
    .min(0, "Servings must be at least 0")
    .max(99, "Servings must be at most 99"),
  image: z
    .instanceof(File)
    .nullable()
    .superRefine(async (file, ctx) => {
      if (!file) return; // Skip validation if no file is selected
      // Check file type and size
      if (!ACCEPTED_TYPES.includes(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only JPEG and PNG images are allowed",
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Image size must be less than 10MB",
        });
        return;
      }
      const isValidResolution = await checkImageResolution(file);
      if (!isValidResolution) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Image resolution must be less than 25MP",
        });
      }
    }),
  notes: z.string().trim().max(2000, "Notes must be at most 2000 characters"),
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
