import mongoose from "mongoose";
import { jest } from "@jest/globals";

const mockUploadPhoto = jest.fn();
const mockDeletePhoto = jest.fn();

jest.unstable_mockModule(
  new URL("../../src/utils/photoUpload.js", import.meta.url).href,
  () => ({
    uploadPhoto: mockUploadPhoto,
    deletePhoto: mockDeletePhoto,
  }),
);

import User from "../../src/models/user.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Ingredient from "../../src/models/ingredient.model.js";
import Tag from "../../src/models/tag.model.js";
import Season from "../../src/models/season.model.js";
import Holiday from "../../src/models/holiday.model.js";
import Rating from "../../src/models/rating.model.js";
import Comment from "../../src/models/comment.model.js";
import CommentVote from "../../src/models/commentVote.model.js";
import Note from "../../src/models/note.model.js";

const {
  validateRecipeData,
  saveNewCollection,
  validateAndSaveNewRecipe,
  validateAndUpdateRecipe,
  updateRecipePublicationStatus,
  softDeleteRecipe,
  restoreDeletedRecipe,
  rateSpecificRecipe,
  removeRatingFromSpecificRecipe,
  getAllRecipeComments,
  validateAndAddComment,
} = await import("../../src/services/recipe.services.js");

const {
  fullTestRecipeDataComplete,
  createTestTag,
  createTestUser,
  createSecondaryTestUser,
  createTestRecipe,
  createTestIngredient,
  createTestRating,
  createTestParentComments,
  createTestCommentVote,
  createTestComment,
  createTestChildComments,
  createTestMeasurement,
  createTestNote,
  fullTestRecipeDataCompleteNonJSON,
} = await import("../../src/utils/testFunctions.js");

// Base test setup //

let testUser;
let otherUser;
let testIngredient;
let testUserIndex = 0;
const page = 1;
const limit = 5;
const offset = (page - 1) * limit;

function getValidationErrors(fn) {
  try {
    fn();
  } catch (err) {
    return err.details;
  }
}

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});

  testUser = await createTestUser();
  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    displayName: "OtherUser",
    email: `${crypto.randomUUID()}@example.com`,
    password: "Password123",
  });
});

// Delete all recipes and comments before each test
beforeEach(async () => {
  await Recipe.deleteMany({});
  await Rating.deleteMany({});
  await Ingredient.deleteMany({});
  await Tag.deleteMany({});
  await Season.deleteMany({});
  await Holiday.deleteMany({});
  await Comment.deleteMany({});
  await CommentVote.deleteMany({});

  jest.clearAllMocks();

  mockUploadPhoto.mockReset();
  mockDeletePhoto.mockReset();

  mockUploadPhoto.mockResolvedValue(null);
  mockDeletePhoto.mockResolvedValue(undefined);
});

// Restore all mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Test cases: validateRecipeData //
describe("validateRecipeData", () => {
  test("should validate correct recipe data", () => {
    expect(() => validateRecipeData(fullTestRecipeDataComplete)).not.toThrow();

    const result = validateRecipeData(fullTestRecipeDataComplete);
    expect(result).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        description: expect.any(String),
        ingredientSections: expect.any(Array),
        stepSections: expect.any(Array),
        preptimeSeconds: expect.any(Number),
        cooktimeSeconds: expect.any(Number),
        servings: expect.any(Number),
        notes: expect.any(String),
        linkedRecipes: expect.any(Array),
        tags: expect.any(Array),
        holidays: expect.any(Array),
        seasons: expect.any(Array),
      }),
    );
  });

  test("should throw an error if the sections are not the right format", () => {
    const invalidData = {
      ...fullTestRecipeDataComplete,
      ingredientSections: "Not an array",
      stepSections: "Not an array",
      source: "Not an array",
      tags: "Not an array",
      cuisines: "Not an array",
      meals: "Not an array",
      holidays: "Not an array",
      seasons: "Not an array",
    };

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if title is missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.title;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if ingredient sections are missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.ingredientSections;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if step sections are missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.stepSections;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if preptimeSeconds is missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.preptimeSeconds;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if cooktimeSeconds is missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.cooktimeSeconds;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  test("should throw an error if servings is missing", () => {
    const invalidData = { ...fullTestRecipeDataComplete };
    delete invalidData.servings;

    expect(() => validateRecipeData(invalidData)).toThrow("Validation failed");
  });

  // validateRecipeTitle //
  describe("validateRecipeData - title", () => {
    test("should trim whitespace from title and return it", () => {
      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        title: "   Test Recipe   ",
      };

      const result = validateRecipeData(dataWithWhitespace);
      expect(result.title).toBe("Test Recipe");
    });

    test("should throw an error if title is not a string", () => {
      const invalidData = { ...fullTestRecipeDataComplete, title: 123 };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Title must be a string between 3 and 100 characters long",
      );
    });

    test("should throw an error if title is too short", () => {
      const invalidData = { ...fullTestRecipeDataComplete, title: "Hi" };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Title must be a string between 3 and 100 characters long",
      );
    });

    test("should throw an error if title is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        title: "A".repeat(101),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Title must be a string between 3 and 100 characters long",
      );
    });
  });

  // validateRecipeDescription //
  describe("validateRecipeData - description", () => {
    test("should trim whitespace from description and return it", () => {
      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        description: "   This is a test recipe.   ",
      };

      const result = validateRecipeData(dataWithWhitespace);
      expect(result.description).toBe("This is a test recipe.");
    });

    test("should return empty string if description is not provided", () => {
      const dataWithoutDescription = { ...fullTestRecipeDataComplete };
      delete dataWithoutDescription.description;

      const result = validateRecipeData(dataWithoutDescription);
      expect(result.description).toBe("");
    });

    test("should throw an error if description is not a string", () => {
      const invalidData = { ...fullTestRecipeDataComplete, description: 123 };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Description must be a string and cannot exceed 500 characters",
      );
    });

    test("should throw an error if description is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        description: "A".repeat(501),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Description must be a string and cannot exceed 500 characters",
      );
    });
  });

  // validateRecipeIngredients //
  describe("validateRecipeData - ingredients", () => {
    test("should return an array of valid ingredients while trimming whitespace", () => {
      const validIngredients = [
        {
          ingredient: "   Test Ingredient 1   ",
          measurement: "cup",
          quantity: "1",
        },
        {
          ingredient: "   Test Ingredient 2   ",
          measurement: "tablespoon",
          quantity: "2",
        },
      ];

      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          { sectionTitle: "Test Section", ingredients: validIngredients },
        ]),
      };

      const result = validateRecipeData(dataWithWhitespace);

      expect(result.ingredientSections).toEqual([
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: "Test Ingredient 1",
              measurement: "cup",
              quantity: "1",
            },
            {
              ingredient: "Test Ingredient 2",
              measurement: "tablespoon",
              quantity: "2",
            },
          ],
        },
      ]);
    });

    test("should return an array of valid ingredients while allowing different forms of quantities", () => {
      const validIngredients = [
        {
          ingredient: "Test Ingredient 1",
          measurement: "cup",
          quantity: "1.5",
        },

        {
          ingredient: "Test Ingredient 1",
          measurement: "cup",
          quantity: "0.5",
        },

        {
          ingredient: "Test Ingredient 1",
          measurement: "cup",
          quantity: "99.99",
        },

        {
          ingredient: "Test Ingredient 2",
          measurement: "tablespoon",
          quantity: "1/3",
        },

        {
          ingredient: "Test Ingredient 3",
          measurement: "ounce",
          quantity: "1 1/2",
        },

        {
          ingredient: "Test Ingredient 3",
          measurement: "ounce",
          quantity: "1 1/2-2 1/2",
        },
      ];

      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          { sectionTitle: "Test Section", ingredients: validIngredients },
        ]),
      };

      const result = validateRecipeData(dataWithWhitespace);

      expect(result.ingredientSections).toEqual([
        {
          sectionTitle: "Test Section",
          ingredients: validIngredients,
        },
      ]);
    });

    test("should return an array of valid ingredients while allowing null quantities", () => {
      const validIngredients = [
        {
          ingredient: "Test Ingredient 1",
          measurement: "cup",
          quantity: null,
        },

        {
          ingredient: "Test Ingredient 2",
          measurement: "tablespoon",
          quantity: null,
        },
      ];

      const dataWithNullQuantities = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: validIngredients,
          },
        ]),
      };

      const result = validateRecipeData(dataWithNullQuantities);

      expect(result.ingredientSections).toEqual([
        {
          sectionTitle: "Test Section",
          ingredients: validIngredients,
        },
      ]);
    });

    test("should throw an error if ingredient sections is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: "Not an array",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid ingredient sections");
    });

    test("should throw an error if ingredient sections are not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify("Not an array"),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Ingredient sections must be an array");
    });

    test("should throw an error if ingredient sections is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: [],
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid ingredient sections");
    });

    test("should throw an error if ingredient sections array is empty", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "A recipe must have at least one ingredient section",
      );
    });

    test("should throw an error if ingredient sections is longer than 5 sections", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify(
          Array.from({ length: 6 }, (_, i) => ({
            sectionTitle: `Test Section ${i + 1}`,
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "1",
              },
            ],
          })),
        ),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "A recipe cannot have more than 5 ingredient sections",
      );
    });

    test("should throw an error if the ingredient section title is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: 123,
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "1",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Ingredient section titles must be a string");
    });

    test("should throw an error if the ingredient section title is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "A".repeat(101),
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "1",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient section titles cannot exceed 100 characters",
      );
    });

    test("should throw an error if ingredients within a section are not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: "Not an array",
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Ingredients must be an array");
    });

    test("should throw an error if quantity is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: 123,
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient quantities must be a string and cannot exceed 15 characters",
      );
    });

    test("should throw an error if quantity is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "A".repeat(16),
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient quantities must be a string and cannot exceed 15 characters",
      );
    });

    test("should throw an error if ingredient is not a valid string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              { ingredient: 123, measurement: "cups", quantity: "1" },
              { ingredient: "   ", measurement: "tablespoons", quantity: "2" },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe must have at least one ingredient");
    });

    test("should throw an error if there are too many ingredients", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: Array.from({ length: 51 }, (_, i) => ({
              ingredient: `Ingredient ${i + 1}`,
              measurement: "units",
              quantity: "1",
            })),
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe cannot have more than 50 ingredients");
    });

    test("should throw an error if ingredient name is too short", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              { ingredient: "A", measurement: "cups", quantity: "1" },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient names must be a string between 2 and 100 characters long",
      );
    });

    test("should throw an error if ingredient name is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "A".repeat(101),
                measurement: "cups",
                quantity: "1",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient names must be a string between 2 and 100 characters long",
      );
    });

    test("should throw an error if ingredient quantity is less than 0", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cups",
                quantity: "-1",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient quantities must be a represent a number or fraction between 0 and 99",
      );
    });

    test("should throw an error if ingredient quantity is greater than 99", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cups",
                quantity: "100",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Ingredient quantities must be a represent a number or fraction between 0 and 99",
      );
    });

    test("should throw an error if ingredient measurement is not a valid choice", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "invalid",
                quantity: "1",
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid measurement unit");
    });

    test("should throw an error if ingredient aditional information is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "1",
                additionalInfo: 123,
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Additional information for ingredients must be a string and cannot exceed 100 characters",
      );
    });

    test("should throw an error if ingredient aditional information is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [
              {
                ingredient: "Test Ingredient",
                measurement: "cup",
                quantity: "1",
                additionalInfo: "A".repeat(101),
              },
            ],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Additional information for ingredients must be a string and cannot exceed 100 characters",
      );
    });
  });

  // validateRecipeSteps //
  describe("validateRecipeData - steps", () => {
    test("should trim whitespace from steps and return them", () => {
      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: ["   Step 1   ", "   Step 2   "],
          },
        ]),
      };

      const result = validateRecipeData(dataWithWhitespace);
      expect(result.stepSections[0].steps).toEqual(["Step 1", "Step 2"]);
    });

    test("should throw an error if step sections is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: "Not an array",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid step sections");
    });

    test("should throw an error if step sections are not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify("Not an array"),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Step sections must be an array");
    });

    test("should throw an error if step sections array is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: [],
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid step sections");
    });

    test("should throw an error if step sections array is empty", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe must have at least one step section");
    });

    test("should throw an error if step sections array is longer than 5 sections", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify(
          Array.from({ length: 6 }, (_, i) => ({
            sectionTitle: `Test Section ${i + 1}`,
            steps: ["Step 1"],
          })),
        ),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "A recipe cannot have more than 5 step sections",
      );
    });

    test("should throw an error if the step section title is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: 123,
            steps: ["Step 1"],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Step section titles must be a string");
    });

    test("should throw an error if the step section title is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "A".repeat(101),
            steps: ["Step 1"],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Step section titles cannot exceed 100 characters",
      );
    });

    test("should throw an error if steps within a step section are not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: "Not an array",
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Steps must be an array");
    });

    test("should throw an error if steps array is empty", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          { sectionTitle: "Test Section", steps: [] },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe must have at least one step");
    });

    test("should throw an error if steps are invalid", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: ["   ", 123, null],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe must have at least one step");
    });

    test("should throw an error if there are too many steps", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: Array.from({ length: 51 }, (_, i) => `Step ${i + 1}`),
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe cannot have more than 50 steps");
    });

    test("should throw an error if step length is less than 3 characters", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: ["Hi"],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Each step must be between 3 and 500 characters long",
      );
    });

    test("should throw an error if step length is greater than 500 characters", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: ["A".repeat(501)],
          },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Each step must be between 3 and 500 characters long",
      );
    });
  });

  // validateRecipeTime //
  describe("validateRecipeData - time", () => {
    test("should throw an error if preptimeSeconds is less than 0", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        preptimeSeconds: "-1",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Prep time must be a number between 0 and 1 day",
      );
    });

    test("should throw an error if preptimeSeconds is greater than 86400", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        preptimeSeconds: "86401",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Prep time must be a number between 0 and 1 day",
      );
    });

    test("should throw an error if cooktimeSeconds is less than 0", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        cooktimeSeconds: "-1",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Cook time must be a number between 0 and 1 day",
      );
    });

    test("should throw an error if cooktimeSeconds is greater than 86400", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        cooktimeSeconds: "86401",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Cook time must be a number between 0 and 1 day",
      );
    });
  });

  // validateRecipeServings //
  describe("validateRecipeData - servings", () => {
    test("should throw an error if servings is less than 0", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        servings: "-1",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Servings must be a number between 0 and 99");
    });

    test("should throw an error if servings is greater than 99", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        servings: "100",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Servings must be a number between 0 and 99");
    });
  });

  // validateRecipeNotes //
  describe("validateRecipeData - notes", () => {
    test("should trim whitespace from notes and return it", () => {
      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        notes: "   These are test notes.   ",
      };

      const result = validateRecipeData(dataWithWhitespace);
      expect(result.notes).toBe("These are test notes.");
    });

    test("should return empty string if notes is not provided", () => {
      const dataWithoutNotes = { ...fullTestRecipeDataComplete };
      delete dataWithoutNotes.notes;

      const result = validateRecipeData(dataWithoutNotes);
      expect(result.notes).toBe("");
    });

    test("should throw an error if notes is not a string", () => {
      const invalidData = { ...fullTestRecipeDataComplete, notes: 123 };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Notes must be a string and cannot exceed 2000 characters",
      );
    });

    test("should throw an error if notes is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        notes: "A".repeat(2001),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Notes must be a string and cannot exceed 2000 characters",
      );
    });
  });

  // validateLinkedRecipesArray //
  describe("validateRecipeData - linkedRecipes", () => {
    test("should return an array of valid linked recipes that have valid roles", () => {
      const validLinkedRecipes = [
        { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "component" },
        { recipeId: "60c72b2f9b1d8e5a5c8f9a2", role: "pairing" },
        { recipeId: "60c72b2f9b1d8e5a5c8f9a3", role: "variation" },
      ];

      const dataWithValidLinkedRecipes = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify(validLinkedRecipes),
      };

      const result = validateRecipeData(dataWithValidLinkedRecipes);
      expect(result.linkedRecipes).toEqual(validLinkedRecipes);
    });

    test("should return an empty array if linkedRecipes is not provided", () => {
      const dataWithoutLinkedRecipes = { ...fullTestRecipeDataComplete };
      delete dataWithoutLinkedRecipes.linkedRecipes;

      const result = validateRecipeData(dataWithoutLinkedRecipes);
      expect(result.linkedRecipes).toEqual([]);
    });

    test("should throw an error if linkedRecipes is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: "Not an array",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid linked recipes");
    });

    test("should throw an error if linkedRecipes is not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify("Not an array"),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Linked recipes must be an array");
    });

    test("should throw an error if a linked recipe is missing recipeId", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([{ role: "pairing" }]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Each linked recipe must have a valid recipeId");
    });

    test("should throw an error if a linked recipe is missing role", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1" },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Each linked recipe must have a valid role");
    });

    test("should throw an error if a linked recipe has an invalid role", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "invalidrole" },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Each linked recipe must have a valid role");
    });

    test("should throw an error if there are duplicate linked recipes", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "component" },
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "pairing" },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Each linked recipe must be unique");
    });

    test("should throw an error if a linked recipe is the same as the current recipe", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "component" },
        ]),
        _id: "60c72b2f9b1d8e5a5c8f9a1",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Recipe cannot link to itself");
    });

    test("should throw an error if there are more than 3 linked recipes", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "component" },
          { recipeId: "60c72b2f9b1d8e5a5c8f9a2", role: "pairing" },
          { recipeId: "60c72b2f9b1d8e5a5c8f9a3", role: "variation" },
          { recipeId: "60c72b2f9b1d8e5a5c8f9a4", role: "component" },
        ]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "A recipe cannot have more than 3 linked recipes",
      );
    });
  });

  // validateRecipeArray //
  describe("validateRecipeData - array validation", () => {
    test("should trim whitespace from array items and return them", () => {
      const dataWithWhitespace = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(["   Tag1   ", "   Tag2   "]),
      };

      const result = validateRecipeData(dataWithWhitespace);
      expect(result.tags).toContain("Tag1");
      expect(result.tags).toContain("Tag2");
      expect(result.tags.length).toBe(2);
    });

    test("should return an empty array if array is not provided", () => {
      const dataWithoutArray = { ...fullTestRecipeDataComplete };
      delete dataWithoutArray.tags;

      const result = validateRecipeData(dataWithoutArray);
      expect(result.tags).toEqual([]);
    });

    test("should remove duplicate items from the array and return unique items", () => {
      const dataWithDuplicates = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(["Tag1", "Tag2", "Tag1", "Tag3", "Tag2"]),
      };

      const result = validateRecipeData(dataWithDuplicates);
      expect(result.tags).toContain("Tag1");
      expect(result.tags).toContain("Tag2");
      expect(result.tags).toContain("Tag3");
      expect(result.tags.length).toBe(3);
    });

    test("should throw an error if tags is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: "Not an array",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid tags");
    });

    test("should throw an error if tags is not an array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify("Not an array"),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Tags must be an array");
    });

    test("should throw an error if there are too many tags in the array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(
          Array.from({ length: 11 }, (_, i) => `Tag${i + 1}`),
        ),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe cannot have more than 10 tags");
    });

    test("should throw an error if holidays are not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        holidays: Array.from({ length: 4 }, (_, i) => `Holiday${i + 1}`),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid holidays");
    });

    test("should throw an error if there are too many holidays in the array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        holidays: JSON.stringify(
          Array.from({ length: 4 }, (_, i) => `Holiday${i + 1}`),
        ),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe cannot have more than 3 holidays");
    });

    test("should throw an error if seasons is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        seasons: Array.from({ length: 4 }, (_, i) => `Season${i + 1}`),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid seasons");
    });

    test("should throw an error if there are too many seasons in the array", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        seasons: JSON.stringify(
          Array.from({ length: 4 }, (_, i) => `Season${i + 1}`),
        ),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("A recipe cannot have more than 3 seasons");
    });

    test("should throw an error if an array item is not a valid string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(["   ", 123, null]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("All tags must be in string format");
    });

    test("should throw an error if a tag is too short", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(["A"]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Tags must be between 2 and 50 characters long");
    });

    test("should throw an error if image is not an object", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        image: "Not an object",
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Image must be an object or null");
    });

    test("should throw an error if image is not null and missing imageURL", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        image: {
          publicId: "test",
        },
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Image URL must be a string and cannot exceed 2048 characters",
      );
    });

    test("should throw an error if image is not null and missing publicId", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        image: {
          imageURL: "http://example.com",
        },
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Public ID must be a string");
    });

    test("should throw an error if the image url is too long", async () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        image: {
          imageURL: "http://" + "a".repeat(2048) + ".com",
          publicId: "test",
        },
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Image URL must be a string and cannot exceed 2048 characters",
      );
    });

    test("should throw an error if a source does not a name", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          url: "https://www.example.com",
          note: "This source has no name, which is not allowed.",
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Source must have a name");
    });

    test("should throw an error if the source url is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          url: 123,
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Source must have a name");
    });

    test("should throw an error if the source url is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: "example source",
          url: "http://" + "a".repeat(2048) + ".com",
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Source URL must be a string and cannot exceed 2048 characters",
      );
    });

    test("should throw an error if the source url is not https", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: "example source",
          url: "http://www.example.com",
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Source URL must start with https://");
    });

    test("should throw an error if the source name is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: 123,
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Source name must be a string and cannot exceed 100 characters",
      );
    });

    test("should throw an error if the source name is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: "A".repeat(101),
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Source name must be a string and cannot exceed 100 characters",
      );
    });

    test("should throw an error if the source note is not a string", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: "example source",
          note: 123,
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Source note must be a string and cannot exceed 100 characters",
      );
    });

    test("should throw an error if the source note is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: {
          name: "example source",
          note: "A".repeat(101),
        },
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid source");
    });

    test("should throw an error if the source note is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        source: JSON.stringify({
          name: "example source",
          note: "A".repeat(101),
        }),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Source note must be a string and cannot exceed 100 characters",
      );
    });

    test("should throw an error if a tag is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        tags: JSON.stringify(["A".repeat(51)]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Tags must be between 2 and 50 characters long");
    });

    test("should throw an error if a cuisine is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        cuisines: ["A"],
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid cuisines");
    });

    test("should throw an error if a cuisine is too short", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        cuisines: JSON.stringify(["A"]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Cuisines must be between 2 and 50 characters long",
      );
    });

    test("should throw an error if a cuisine is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        cuisines: JSON.stringify(["A".repeat(51)]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Cuisines must be between 2 and 50 characters long",
      );
    });

    test("should throw an error if a meal type is not JSON", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        meals: ["A"],
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain("Invalid meals");
    });

    test("should throw an error if a meal type is too short", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        meals: JSON.stringify(["A"]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Meals must be between 2 and 50 characters long",
      );
    });

    test("should throw an error if a meal type is too long", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        meals: JSON.stringify(["A".repeat(51)]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Meals must be between 2 and 50 characters long",
      );
    });
  });

  // Multiple validation errors //
  describe("validateRecipeData - multiple validation errors", () => {
    test("should return all validation errors when multiple fields are invalid", () => {
      const invalidData = {
        ...fullTestRecipeDataComplete,
        title: "Hi",
        ingredientSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            ingredients: [],
          },
        ]),
        stepSections: JSON.stringify([
          {
            sectionTitle: "Test Section",
            steps: ["   "],
          },
        ]),
        preptimeSeconds: "-1",
        cooktimeSeconds: "86401",
        servings: "100",
        notes: "A".repeat(2001),
        linkedRecipes: JSON.stringify([
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "invalidrole" },
          { recipeId: "60c72b2f9b1d8e5a5c8f9a1", role: "component" },
        ]),
        tags: JSON.stringify(["A"]),
      };

      const errors = getValidationErrors(() => validateRecipeData(invalidData));

      expect(errors).toContain(
        "Title must be a string between 3 and 100 characters long",
      );
      expect(errors).toContain("A recipe must have at least one ingredient");
      expect(errors).toContain("A recipe must have at least one step");
      expect(errors).toContain(
        "Prep time must be a number between 0 and 1 day",
      );
      expect(errors).toContain(
        "Cook time must be a number between 0 and 1 day",
      );
      expect(errors).toContain("Servings must be a number between 0 and 99");
      expect(errors).toContain(
        "Notes must be a string and cannot exceed 2000 characters",
      );
      expect(errors).toContain("Each linked recipe must have a valid role");
      expect(errors).toContain("Each linked recipe must be unique");
      expect(errors).toContain("Tags must be between 2 and 50 characters long");
    });
  });
});

// Test cases: saveNewCollection //
describe("saveNewCollection", () => {
  test("should save a new collection with valid tags", async () => {
    const tags = ["test tag 1", "test tag 2"];

    await saveNewCollection({
      newItems: tags,
      collectionModel: Tag,
      getName: (item) => item,
    });

    const savedTags = await Tag.find({ title: { $in: tags } });

    expect(savedTags.length).toBe(tags.length);
    expect(savedTags.map((tag) => tag.title)).toEqual(
      expect.arrayContaining(tags),
    );
  });

  test("should save a new collection with valid ingredients", async () => {
    const ingredientNames = ["test ingredient 1", "test ingredient 2"];

    await saveNewCollection({
      newItems: ingredientNames,
      collectionModel: Ingredient,
      getName: (item) => item,
      mapResults: (item, ingredientId) => ({
        quantity: item.quantity || null,
        measurement: item.measurement || null,
        ingredient: ingredientId,
      }),
    });

    const savedIngredients = await Ingredient.find({
      title: { $in: ingredientNames },
    });

    expect(savedIngredients.length).toBe(ingredientNames.length);
    expect(savedIngredients.map((ingredient) => ingredient.title)).toEqual(
      expect.arrayContaining(ingredientNames),
    );
  });

  test("should save a new collection with duplicate ingredients while saving only unique but keeping duplicates in the mapped results", async () => {
    const ingredientNames = [
      "test ingredient 1",
      "test ingredient 2",
      "test ingredient 1",
    ];

    const savedIngredientsFull = await saveNewCollection({
      newItems: ingredientNames,
      collectionModel: Ingredient,
      getName: (item) => item,
      mapResults: (item, ingredientId) => ({
        quantity: item.quantity || null,
        measurement: item.measurement || null,
        ingredient: ingredientId,
      }),
    });

    const savedIngredients = await Ingredient.find({
      title: { $in: ingredientNames },
    });

    expect(savedIngredients.length).toBe(ingredientNames.length - 1); // Only unique ingredients should be saved
    expect(savedIngredients.map((ingredient) => ingredient.title)).toEqual(
      expect.arrayContaining(ingredientNames.map((item) => item)),
    );

    expect(savedIngredientsFull.length).toBe(ingredientNames.length);
  });

  test("should normalize and save new collection items with extra whitespace", async () => {
    const tagsWithWhitespace = ["   Test Tag 1   ", "   Test Tag 2   "];
    const normalizedTags = ["test tag 1", "test tag 2"];

    await saveNewCollection({
      newItems: tagsWithWhitespace,
      collectionModel: Tag,
      getName: (item) => item,
    });

    const savedTags = await Tag.find({ title: { $in: normalizedTags } });

    expect(savedTags.length).toBe(normalizedTags.length);
    expect(savedTags.map((tag) => tag.title)).toEqual(
      expect.arrayContaining(normalizedTags),
    );
  });

  test("should not save duplicate items in the collection", async () => {
    const tags = ["test tag 1", "test tag 2"];

    // Save the same tags twice
    await createTestTag({ title: "test tag 1" });
    await createTestTag({ title: "test tag 2" });

    await saveNewCollection({
      newItems: tags,
      collectionModel: Tag,
      getName: (item) => item,
    });

    const savedTags = await Tag.find({ title: { $in: tags } });

    expect(savedTags.length).toBe(tags.length);
    expect(savedTags.map((tag) => tag.title)).toEqual(
      expect.arrayContaining(tags),
    );
  });

  test("should return an empty array if no new items are provided", async () => {
    const result = await saveNewCollection({
      newItems: [],
      collectionModel: Tag,
      getName: (item) => item,
    });

    expect(result).toEqual([]);
  });

  test("should return an array with all items even if some items already exist in the collection", async () => {
    const tags = ["test tag 1", "test tag 2", "test tag 3"];

    // Save the first two tags
    await createTestTag({ title: "test tag 1" });
    await createTestTag({ title: "test tag 2" });

    const result = await saveNewCollection({
      newItems: tags,
      collectionModel: Tag,
      getName: (item) => item,
    });

    const savedTags = await Tag.find({ title: { $in: tags } });

    expect(savedTags.length).toBe(tags.length);
    expect(savedTags.map((tag) => tag.title)).toEqual(
      expect.arrayContaining(tags),
    );
    expect(result.length).toBe(tags.length);
  });
});

// Test cases: validateAndSaveNewRecipe //
describe("validateAndSaveNewRecipe", () => {
  test("should validate and save a new recipe with valid data", async () => {
    const result = await validateAndSaveNewRecipe({
      ...fullTestRecipeDataCompleteNonJSON,
      author: testUser._id,
    });

    expect(result).toHaveProperty("_id");
    expect(result.title).toBe(fullTestRecipeDataCompleteNonJSON.title);
    expect(result.slug).toBe("full-test-recipe");
    expect(result.description).toBe(
      fullTestRecipeDataCompleteNonJSON.description,
    );
    expect(result.ingredientSections).toHaveLength(
      fullTestRecipeDataCompleteNonJSON.ingredientSections.length,
    );
    for (const section of result.ingredientSections) {
      section.ingredients.forEach((item) => {
        expect(item.measurement).toBeNull();
        expect(typeof item.quantity).toBe("string");
      });
    }
    expect(result.stepSections[0].steps).toEqual(
      expect.arrayContaining(
        fullTestRecipeDataCompleteNonJSON.stepSections[0].steps,
      ),
    );
    for (const section of result.stepSections) {
      section.steps.forEach((step) => {
        expect(typeof step).toBe("string");
        expect(step.trim()).toBe(step);
      });
    }
    expect(result.preptimeSeconds.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.preptimeSeconds,
    );
    expect(result.cooktimeSeconds.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.cooktimeSeconds,
    );
    expect(result.servings.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.servings,
    );
    expect(result.image).toBe(fullTestRecipeDataCompleteNonJSON.image);
    expect(result.notes).toBe(fullTestRecipeDataCompleteNonJSON.notes);
    expect(result.linkedRecipes).toEqual(
      expect.arrayContaining(fullTestRecipeDataCompleteNonJSON.linkedRecipes),
    );
    expect(result.author.toString()).toBe(testUser._id.toString());
    expect(result.source).toEqual(expect.any(Object));
    expect(result.tags).toEqual(expect.any(Array));
    expect(result.cuisines).toEqual(expect.any(Array));
    expect(result.meals).toEqual(expect.any(Array));
    expect(result.holidays).toEqual(expect.any(Array));
    expect(result.seasons).toEqual(expect.any(Array));
    expect(result.aggregateRating).toBe(0);
    expect(result.ratingCount).toBe(0);
    expect(result.totalRating).toBe(0);
    expect(result.isPublished).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.isDeleted).toBe(false);
    expect(result.deletedAt).toBeNull();
  });

  test("should validate and save a new recipe with optional fields missing", async () => {
    const minimalRecipeData = {
      title: "Minimal Test Recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: "Test Ingredient",
              measurement: null,
              quantity: "1",
              additionalInfo:
                "   This is additional info with extra whitespace.   ",
            },
          ],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Test Section",
          steps: ["Test step 1"],
        },
      ],
      preptimeSeconds: "600",
      cooktimeSeconds: "1200",
      servings: "4",
    };

    const result = await validateAndSaveNewRecipe({
      ...minimalRecipeData,
      author: testUser._id,
    });

    expect(result).toHaveProperty("_id");
    expect(result.title).toBe(minimalRecipeData.title);
    expect(result.slug).toBe("minimal-test-recipe");
    expect(result.ingredientSections).toHaveLength(
      minimalRecipeData.ingredientSections.length,
    );
    expect(result.ingredientSections[0].ingredients[0].additionalInfo).toBe(
      minimalRecipeData.ingredientSections[0].ingredients[0].additionalInfo.trim(),
    );
  });

  test("should validate and save a new recipe with linked recipes", async () => {
    testIngredient = await createTestIngredient();

    const linkedRecipe = await createTestRecipe(testUser._id, {
      title: "Linked Test Recipe",
      slug: "linked-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Linked Recipe Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const recipeDataWithLinkedRecipe = {
      ...fullTestRecipeDataCompleteNonJSON,
      linkedRecipes: [{ recipeId: linkedRecipe._id, role: "component" }],
    };

    const result = await validateAndSaveNewRecipe({
      ...recipeDataWithLinkedRecipe,
      author: testUser._id,
    });

    expect(result).toHaveProperty("_id");
    expect(result.linkedRecipes).toHaveLength(1);
    expect(result.linkedRecipes[0].recipeId.toString()).toBe(
      linkedRecipe._id.toString(),
    );
    expect(result.linkedRecipes[0].role).toBe("component");
  });

  test("should validate and save a recipe with the same name from another user", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Duplicate Title Test Recipe",
      slug: "duplicate-title-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const result = await validateAndSaveNewRecipe({
      ...fullTestRecipeDataCompleteNonJSON,
      title: "Duplicate Title Test Recipe",
      author: otherUser._id,
    });

    expect(result).toHaveProperty("_id");
    expect(result.title).toBe("Duplicate Title Test Recipe");
    expect(result.slug).toBe("duplicate-title-test-recipe-1");
  });

  test("should upload the image to Cloudinary and save the image data in the recipe", async () => {
    mockUploadPhoto.mockResolvedValue({
      imageURL:
        "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
      publicId: "test-image",
    });

    const recipeDataWithImage = await validateAndSaveNewRecipe({
      ...fullTestRecipeDataCompleteNonJSON,
      imagePath: "tmp/test-image.jpg",
      author: testUser._id,
    });

    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image.jpg");
    expect(mockDeletePhoto).not.toHaveBeenCalled();

    expect(recipeDataWithImage.get("image").imageURL).toBe(
      "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
    );
    expect(recipeDataWithImage.get("image").publicId).toBe("test-image");
  });

  test("should set image data to null if no image is provided", async () => {
    mockUploadPhoto.mockResolvedValue(null);

    const recipeDataWithoutImage = await validateAndSaveNewRecipe({
      ...fullTestRecipeDataCompleteNonJSON,
      imagePath: undefined,
      author: testUser._id,
    });

    expect(mockUploadPhoto).not.toHaveBeenCalled();
    expect(recipeDataWithoutImage.image).toBe(null);
  });

  test("should delete the uploaded image from Cloudinary if saving the recipe fails", async () => {
    const databaseError = new Error("Database error");

    mockUploadPhoto.mockResolvedValue({
      imageURL:
        "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
      publicId: "test-image",
    });

    jest.spyOn(Recipe.prototype, "save").mockRejectedValue(databaseError);

    await expect(
      validateAndSaveNewRecipe({
        ...fullTestRecipeDataCompleteNonJSON,
        imagePath: "tmp/test-image.jpg",
        author: testUser._id,
      }),
    ).rejects.toThrow(databaseError);

    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image.jpg");
    expect(Recipe.prototype.save).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith("test-image");
  });

  test("should throw an error and not upload a recipe if the image fails to upload to Cloudinary", async () => {
    const uploadError = new Error("Image upload failed");

    mockUploadPhoto.mockRejectedValue(uploadError);

    await expect(
      validateAndSaveNewRecipe({
        ...fullTestRecipeDataCompleteNonJSON,
        imagePath: "tmp/test-image.jpg",
        author: testUser._id,
      }),
    ).rejects.toThrow(uploadError);

    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image.jpg");
    expect(mockDeletePhoto).not.toHaveBeenCalled();

    const recipes = await Recipe.find();
    expect(recipes).toHaveLength(0);
  });

  test("should throw an error if the user already has a recipe with the same title", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Duplicate Title Test Recipe",
      slug: "duplicate-title-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(
      validateAndSaveNewRecipe({
        ...fullTestRecipeDataComplete,
        title: "Duplicate Title Test Recipe",
        author: testUser._id,
      }),
    ).rejects.toThrow("You already have a recipe with this title");
  });

  test("should throw an error if the given linked recipe does not exist", async () => {
    const recipeId = new mongoose.Types.ObjectId();

    const recipeDataWithInvalidLinkedRecipe = {
      ...fullTestRecipeDataCompleteNonJSON,
      linkedRecipes: [{ recipeId: recipeId, role: "component" }],
    };

    await expect(
      validateAndSaveNewRecipe({
        ...recipeDataWithInvalidLinkedRecipe,
        author: testUser._id,
      }),
    ).rejects.toThrow(
      "One or more linked recipes do not exist or are not published",
    );
  });

  test("should throw an error if the given linked recipe exists but is not published", async () => {
    testIngredient = await createTestIngredient();

    const unpublishedLinkedRecipe = await createTestRecipe(testUser._id, {
      title: "Unpublished Linked Recipe",
      slug: "unpublished-linked-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const recipeDataWithUnpublishedLinkedRecipe = {
      ...fullTestRecipeDataCompleteNonJSON,
      linkedRecipes: [
        { recipeId: unpublishedLinkedRecipe._id, role: "component" },
      ],
    };

    await expect(
      validateAndSaveNewRecipe({
        ...recipeDataWithUnpublishedLinkedRecipe,
        author: testUser._id,
      }),
    ).rejects.toThrow(
      "One or more linked recipes do not exist or are not published",
    );
  });
});

// Test cases: validateAndUpdateRecipe //
describe("validateAndUpdateRecipe", () => {
  test("should validate and update an existing recipe with valid data", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(result._id.toString()).toBe(existingRecipe._id.toString());
    expect(result.title).toBe(fullTestRecipeDataCompleteNonJSON.title);
    expect(result.slug).toBe("full-test-recipe");
    expect(result.description).toBe(
      fullTestRecipeDataCompleteNonJSON.description,
    );
    expect(result.ingredientSections).toHaveLength(
      fullTestRecipeDataCompleteNonJSON.ingredientSections.length,
    );
    expect(result.ingredientSections[0].ingredients).toHaveLength(
      fullTestRecipeDataCompleteNonJSON.ingredientSections[0].ingredients
        .length,
    );
    result.ingredientSections[0].ingredients.forEach((item) => {
      expect(item.measurement).toBeNull();
      expect(typeof item.quantity).toBe("string");
    });
    for (const [sectionIndex, section] of result.stepSections.entries()) {
      section.steps.forEach((step, index) => {
        expect(typeof step).toBe("string");
        expect(step.trim()).toBe(step);
        expect(step).toBe(
          fullTestRecipeDataCompleteNonJSON.stepSections[sectionIndex].steps[
            index
          ],
        );
      });
    }
    expect(result.preptimeSeconds.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.preptimeSeconds,
    );
    expect(result.cooktimeSeconds.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.cooktimeSeconds,
    );
    expect(result.servings.toString()).toBe(
      fullTestRecipeDataCompleteNonJSON.servings,
    );
    expect(result.image).toBe(fullTestRecipeDataCompleteNonJSON.image);
    expect(result.notes).toBe(fullTestRecipeDataCompleteNonJSON.notes);
    expect(result.linkedRecipes).toEqual(
      expect.arrayContaining(fullTestRecipeDataCompleteNonJSON.linkedRecipes),
    );
    expect(result.author.toString()).toBe(testUser._id.toString());
    expect(result.source).toEqual(expect.any(Object));
    expect(result.tags).toEqual(expect.any(Array));
    expect(result.cuisines).toEqual(expect.any(Array));
    expect(result.meals).toEqual(expect.any(Array));
    expect(result.holidays).toEqual(expect.any(Array));
    expect(result.seasons).toEqual(expect.any(Array));
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  test("should update the slug if the title is changed while other fields remain the same", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      title: "Updated Test Recipe",
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(result.title).toBe("Updated Test Recipe");
    expect(result.slug).toBe("updated-test-recipe");
    expect(result.description).toBe(existingRecipe.description);
    expect(result.steps).toEqual(existingRecipe.steps);
    expect(result.preptimeSeconds).toBe(existingRecipe.preptimeSeconds);
    expect(result.cooktimeSeconds).toBe(existingRecipe.cooktimeSeconds);
    expect(result.servings).toBe(existingRecipe.servings);
    expect(result.image).toBe(null);
    expect(result.notes).toBe(existingRecipe.notes);
    expect(result.linkedRecipes).toEqual(existingRecipe.linkedRecipes);
  });

  test("should not update the slug if the title is unchanged", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      description: "Updated description",
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(result.title).toBe("Existing Test Recipe");
    expect(result.slug).toBe("existing-test-recipe");
  });

  test("should append a '-1' to a slug if another user already has a recipe with the same title", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const existingRecipe = await createTestRecipe(otherUser._id, {
      title: "Other Existing Test Recipe",
      slug: "other-existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      title: "Existing Test Recipe",
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: otherUser._id,
    });

    expect(result.title).toBe("Existing Test Recipe");
    expect(result.slug).toBe("existing-test-recipe-1");
  });

  test("should update all ingredients when the ingredients are changed while other fields remain the same", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: "New Ingredient", quantity: "2" }],
        },
      ],
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    const newIngredient = await Ingredient.findOne({ title: "New Ingredient" });

    expect(result.ingredientSections).toHaveLength(1);
    expect(result.ingredientSections[0].sectionTitle).toBe("Test Section");
    expect(result.ingredientSections[0].ingredients).toHaveLength(1);
    expect(
      result.ingredientSections[0].ingredients[0].ingredient.toString(),
    ).toBe(newIngredient._id.toString());
    expect(result.ingredientSections[0].ingredients[0].quantity).toBe("2");
    expect(result.title).toBe(existingRecipe.title);
    expect(result.slug).toBe(existingRecipe.slug);
    expect(result.description).toBe(existingRecipe.description);
    expect(result.steps).toEqual(existingRecipe.steps);
    expect(result.preptimeSeconds).toBe(existingRecipe.preptimeSeconds);
    expect(result.cooktimeSeconds).toBe(existingRecipe.cooktimeSeconds);
    expect(result.servings).toBe(existingRecipe.servings);
    expect(result.image).toBe(null);
    expect(result.notes).toBe(existingRecipe.notes);
    expect(result.linkedRecipes).toEqual(existingRecipe.linkedRecipes);
  });

  test("should update source when the source is changed while other fields remain the same", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      source: {
        url: "https://www.example.com",
        name: "Example source name",
        note: "Example source note",
      },
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(result.source.url).toBe("https://www.example.com");
    expect(result.source.name).toBe("Example source name");
    expect(result.source.note).toBe("Example source note");
    expect(result.title).toBe(existingRecipe.title);
    expect(result.slug).toBe(existingRecipe.slug);
    expect(result.description).toBe(existingRecipe.description);
    expect(result.stepSections[0].steps).toEqual(
      existingRecipe.stepSections[0].steps,
    );
    expect(result.preptimeSeconds).toBe(existingRecipe.preptimeSeconds);
    expect(result.cooktimeSeconds).toBe(existingRecipe.cooktimeSeconds);
    expect(result.servings).toBe(existingRecipe.servings);
    expect(result.image).toBe(null);
    expect(result.notes).toBe(existingRecipe.notes);
    expect(result.linkedRecipes).toEqual(existingRecipe.linkedRecipes);
  });

  test("should update all tags when the tags are changed while other fields remain the same", async () => {
    const tag1 = await createTestTag({ title: "Tag 1" });
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      tags: [tag1._id],
    });

    const updatedData = {
      tags: ["Tag 2"],
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    const tag2 = await Tag.findOne({ title: "Tag 2" });

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].toString()).toBe(tag2._id.toString());
    expect(result.title).toBe(existingRecipe.title);
    expect(result.slug).toBe(existingRecipe.slug);
    expect(result.description).toBe(existingRecipe.description);
    expect(result.steps).toEqual(existingRecipe.steps);
    expect(result.preptimeSeconds).toBe(existingRecipe.preptimeSeconds);
    expect(result.cooktimeSeconds).toBe(existingRecipe.cooktimeSeconds);
    expect(result.servings).toBe(existingRecipe.servings);
    expect(result.image).toBe(null);
    expect(result.notes).toBe(existingRecipe.notes);
    expect(result.linkedRecipes).toEqual(existingRecipe.linkedRecipes);
  });

  test("should not update the tags if the tags are unchanged", async () => {
    const tag1 = await createTestTag({ title: "Tag 1" });
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      tags: [tag1._id],
    });

    const updatedData = {
      description: "Updated description",
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].toString()).toBe(tag1._id.toString());
  });

  test("should update the image when a new image is uploaded", async () => {
    mockUploadPhoto.mockResolvedValue({
      imageURL:
        "https://res.cloudinary.com/test/image/upload/v1234567891/test-image2.jpg",
      publicId: "test-image2",
    });

    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      imagePath: "tmp/test-image2.jpg",
      userId: testUser._id,
    });

    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image2.jpg");
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith("test-image");

    expect(result.get("image").imageURL).toBe(
      "https://res.cloudinary.com/test/image/upload/v1234567891/test-image2.jpg",
    );
    expect(result.get("image").publicId).toBe("test-image2");
  });

  test("should remove the existing image when no new image is uploaded", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(mockUploadPhoto).not.toHaveBeenCalled();
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith("test-image");

    expect(result.get("image")).toBe(null);
  });

  test("should not delete the previous image when there was no original image and no new image is uploaded", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    const result = await validateAndUpdateRecipe({
      updatedRecipeData: updatedData,
      oldRecipe: existingRecipe,
      userId: testUser._id,
    });

    expect(mockUploadPhoto).not.toHaveBeenCalled();
    expect(mockDeletePhoto).not.toHaveBeenCalled();
    expect(result.get("image")).toBe(null);
  });

  test("should delete the uploaded image from cloudinary and keep the original image if saving the updated recipe fails", async () => {
    const databaseError = new Error("Database error");

    mockUploadPhoto.mockResolvedValue({
      imageURL:
        "https://res.cloudinary.com/test/image/upload/v1234567891/test-image2.jpg",
      publicId: "test-image2",
    });

    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    jest.spyOn(Recipe, "findByIdAndUpdate").mockRejectedValue(databaseError);

    await expect(
      validateAndUpdateRecipe({
        updatedRecipeData: updatedData,
        oldRecipe: existingRecipe,
        imagePath: "tmp/test-image2.jpg",
        userId: testUser._id,
      }),
    ).rejects.toThrow(databaseError);

    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image2.jpg");
    expect(Recipe.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).not.toHaveBeenCalledWith("test-image");
    expect(mockDeletePhoto).toHaveBeenCalledWith("test-image2");
  });

  test("should throw an error and keep the original image if the new image fails to upload to Cloudinary", async () => {
    const uploadError = new Error("Image upload failed");

    mockUploadPhoto.mockRejectedValue(uploadError);

    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    await expect(
      validateAndUpdateRecipe({
        updatedRecipeData: updatedData,
        oldRecipe: existingRecipe,
        imagePath: "tmp/test-image2.jpg",
        userId: testUser._id,
      }),
    ).rejects.toThrow(uploadError);

    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image2.jpg");
    expect(mockDeletePhoto).not.toHaveBeenCalled();

    const recipeAfterFailedUpdate = await Recipe.findById(existingRecipe._id);
    expect(recipeAfterFailedUpdate.image.imageURL).toBe(
      "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
    );
    expect(recipeAfterFailedUpdate.image.publicId).toBe("test-image");
  });

  test("should throw an error but still keep the updated recipe image if the old image fails to delete from Cloudinary after a successful update", async () => {
    const deleteError = new Error("Image deletion failed");

    mockUploadPhoto.mockResolvedValue({
      imageURL:
        "https://res.cloudinary.com/test/image/upload/v1234567891/test-image2.jpg",
      publicId: "test-image2",
    });

    mockDeletePhoto.mockRejectedValue(deleteError);

    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataCompleteNonJSON,
    };

    await expect(
      validateAndUpdateRecipe({
        updatedRecipeData: updatedData,
        oldRecipe: existingRecipe,
        imagePath: "tmp/test-image2.jpg",
        userId: testUser._id,
      }),
    ).rejects.toThrow(deleteError);

    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).toHaveBeenCalledWith("tmp/test-image2.jpg");
    expect(mockDeletePhoto).toHaveBeenCalledTimes(1);
    expect(mockDeletePhoto).toHaveBeenCalledWith("test-image");

    const recipeAfterFailedUpdate = await Recipe.findById(existingRecipe._id);
    expect(recipeAfterFailedUpdate.image.imageURL).toBe(
      "https://res.cloudinary.com/test/image/upload/v1234567891/test-image2.jpg",
    );
    expect(recipeAfterFailedUpdate.image.publicId).toBe("test-image2");
  });

  test("should throw an error if the user is not the author of the recipe", async () => {
    testIngredient = await createTestIngredient();

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      image: {
        imageURL:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg",
        publicId: "test-image",
      },
    });

    const updatedData = {
      ...fullTestRecipeDataComplete,
    };

    await expect(
      validateAndUpdateRecipe({
        updatedRecipeData: updatedData,
        oldRecipe: existingRecipe,
        userId: otherUser._id,
      }),
    ).rejects.toThrow("You do not have permission to edit this recipe");
  });

  test("should throw an error if the updated title is the same as another recipe by the same user", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const existingRecipe = await createTestRecipe(testUser._id, {
      title: "Another Test Recipe",
      slug: "another-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedData = {
      title: "Existing Test Recipe",
    };

    await expect(
      validateAndUpdateRecipe({
        updatedRecipeData: updatedData,
        oldRecipe: existingRecipe,
        userId: testUser._id,
      }),
    ).rejects.toThrow("You already have a recipe with this title");
  });
});

// Test cases: updateRecipePublicationStatus //
describe("updateRecipePublicationStatus", () => {
  test("should update the publication status of a published recipe to unpublished", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    const result = await updateRecipePublicationStatus(recipe, testUser._id);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.isPublished).toBe(false);
  });

  test("should update the publication status of a unpublished recipe to published", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const result = await updateRecipePublicationStatus(recipe, testUser._id);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.isPublished).toBe(true);
  });

  test("should throw an error if the user is not the author of the recipe", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    await expect(
      updateRecipePublicationStatus(recipe, otherUser._id),
    ).rejects.toThrow("You do not have permission to update this recipe");
  });
});

// Test cases: softDeleteRecipe //
describe("softDeleteRecipe", () => {
  test("should soft delete a recipe and update associated fields", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const originalRecipeTitle = recipe.title;
    const originalRecipeSlug = recipe.slug;

    await softDeleteRecipe(recipe, testUser._id);

    const deletedRecipe = await Recipe.findById(recipe._id).select(
      "+isDeleted +deletedAt",
    );

    expect(deletedRecipe._id.toString()).toBe(recipe._id.toString());
    expect(deletedRecipe.isDeleted).toBe(true);
    expect(deletedRecipe.deletedAt).toBeInstanceOf(Date);
    expect(deletedRecipe.isPublished).toBe(false);
    expect(deletedRecipe.title).toBe(
      `[Deleted] ${originalRecipeTitle}_${recipe._id.toString().slice(-6)}`,
    );
    expect(deletedRecipe.slug).toBe(`deleted-${originalRecipeSlug}`);
  });

  test("should allow duplicate titles for deleted recipes and avoid duplicate slugs", async () => {
    testIngredient = await createTestIngredient();

    const recipe1 = await createTestRecipe(testUser._id, {
      title: "Test Recipe",
      slug: "test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await softDeleteRecipe(recipe1, testUser._id);

    const recipe2 = await createTestRecipe(testUser._id, {
      title: "Test Recipe",
      slug: "test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await softDeleteRecipe(recipe2, testUser._id);

    const deletedRecipe2 = await Recipe.findById(recipe2._id);

    expect(deletedRecipe2._id.toString()).toBe(recipe2._id.toString());
    expect(deletedRecipe2.title).toBe(
      `[Deleted] Test Recipe_${recipe2._id.toString().slice(-6)}`,
    );
    expect(deletedRecipe2.slug).toBe(`deleted-test-recipe-1`);
  });

  test("should trim the title and append the unique identifier correctly if the title is close to the maximum length when trying to soft delete", async () => {
    testIngredient = await createTestIngredient();
    const longTitle =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=~`"
        .repeat(2)
        .slice(0, 100);

    const recipe = await createTestRecipe(testUser._id, {
      title: longTitle,
      slug: "long-title-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await softDeleteRecipe(recipe, testUser._id);

    const deletedRecipe = await Recipe.findById(recipe._id);

    expect(deletedRecipe._id.toString()).toBe(recipe._id.toString());
    expect(deletedRecipe.title).toBe(
      `[Deleted] ${longTitle.slice(0, 83)}_${recipe._id.toString().slice(-6)}`,
    );
  });

  test("should delete all ratings associated with the recipe when soft deleting", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestRating(recipe._id, otherUser._id);

    const ratings = await Rating.find({ recipeId: recipe._id });
    expect(ratings.length).toBe(1);

    await softDeleteRecipe(recipe, testUser._id);
    const deletedRatings = await Rating.find({ recipeId: recipe._id });

    expect(deletedRatings.length).toBe(0);
  });

  test("should delete all personal notes associated with the recipe when soft deleting", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestNote(otherUser._id, recipe._id);

    const notes = await Note.find({ recipeId: recipe._id });
    expect(notes.length).toBe(1);

    await softDeleteRecipe(recipe, testUser._id);
    const deletedNotes = await Note.find({ recipeId: recipe._id });

    expect(deletedNotes.length).toBe(0);
  });

  test("should delete all comments and child comments associated with the recipe when soft deleting", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(otherUser._id, recipe._id);
    const childComment = await createTestComment(
      otherUser._id,
      recipe._id,
      comment._id,
    );

    const comments = await Comment.find({ recipeId: recipe._id });
    expect(comments.length).toBe(2);

    await softDeleteRecipe(recipe, testUser._id);
    const deletedComments = await Comment.find({ recipeId: recipe._id });

    expect(deletedComments.length).toBe(0);
  });

  test("should delete all comment and child comment votes associated with the recipe when soft deleting", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(otherUser._id, recipe._id);
    const childComment = await createTestComment(
      otherUser._id,
      recipe._id,
      comment._id,
    );

    await createTestCommentVote(otherUser._id, comment._id, "upvote");
    await createTestCommentVote(otherUser._id, childComment._id, "downvote");

    const commentVotes = await CommentVote.find({ commentId: comment._id });
    expect(commentVotes.length).toBe(1);
    const childCommentVotes = await CommentVote.find({
      commentId: childComment._id,
    });
    expect(childCommentVotes.length).toBe(1);

    await softDeleteRecipe(recipe, testUser._id);
    const deletedCommentVotes = await CommentVote.find({
      commentId: comment._id,
    });
    const deletedChildCommentVotes = await CommentVote.find({
      commentId: childComment._id,
    });

    expect(deletedCommentVotes.length).toBe(0);
    expect(deletedChildCommentVotes.length).toBe(0);
  });

  test("should throw an error if the user is not the author of the recipe", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(softDeleteRecipe(recipe, otherUser._id)).rejects.toThrow(
      "You do not have permission to delete this recipe",
    );
  });
});

// Test cases: restoreDeletedRecipe //
describe("restoreDeletedRecipe", () => {
  test("should restore a soft deleted recipe and update associated fields", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      title: "[Deleted] Test Recipe",
      slug: "test-recipe-deleted",
      isDeleted: true,
      deletedAt: new Date(),
      isPublished: false,
    });

    const result = await restoreDeletedRecipe(recipe.slug, testUser._id);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.title).toBe("Test Recipe");
    expect(result.slug).toBe("test-recipe");
    expect(result.isDeleted).toBe(false);
    expect(result.deletedAt).toBeNull();
    expect(result.isPublished).toBe(true);
  });

  test("should update the slug correctly if another recipe with the same slug already exists when trying to restore", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Test Recipe",
      slug: "test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const deletedRecipe = await createTestRecipe(testUser._id, {
      title: "[Deleted] Test Recipe 1",
      slug: "test-recipe-deleted",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const result = await restoreDeletedRecipe(deletedRecipe.slug, testUser._id);

    expect(result._id.toString()).toBe(deletedRecipe._id.toString());
    expect(result.title).toBe("Test Recipe 1");
    expect(result.slug).toBe("test-recipe-1");
  });

  test("should throw an error if recipe slug does not exist", async () => {
    await expect(
      restoreDeletedRecipe("non-existent-slug", testUser._id),
    ).rejects.toThrow("Recipe not found or not deleted");
  });

  test("should throw an error if recipe slug is not already deleted", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: false,
    });

    await expect(
      restoreDeletedRecipe(recipe.slug, testUser._id),
    ).rejects.toThrow("Recipe not found or not deleted");
  });

  test("should throw an error if the user is not the author of the recipe", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await expect(
      restoreDeletedRecipe(recipe.slug, otherUser._id),
    ).rejects.toThrow("You do not have permission to restore this recipe");
  });

  test("should throw an error if the user is trying to restore a recipe with a title that already exists as another recipe by the same user", async () => {
    testIngredient = await createTestIngredient();

    await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const deletedRecipe = await createTestRecipe(testUser._id, {
      title: "Existing Test Recipe",
      slug: "existing-test-recipe-1",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await expect(
      restoreDeletedRecipe(deletedRecipe.slug, testUser._id),
    ).rejects.toThrow("You already have a recipe with this title");
  });
});

// Test cases: rateSpecificRecipe //
describe("rateSpecificRecipe", () => {
  test("should allow a user to rate a recipe and update the recipe's rating fields correctly", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const result = await rateSpecificRecipe(recipe, otherUser._id, 4);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBe(4);
    expect(result.ratingCount).toBe(1);
    expect(result.totalRating).toBe(4);
  });

  test("should update rating fields correctly when recipe already has perfect ratings", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 5,
      ratingCount: 30,
      totalRating: 150,
    });

    const result = await rateSpecificRecipe(recipe, otherUser._id, 5);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBe(5);
    expect(result.ratingCount).toBe(31);
    expect(result.totalRating).toBe(155);
  });

  test("should update rating fields correctly when recipe already has some ratings but not perfect", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 3.5,
      ratingCount: 10,
      totalRating: 35,
    });

    const result = await rateSpecificRecipe(recipe, otherUser._id, 4);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBeCloseTo(3.545, 3);
    expect(result.ratingCount).toBe(11);
    expect(result.totalRating).toBe(39);
  });

  test("should update an existing lower rating for the same user and adjust the recipe's rating fields correctly", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 3.5,
      ratingCount: 10,
      totalRating: 35,
    });

    const existingRating = await createTestRating(recipe._id, otherUser._id, {
      rating: 3,
    });

    const result = await rateSpecificRecipe(recipe, otherUser._id, 5);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBeCloseTo(3.7, 3);
    expect(result.ratingCount).toBe(10);
    expect(result.totalRating).toBe(37);
    const updatedRating = await Rating.findById(existingRating._id);
    expect(updatedRating.rating).toBe(5);
  });

  test("should update an existing higher rating for the same user and adjust the recipe's rating fields correctly", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 4.5,
      ratingCount: 20,
      totalRating: 90,
    });

    const existingRating = await createTestRating(recipe._id, otherUser._id, {
      rating: 5,
    });

    const result = await rateSpecificRecipe(recipe, otherUser._id, 1);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBeCloseTo(4.3, 3);
    expect(result.ratingCount).toBe(20);
    expect(result.totalRating).toBe(86);
    const updatedRating = await Rating.findById(existingRating._id);
    expect(updatedRating.rating).toBe(1);
  });

  test("should throw an error if the user tries to rate their own recipe", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(rateSpecificRecipe(recipe, testUser._id, 5)).rejects.toThrow(
      "You cannot rate your own recipe",
    );
  });

  test("should throw an error if the rating value is less than 1", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(rateSpecificRecipe(recipe, otherUser._id, 0)).rejects.toThrow(
      "Rating must be a number between 1 and 5",
    );
  });

  test("should throw an error if the rating value is greater than 5", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(rateSpecificRecipe(recipe, otherUser._id, 6)).rejects.toThrow(
      "Rating must be a number between 1 and 5",
    );
  });
});

// Test cases: removeRatingFromSpecificRecipe //
describe("removeRatingFromSpecificRecipe", () => {
  test("should allow a user to remove their rating from a recipe and update the recipe's rating fields correctly", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 4,
      ratingCount: 1,
      totalRating: 4,
    });

    await createTestRating(recipe._id, otherUser._id, { rating: 4 });

    const result = await removeRatingFromSpecificRecipe(recipe, otherUser._id);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBe(0);
    expect(result.ratingCount).toBe(0);
    expect(result.totalRating).toBe(0);
    const deletedRating = await Rating.findOne({
      recipe: recipe._id,
      user: otherUser._id,
    });
    expect(deletedRating).toBeNull();
  });

  test("should calculate the aggregate rating correctly after a rating is removed when there are multiple ratings", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      aggregateRating: 3.5,
      ratingCount: 2,
      totalRating: 7,
    });

    await createTestRating(recipe._id, otherUser._id, { rating: 4 });

    const result = await removeRatingFromSpecificRecipe(recipe, otherUser._id);

    expect(result._id.toString()).toBe(recipe._id.toString());
    expect(result.aggregateRating).toBe(3);
    expect(result.ratingCount).toBe(1);
    expect(result.totalRating).toBe(3);
  });

  test("should throw an error if the user tries to remove a rating that does not exist", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(
      removeRatingFromSpecificRecipe(recipe, otherUser._id),
    ).rejects.toThrow("You have not rated this recipe");
  });
});

// Test cases: getAllRecipeComments //
describe("getAllRecipeComments", () => {
  test("should return a blank array when no comments exist for a recipe", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toEqual([]);
    expect(result.totalComments).toBe(0);
    expect(result.currentPage).toBe(page);
    expect(result.totalPages).toBe(0);
  });

  test("should return all comments for a recipe with correct pagination", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestParentComments(testUser._id, recipe._id, 5);

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(5);
    result.comments.forEach((comment) => {
      expect(comment).toHaveProperty("_id");
      expect(comment).toHaveProperty("authorId");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("createdAt");
      expect(comment).toHaveProperty("updatedAt");
    });
  });

  test("should return first page of comments when there are more comments than the limit", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestParentComments(testUser._id, recipe._id, 15);

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(5);
    expect(result.totalComments).toBe(15);
    expect(result.currentPage).toBe(page);
    expect(result.totalPages).toBe(3);
  });

  test("should return a page filled to limit of parent comments with any number of child comments for each parent comment", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const parentComments = await createTestParentComments(
      testUser._id,
      recipe._id,
      10,
    );

    for (const parentComment of parentComments) {
      const numChildComments = Math.floor(Math.random() * 5);
      await createTestChildComments(
        testUser._id,
        recipe._id,
        parentComment._id,
        numChildComments,
      );
    }

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(5);
    result.comments.forEach((comment) => {
      expect(comment).toHaveProperty("_id");
      expect(comment).toHaveProperty("authorId");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("createdAt");
      expect(comment).toHaveProperty("updatedAt");
      expect(comment).toHaveProperty("replies");
      expect(Array.isArray(comment.replies)).toBe(true);
      comment.replies.forEach((reply) => {
        expect(reply.parentCommentId.toString()).toBe(comment._id.toString());
      });
      expect(comment.parentCommentId).toBeNull();
    });
  });

  test("should return a comment with a user vote if the user has voted on that comment", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(otherUser._id, recipe._id);

    await createTestCommentVote(testUser._id, comment._id, "upvote");

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toHaveProperty("userVote");
    expect(result.comments[0].userVote).toBe("upvote");
  });

  test("should return a comment with the authors display name as 'Deleted User' if the author of the comment has been deleted", async () => {
    testIngredient = await createTestIngredient();
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const deletedUser = await createTestUser({
      username: `deletedUser${testUserIndex}`,
      displayName: `deletedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isDeleted: true,
    });

    await createTestComment(deletedUser._id, recipe._id);

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].authorId.displayName).toBe("Deleted User");
  });

  test("should return an array of comments skipping any that are created by banned users", async () => {
    testIngredient = await createTestIngredient();
    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const bannedUser = await createTestUser({
      username: `bannedUser${testUserIndex}`,
      displayName: `bannedUser${testUserIndex++}`,
      email: `${crypto.randomUUID()}@example.com`,
      password: "Password123",
      isBanned: true,
    });

    await createTestComment(bannedUser._id, recipe._id);
    await createTestComment(otherUser._id, recipe._id);

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page,
      limit,
      offset,
    });

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].authorId._id.toString()).toBe(
      otherUser._id.toString(),
    );
  });

  test("should skip the correct number of comments based on the page and limit parameters even with banned user comments", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    for (let i = 0; i < 10; i++) {
      const user = await createTestUser({
        username: `bannedTest${i}`,
        displayName: `bannedTest${i}`,
        email: `${crypto.randomUUID()}@example.com`,
        password: "Password123",
        isBanned: i % 2 === 0,
      });
      await createTestComment(user._id, recipe._id);
    }

    const result = await getAllRecipeComments({
      authorId: testUser._id,
      recipe,
      page: 2,
      limit: 2,
      offset: 0,
    });

    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].authorId.displayName).toBe(`bannedTest5`);
    expect(result.comments[1].authorId.displayName).toBe(`bannedTest3`);
  });
});

// Test cases: validateAndAddComment //
describe("validateAndAddComment", () => {
  test("should add a valid comment to a recipe and return the new comment", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentContent = "This is a test comment";

    const result = await validateAndAddComment({
      authorId: testUser._id,
      recipe,
      content: commentContent,
      parentCommentId: null,
    });

    expect(result).toHaveProperty("_id");
    expect(result.authorId._id.toString()).toBe(testUser._id.toString());
    expect(result.recipeId.toString()).toBe(recipe._id.toString());
    expect(result.content).toBe(commentContent);
    expect(result.parentCommentId).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  test("should add a valid reply to a parent comment and return the new comment", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const parentComment = await createTestComment(otherUser._id, recipe._id);

    const replyContent = "This is a test reply";

    const result = await validateAndAddComment({
      authorId: testUser._id,
      recipe,
      content: replyContent,
      parentCommentId: parentComment._id,
    });

    expect(result).toHaveProperty("_id");
    expect(result.authorId._id.toString()).toBe(testUser._id.toString());
    expect(result.recipeId.toString()).toBe(recipe._id.toString());
    expect(result.content).toBe(replyContent);
    expect(result.parentCommentId.toString()).toBe(
      parentComment._id.toString(),
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  test("should throw an error if the content is not a string", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(
      validateAndAddComment({
        authorId: testUser._id,
        recipe,
        content: 123,
        parentCommentId: null,
      }),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if the content is an empty string", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(
      validateAndAddComment({
        authorId: testUser._id,
        recipe,
        content: "",
        parentCommentId: null,
      }),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if the content exceeds 500 characters", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const longContent = "a".repeat(501);

    await expect(
      validateAndAddComment({
        authorId: testUser._id,
        recipe,
        content: longContent,
        parentCommentId: null,
      }),
    ).rejects.toThrow("Comment must be between 1 and 500 characters");
  });

  test("should throw an error if the parent comment ID does not exist", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await expect(
      validateAndAddComment({
        authorId: testUser._id,
        recipe,
        content: "This is a test comment",
        parentCommentId: new mongoose.Types.ObjectId(),
      }),
    ).rejects.toThrow("Parent comment not found");
  });

  test("should throw an error if the user tries to reply to a child comment", async () => {
    testIngredient = await createTestIngredient();

    const recipe = await createTestRecipe(testUser._id, {
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const parentComment = await createTestComment(otherUser._id, recipe._id);

    const childComment = await createTestComment(
      otherUser._id,
      recipe._id,
      parentComment._id,
    );

    await expect(
      validateAndAddComment({
        authorId: testUser._id,
        recipe,
        content: "This is a test reply",
        parentCommentId: childComment._id,
      }),
    ).rejects.toThrow("Cannot reply to a child comment");
  });
});
