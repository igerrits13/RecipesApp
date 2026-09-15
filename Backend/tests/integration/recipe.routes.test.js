import request from "supertest";
import app from "../../src/app.js";

import User from "../../src/models/user.model.js";
import Recipe from "../../src/models/recipe.model.js";
import Ingredient from "../../src/models/ingredient.model.js";
import Measurement from "../../src/models/measurement.model.js";
import Note from "../../src/models/note.model.js";
import Comment from "../../src/models/comment.model.js";
import Tag from "../../src/models/tag.model.js";
import Rating from "../../src/models/rating.model.js";
import BannedWord from "../../src/models/bannedWord.model.js";
import Report from "../../src/models/report.model.js";

import {
  testUserData,
  createTestUser,
  createSecondaryTestUser,
  getAuthenticatedAgent,
  createTestRecipe,
  createTestIngredient,
  createTestComment,
  createTestMeasurement,
  createTestRating,
  createTestCommentVote,
  createTestBannedWord,
} from "../../src/utils/testFunctions.js";
import Meal from "../../src/models/meal.model.js";
import Cuisine from "../../src/models/cuisine.model.js";

// Base test setup //

let testUser1;
let loginAgent1;
let otherUser;
let testIngredient;
let testRecipeSlugIndex = 0;
let testUserSlugIndex = 0;
let bannedWord;
let flaggedWord;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Measurement.deleteMany({});
  await Report.deleteMany({});
  await BannedWord.deleteMany({});

  testUser1 = await createTestUser(testUserData);
  loginAgent1 = await getAuthenticatedAgent(testUser1);

  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    displayName: "Other User",
    email: "otheruser@example.com",
    password: "password123",
  });

  testIngredient = await createTestIngredient();
  testMeasurement = await createTestMeasurement();

  bannedWord = await createTestBannedWord(testUser1._id, { word: "banned" });
  flaggedWord = await createTestBannedWord(testUser1._id, {
    word: "flagged",
    severity: "flag",
  });
});

// Delete all recipes and notes before each test
beforeEach(async () => {
  await Recipe.deleteMany({});
  await Comment.deleteMany({});
  await Note.deleteMany({});
  await Tag.deleteMany({});
  await Rating.deleteMany({});
});

// Test cases: getAllRecipes //
describe("GET /api/v1/recipes", () => {
  it("should fetch all published recipes", async () => {
    for (let i = 0; i < 15; i++) {
      await createTestRecipe(testUser1._id, {
        title: `Test Recipe ${testRecipeSlugIndex}`,
        slug: `test-recipe-${testRecipeSlugIndex++}`,
        ingredientSections: [
          {
            sectionTitle: "Test Section",
            ingredients: [{ ingredient: testIngredient._id }],
          },
        ],
        isPublished: true,
      });
    }

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    for (const recipe of response.body.recipeList) {
      expect(recipe).toHaveProperty("_id");
      expect(recipe).toHaveProperty("title");
      expect(recipe).toHaveProperty("slug");
      expect(recipe).toHaveProperty("description");
      expect(recipe).toHaveProperty("image");
      expect(recipe).toHaveProperty("preptimeSeconds");
      expect(recipe).toHaveProperty("cooktimeSeconds");
      expect(recipe).toHaveProperty("aggregateRating");
      expect(recipe).toHaveProperty("ratingCount");
      expect(recipe).toHaveProperty("author");
      expect(recipe).toHaveProperty("isPublished");
      expect(recipe).not.toHaveProperty("ingredientSections");
      expect(recipe).not.toHaveProperty("steps");
      expect(recipe).not.toHaveProperty("servings");
      expect(recipe).not.toHaveProperty("notes");
      expect(recipe).not.toHaveProperty("linkedRecipes");
      expect(recipe).not.toHaveProperty("source");
      expect(recipe).not.toHaveProperty("tags");
      expect(recipe).not.toHaveProperty("meals");
      expect(recipe).not.toHaveProperty("cuisines");
      expect(recipe).not.toHaveProperty("holidays");
      expect(recipe).not.toHaveProperty("seasons");
      expect(recipe).not.toHaveProperty("totalRating");
      expect(recipe).not.toHaveProperty("reportCount");
      expect(recipe).not.toHaveProperty("isDeleted");
      expect(recipe).not.toHaveProperty("deletedAt");
      expect(recipe).not.toHaveProperty("createdAt");
      expect(recipe).not.toHaveProperty("updatedAt");
    }
    expect(response.body.recipeList.length).toBe(10);
    expect(response.body.totalRecipes).toBe(15);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.currentPage).toBe(1);
  });

  it("should show deleted user's name as 'Deleted User'", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: `deleteduser${testUserSlugIndex}`,
      displayName: `Deleted User${testUserSlugIndex++}`,
      email: `deleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
    });

    const recipe = await createTestRecipe(deletedUser._id, {
      title: `Deleted User Recipe`,
      slug: `deleted-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    await User.findByIdAndDelete(deletedUser._id);

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Deleted User Recipe") {
        expect(recipe.author.displayName).toBe("Deleted User");
      }
    }
  });

  it("should show soft deleted user's name as 'Deleted User'", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: `softdeleteduser${testUserSlugIndex}`,
      displayName: `Soft Deleted User${testUserSlugIndex++}`,
      email: `softdeleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
      isDeleted: true,
    });

    await createTestRecipe(deletedUser._id, {
      title: `Soft Deleted User Recipe`,
      slug: `soft-deleted-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Soft Deleted User Recipe") {
        expect(recipe.author.displayName).toBe("Deleted User");
      }
    }
  });

  it("should fetch unpublished recipes for the author", async () => {
    await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    let foundUnpublished = false;
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Unpublished Recipe") {
        foundUnpublished = true;
        expect(recipe.isPublished).toBe(false);
      }
    }
    expect(foundUnpublished).toBe(true);
  });

  it("should not fetch unpublished recipes for other users", async () => {
    await createTestRecipe(otherUser._id, {
      title: `Other User Unpublished Recipe`,
      slug: `other-user-unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    let foundOtherUnpublished = false;
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Other User Unpublished Recipe") {
        foundOtherUnpublished = true;
      }
    }
    expect(foundOtherUnpublished).toBe(false);
  });

  it("should not fetch soft deleted recipes", async () => {
    await createTestRecipe(testUser1._id, {
      title: `Deleted Recipe`,
      slug: `deleted-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
      isDeleted: true,
    });

    const response = await loginAgent1.get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    let foundDeletedRecipe = false;
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Deleted Recipe") {
        foundDeletedRecipe = true;
      }
    }
    expect(foundDeletedRecipe).toBe(false);
  });

  it("should fetch all published recipes when user is not authenticated", async () => {
    await createTestRecipe(testUser1._id, {
      title: `Public Recipe`,
      slug: `public-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    const response = await request(app).get("/api/v1/recipes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    let foundPublicRecipe = false;
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Public Recipe") {
        foundPublicRecipe = true;
        expect(recipe.isPublished).toBe(true);
      }
    }
    expect(foundPublicRecipe).toBe(true);
  });

  it("should fetch recipes for a specific user when author query is provided", async () => {
    await createTestRecipe(otherUser._id, {
      title: `Specific User Recipe`,
      slug: `specific-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    await createTestRecipe(testUser1._id, {
      title: `Test User Recipe`,
      slug: `test-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: true,
    });

    const response = await loginAgent1.get(
      "/api/v1/recipes?author=" + otherUser._id,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipeList).toBeDefined();
    expect(Array.isArray(response.body.recipeList)).toBe(true);
    let foundSpecificUserRecipe = false;
    let foundTestUserRecipe = false;
    for (const recipe of response.body.recipeList) {
      if (recipe.title === "Specific User Recipe") {
        foundSpecificUserRecipe = true;
      }
      if (recipe.title === "Test User Recipe") {
        foundTestUserRecipe = true;
      }
    }
    expect(foundSpecificUserRecipe).toBe(true);
    expect(foundTestUserRecipe).toBe(false);
  });
});

// Test cases: createRecipe //
describe("POST /api/v1/recipes", () => {
  it("should create a new recipe with valid data", async () => {
    const testMeasurement = await createTestMeasurement({
      title: "tablespoon",
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const newRecipeData = {
      title: "New Test Recipe",
      description: "This is a new test recipe",
      image: "",
      preptimeSeconds: 300,
      cooktimeSeconds: 600,
      servings: 4,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: testIngredient.title,
              quantity: "2",
              measurement: "tablespoon",
            },
          ],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Test Steps",
          steps: ["Step 1", "Step 2"],
        },
      ],
      source: {
        name: "Test Source",
        note: "Test source note",
      },
      tags: ["tag1", "tag2"],
      meals: ["meal1", "meal2"],
      cuisines: ["cuisine1", "cuisine2"],
      seasons: ["season1", "season2"],
      holidays: ["holiday1"],
      notes: "These are test notes.",
      linkedRecipes: [{ recipeId: testRecipe._id, role: "component" }],
      isApproved: true,
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe).toHaveProperty("_id");
    expect(response.body.recipe.title).toBe(newRecipeData.title);
    expect(response.body.recipe.slug).toBe("new-test-recipe");
    expect(response.body.recipe.description).toBe(newRecipeData.description);
    expect(response.body.recipe.image).toBe(newRecipeData.image);
    expect(response.body.recipe.preptimeSeconds).toBe(
      newRecipeData.preptimeSeconds,
    );
    expect(response.body.recipe.cooktimeSeconds).toBe(
      newRecipeData.cooktimeSeconds,
    );
    expect(response.body.recipe.servings).toBe(newRecipeData.servings);
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        expect(ingredient.ingredient.title).toBeDefined();
        expect(ingredient.measurement.title).toBeDefined();
      }
    }
    expect(response.body.recipe.ingredientSections.length).toBe(1);
    expect(
      response.body.recipe.ingredientSections[0].ingredients[0].ingredient._id,
    ).toBe(testIngredient._id.toString());
    expect(
      response.body.recipe.ingredientSections[0].ingredients[0].quantity,
    ).toBe(newRecipeData.ingredientSections[0].ingredients[0].quantity);
    expect(
      response.body.recipe.ingredientSections[0].ingredients[0].measurement
        .title,
    ).toBe(testMeasurement.title);
    for (const stepSection of response.body.recipe.stepSections) {
      expect(stepSection.sectionTitle).toBeDefined();
      expect(Array.isArray(stepSection.steps)).toBe(true);
      for (const step of stepSection.steps) {
        expect(typeof step).toBe("string");
      }
    }
    expect(response.body.recipe.notes).toBe(newRecipeData.notes);
    expect(response.body.recipe.author.displayName).toBe(testUser1.displayName);
    expect(response.body.recipe.author.profileImage).toBe(
      testUser1.profileImage,
    );
    expect(response.body.recipe.source).toBeDefined();
    expect(response.body.recipe.source.name).toBe(newRecipeData.source.name);
    expect(response.body.recipe.source.note).toBe(newRecipeData.source.note);
    expect(response.body.recipe.tags).toBeDefined();
    expect(Array.isArray(response.body.recipe.tags)).toBe(true);
    expect(response.body.recipe.tags.length).toBe(2);
    expect(response.body.recipe.tags[0].title).toBe("tag1");
    expect(response.body.recipe.tags[1].title).toBe("tag2");
    expect(response.body.recipe.meals).toBeDefined();
    expect(Array.isArray(response.body.recipe.meals)).toBe(true);
    expect(response.body.recipe.meals.length).toBe(2);
    expect(response.body.recipe.meals[0].title).toBe("meal1");
    expect(response.body.recipe.meals[1].title).toBe("meal2");
    expect(response.body.recipe.cuisines).toBeDefined();
    expect(Array.isArray(response.body.recipe.cuisines)).toBe(true);
    expect(response.body.recipe.cuisines.length).toBe(2);
    expect(response.body.recipe.cuisines[0].title).toBe("cuisine1");
    expect(response.body.recipe.cuisines[1].title).toBe("cuisine2");
    expect(response.body.recipe.seasons).toBeDefined();
    expect(Array.isArray(response.body.recipe.seasons)).toBe(true);
    expect(response.body.recipe.seasons.length).toBe(2);
    expect(response.body.recipe.seasons[0].title).toBe("season1");
    expect(response.body.recipe.seasons[1].title).toBe("season2");
    expect(response.body.recipe.holidays).toBeDefined();
    expect(Array.isArray(response.body.recipe.holidays)).toBe(true);
    expect(response.body.recipe.holidays.length).toBe(1);
    expect(response.body.recipe.holidays[0].title).toBe("holiday1");
    expect(response.body.recipe.linkedRecipes).toBeDefined();
    expect(Array.isArray(response.body.recipe.linkedRecipes)).toBe(true);
    expect(response.body.recipe.linkedRecipes.length).toBe(1);
    expect(response.body.recipe.linkedRecipes[0].recipeId._id).toBe(
      String(testRecipe._id),
    );
    expect(response.body.recipe.linkedRecipes[0].role).toBe("component");
    expect(response.body.recipe.linkedRecipes[0].recipeId.title).toBe(
      testRecipe.title,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.slug).toBe(
      testRecipe.slug,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.description).toBe(
      testRecipe.description,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.image).toBe(
      testRecipe.image,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.preptimeSeconds).toBe(
      testRecipe.preptimeSeconds,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.cooktimeSeconds).toBe(
      testRecipe.cooktimeSeconds,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.aggregateRating).toBe(
      testRecipe.aggregateRating,
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.ratingCount).toBe(
      testRecipe.ratingCount,
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.displayName,
    ).toBe(testUser1.displayName);
  });

  it("should return an error when creating a recipe with invalid data", async () => {
    const newRecipeData = {
      title: "",
      slug: "",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient.title }],
        },
      ],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should return an error when creating a recipe with a banned word in the title", async () => {
    const newRecipeData = {
      title: "Banned Test Recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient.title }],
        },
      ],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the description", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      description: "Banned test description",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient.title }],
        },
      ],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the ingredients", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: "banned" }],
        },
      ],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the steps", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      stepSections: [
        {
          sectionTitle: "Test Section",
          steps: ["Banned test step"],
        },
      ],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the notes", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      notes: "Banned test note",
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the tags", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      tags: ["banned"],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the holidays", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      holidays: ["banned"],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when creating a recipe with a banned word in the seasons", async () => {
    const newRecipeData = {
      title: "Test Recipe",
      seasons: ["banned"],
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should create a recipe successfully when any field has a flagged word", async () => {
    const newRecipeData = {
      title: "Flagged Test Recipe",
      description: "Flagged test description",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: "flagged" }],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Test Section",
          steps: ["Flagged test step"],
        },
      ],
      notes: "Flagged test note",
      tags: ["flagged"],
      holidays: ["flagged"],
      seasons: ["flagged"],
      preptimeSeconds: 10,
      cooktimeSeconds: 20,
      servings: 2,
    };

    const response = await loginAgent1
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe created successfully");
  });

  it("should return an error when creating a recipe as an unauthenticated user", async () => {
    const newRecipeData = {
      title: "New Test Recipe",
      slug: "new-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    };

    const response = await request(app)
      .post("/api/v1/recipes")
      .send(newRecipeData);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});

// Test cases: getRecipe //
describe("GET /api/v1/recipes/:recipeSlug", () => {
  it("should fetch a recipe by its slug", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: testIngredient._id,
              quantity: "2",
              measurement: testMeasurement._id,
            },
          ],
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.title).toBe(testRecipe.title);
    expect(response.body.recipe.slug).toBe(testRecipe.slug);
    expect(response.body.recipe.description).toBe(testRecipe.description);
    expect(response.body.recipe.image).toBe(testRecipe.image);
    expect(response.body.recipe.preptimeSeconds).toBe(
      testRecipe.preptimeSeconds,
    );
    expect(response.body.recipe.cooktimeSeconds).toBe(
      testRecipe.cooktimeSeconds,
    );
    expect(response.body.recipe.servings).toBe(testRecipe.servings);
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        expect(ingredient.ingredient.title).toBeDefined();
        expect(ingredient.measurement.title).toBeDefined();
      }
    }
    expect(response.body.recipe.notes).toBe(testRecipe.notes);
    expect(response.body.recipe.author.displayName).toBe(testUser1.displayName);
    expect(response.body.recipe.author.profileImage).toBe(
      testUser1.profileImage,
    );
  });

  it("should fetch an unpublished recipe for the author", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.isPublished).toBe(false);
  });

  it("should not fetch an unpublished recipe for other users", async () => {
    const loginAgent2 = await getAuthenticatedAgent(otherUser);

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await loginAgent2.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(404);
  });

  it("should not fetch an unpublished recipe for unauthenticated users", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await request(app).get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(404);
  });

  it("should not populate linked recipes if they are unpublished or deleted", async () => {
    const unpublishedRecipe = await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const deletedRecipe = await createTestRecipe(testUser1._id, {
      title: `Deleted Recipe`,
      slug: `deleted-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: unpublishedRecipe._id,
          role: "component",
        },
        {
          recipeId: deletedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toHaveLength(0);
  });

  it("should return an error when fetching a recipe with an invalid slug", async () => {
    const response = await loginAgent1.get(`/api/v1/recipes/nonexistent-slug`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });

  it("should ignore any soft deleted linked recipes when fetching a recipe", async () => {
    const deletedRecipe = await createTestRecipe(testUser1._id, {
      title: `Deleted Recipe`,
      slug: `deleted-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: deletedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toHaveLength(0);
  });

  it("should ignore any deleted linked recipes when fetching a recipe", async () => {
    const deletedRecipe = await createTestRecipe(testUser1._id, {
      title: `Deleted Recipe`,
      slug: `deleted-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await Recipe.findByIdAndDelete(deletedRecipe._id);

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: deletedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toHaveLength(0);
  });

  it("should ignore any unpublished linked recipes when fetching a recipe", async () => {
    const unpublishedRecipe = await createTestRecipe(testUser1._id, {
      title: `Unpublished Recipe`,
      slug: `unpublished-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],

      linkedRecipes: [
        {
          recipeId: unpublishedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toHaveLength(0);
  });

  it("should ignore any deleted measurements when fetching a recipe", async () => {
    const deletedMeasurement = await Measurement.create({
      title: "to taste",
      system: "metric",
      baseUnit: "volume",
      toBaseFactor: 1,
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: testIngredient._id,
              quantity: "2",
              measurement: deletedMeasurement._id,
            },
          ],
        },
      ],
    });

    await Measurement.findByIdAndDelete(deletedMeasurement._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        expect(ingredient.ingredient.title).toBeDefined();
        expect(ingredient.measurement).toBeNull();
      }
    }
  });

  it("should ignore any deleted ingredients when fetching a recipe", async () => {
    const deletedIngredient = await Ingredient.create({
      title: "Deleted Ingredient",
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: deletedIngredient._id,
              quantity: "2",
              measurement: testMeasurement._id,
            },
          ],
        },
      ],
    });

    await Ingredient.findByIdAndDelete(deletedIngredient._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        expect(ingredient.ingredient).toBeNull();
        expect(ingredient.measurement.title).toBeDefined();
      }
    }
  });

  it("should return 'Deleted User' as author for a recipe whose author has been fully deleted", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: `deleteduser${testUserSlugIndex}`,
      displayName: `Deleted User${testUserSlugIndex++}`,
      email: `deleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
    });

    const testRecipe = await createTestRecipe(deletedUser._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: testIngredient._id,
              quantity: "2",
              measurement: testMeasurement._id,
            },
          ],
        },
      ],
    });

    await User.findByIdAndDelete(deletedUser._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.author.displayName).toBe("Deleted User");
    expect(response.body.recipe.author.profileImage).toBeNull();
    expect(response.body.recipe.author.isDeleted).toBeUndefined();
    expect(response.body.recipe.author._id).toBeUndefined();
  });

  it("should return 'Deleted User' as author for a recipe whose author has been soft deleted", async () => {
    const softDeletedUser = await createSecondaryTestUser({
      username: `softdeleteduser${testUserSlugIndex}`,
      displayName: `Soft Deleted User${testUserSlugIndex++}`,
      email: `softdeleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
      isDeleted: true,
    });

    const testRecipe = await createTestRecipe(softDeletedUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.author._id).toBe(
      softDeletedUser._id.toString(),
    );
    expect(response.body.recipe.author.displayName).toBe("Deleted User");
    expect(response.body.recipe.author.profileImage).toBeNull();
    expect(response.body.recipe.author.isDeleted).toBeUndefined();
  });

  it("should return 'Deleted User' as author for a recipe whose author has been banned", async () => {
    const bannedUser = await createSecondaryTestUser({
      username: `banneduser${testUserSlugIndex}`,
      displayName: `Banned User${testUserSlugIndex++}`,
      email: `banneduser@example.com${crypto.randomUUID()}`,
      password: "password123",
      isBanned: true,
    });

    const testRecipe = await createTestRecipe(bannedUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.author._id).toBe(bannedUser._id.toString());
    expect(response.body.recipe.author.displayName).toBe("Deleted User");
    expect(response.body.recipe.author.profileImage).toBeNull();
    expect(response.body.recipe.author.isBanned).toBeUndefined();
  });

  it("should ignore any deleted tags, seasons, or holidays when fetching a recipe", async () => {
    const deletedTag = await Tag.create({ title: "Deleted Tag" });
    const deletedSeason = await Tag.create({ title: "Deleted Season" });
    const deletedHoliday = await Tag.create({ title: "Deleted Holiday" });
    const deletedMeal = await Meal.create({ title: "Deleted Meal" });
    const deletedCuisine = await Cuisine.create({ title: "Deleted Cuisine" });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe`,
      slug: `test-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: testIngredient._id,
              quantity: "2",
              measurement: testMeasurement._id,
            },
          ],
        },
      ],
      source: {
        name: "Test Source",
        note: "Test source note",
      },
      tags: [deletedTag._id],
      meals: [deletedMeal._id],
      cuisines: [deletedCuisine._id],
      seasons: [deletedSeason._id],
      holidays: [deletedHoliday._id],
    });

    await Tag.findByIdAndDelete(deletedTag._id);
    await Tag.findByIdAndDelete(deletedSeason._id);
    await Tag.findByIdAndDelete(deletedHoliday._id);
    await Meal.findByIdAndDelete(deletedMeal._id);
    await Cuisine.findByIdAndDelete(deletedCuisine._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.source).toBeDefined();
    expect(response.body.recipe.source.name).toBe("Test Source");
    expect(response.body.recipe.source.note).toBe("Test source note");
    expect(response.body.recipe.tags).toBeDefined();
    expect(Array.isArray(response.body.recipe.tags)).toBe(true);
    expect(response.body.recipe.tags.length).toBe(0);
    expect(response.body.recipe.meals).toBeDefined();
    expect(Array.isArray(response.body.recipe.meals)).toBe(true);
    expect(response.body.recipe.meals.length).toBe(0);
    expect(response.body.recipe.cuisines).toBeDefined();
    expect(Array.isArray(response.body.recipe.cuisines)).toBe(true);
    expect(response.body.recipe.cuisines.length).toBe(0);
    expect(response.body.recipe.seasons).toBeDefined();
    expect(Array.isArray(response.body.recipe.seasons)).toBe(true);
    expect(response.body.recipe.seasons.length).toBe(0);
    expect(response.body.recipe.holidays).toBeDefined();
    expect(Array.isArray(response.body.recipe.holidays)).toBe(true);
    expect(response.body.recipe.holidays.length).toBe(0);
  });

  it("should ignore any deleted linked recipes, measurements, ingredients, authors, tags, seasons, or holidays when fetching a recipe", async () => {
    const deletedRecipe = await createTestRecipe(testUser1._id, {
      title: `Deleted Recipe`,
      slug: `deleted-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });
    const deletedMeasurement = await Measurement.create({
      title: "to taste",
      system: "metric",
      baseUnit: "volume",
      toBaseFactor: 1,
    });
    const deletedIngredient = await Ingredient.create({
      title: "Deleted Ingredient",
    });
    const deletedUser = await createSecondaryTestUser({
      username: `deleteduser${testUserSlugIndex}`,
      displayName: `Deleted User${testUserSlugIndex++}`,
      email: `deleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
    });
    const deletedTag = await Tag.create({ title: "Deleted Tag" });
    const deletedSeason = await Tag.create({ title: "Deleted Season" });
    const deletedHoliday = await Tag.create({ title: "Deleted Holiday" });
    const validTag = await Tag.create({ title: "Valid Tag" });
    const validSeason = await Tag.create({ title: "Valid Season" });
    const validHoliday = await Tag.create({ title: "Valid Holiday" });
    const deletedMeal = await Meal.create({ title: "Deleted Meal" });
    const deletedCuisine = await Cuisine.create({ title: "Deleted Cuisine" });
    const validMeal = await Meal.create({ title: "Valid Meal" });
    const validCuisine = await Cuisine.create({ title: "Valid Cuisine" });

    const linkedRecipe = await createTestRecipe(deletedUser._id, {
      title: `Linked Recipe`,
      slug: `linked-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const testRecipe = await createTestRecipe(deletedUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [
            {
              ingredient: deletedIngredient._id,
              quantity: "2",
              measurement: deletedMeasurement._id,
            },
            {
              ingredient: testIngredient._id,
              quantity: "2",
              measurement: testMeasurement._id,
            },
          ],
        },
      ],
      source: {
        name: "Test Source",
        note: "Test source note",
      },
      tags: [deletedTag._id, validTag._id],
      meals: [deletedMeal._id, validMeal._id],
      cuisines: [deletedCuisine._id, validCuisine._id],
      seasons: [deletedSeason._id, validSeason._id],
      holidays: [deletedHoliday._id, validHoliday._id],
      linkedRecipes: [
        {
          recipeId: deletedRecipe._id,
          role: "component",
        },
        {
          recipeId: linkedRecipe._id,
          role: "variation",
        },
      ],
    });

    await Recipe.findByIdAndDelete(deletedRecipe._id);
    await Measurement.findByIdAndDelete(deletedMeasurement._id);
    await Ingredient.findByIdAndDelete(deletedIngredient._id);
    await User.findByIdAndDelete(deletedUser._id);
    await Tag.findByIdAndDelete(deletedTag._id);
    await Tag.findByIdAndDelete(deletedSeason._id);
    await Tag.findByIdAndDelete(deletedHoliday._id);
    await Meal.findByIdAndDelete(deletedMeal._id);
    await Cuisine.findByIdAndDelete(deletedCuisine._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.author).toBeDefined();
    expect(response.body.recipe.author.displayName).toBe("Deleted User");
    expect(response.body.recipe.author.profileImage).toBeNull();
    expect(response.body.recipe.author._id).toBeUndefined();
    expect(response.body.recipe.author.isDeleted).toBeUndefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        if (ingredient.ingredient == null) continue;
        expect(ingredient.ingredient.title).toBeDefined();
        expect(ingredient.measurement.title).toBeDefined();
        expect(ingredient.ingredient.title).toBe("test ingredient");
        expect(ingredient.measurement.title).toBe("cup");
      }
    }
    expect(response.body.recipe.linkedRecipes).toBeDefined();
    expect(Array.isArray(response.body.recipe.linkedRecipes)).toBe(true);
    expect(response.body.recipe.linkedRecipes.length).toBe(1);
    expect(response.body.recipe.linkedRecipes[0].recipeId._id).toBe(
      String(linkedRecipe._id),
    );
    expect(response.body.recipe.linkedRecipes[0].recipeId.author).toBeDefined();
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.displayName,
    ).toBe("Deleted User");
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.profileImage,
    ).toBeNull();
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author._id,
    ).toBeUndefined();
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.isDeleted,
    ).toBeUndefined();
    expect(response.body.recipe.linkedRecipes[0].recipeId.title).toBe(
      linkedRecipe.title,
    );
    expect(response.body.recipe.source).toBeDefined();
    expect(response.body.recipe.source.name).toBe("Test Source");
    expect(response.body.recipe.source.note).toBe("Test source note");
    expect(response.body.recipe.tags).toBeDefined();
    expect(Array.isArray(response.body.recipe.tags)).toBe(true);
    for (const tag of response.body.recipe.tags) {
      expect(tag.title).toBeDefined();
      expect(tag.title).toBe("valid tag");
    }
    expect(response.body.recipe.meals).toBeDefined();
    expect(Array.isArray(response.body.recipe.meals)).toBe(true);
    for (const meal of response.body.recipe.meals) {
      expect(meal.title).toBeDefined();
      expect(meal.title).toBe("valid meal");
    }
    expect(response.body.recipe.cuisines).toBeDefined();
    expect(Array.isArray(response.body.recipe.cuisines)).toBe(true);
    for (const cuisine of response.body.recipe.cuisines) {
      expect(cuisine.title).toBeDefined();
      expect(cuisine.title).toBe("valid cuisine");
    }
    expect(response.body.recipe.seasons).toBeDefined();
    expect(Array.isArray(response.body.recipe.seasons)).toBe(true);
    for (const season of response.body.recipe.seasons) {
      expect(season.title).toBeDefined();
      expect(season.title).toBe("valid season");
    }
    expect(response.body.recipe.holidays).toBeDefined();
    expect(Array.isArray(response.body.recipe.holidays)).toBe(true);
    for (const holiday of response.body.recipe.holidays) {
      expect(holiday.title).toBeDefined();
      expect(holiday.title).toBe("valid holiday");
    }
  });

  it("should return 'Deleted User' as author for a linked recipe whose author has been soft deleted", async () => {
    const softDeletedUser = await createSecondaryTestUser({
      username: `softdeleteduser${testUserSlugIndex}`,
      displayName: `Soft Deleted User${testUserSlugIndex++}`,
      email: `softdeleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
      isDeleted: true,
    });

    const linkedRecipe = await createTestRecipe(softDeletedUser._id, {
      title: `Linked Recipe ${testRecipeSlugIndex}`,
      slug: `linked-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Linked Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: linkedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toBeDefined();
    expect(Array.isArray(response.body.recipe.linkedRecipes)).toBe(true);
    expect(response.body.recipe.linkedRecipes.length).toBe(1);
    expect(response.body.recipe.linkedRecipes[0].recipeId._id).toBe(
      String(linkedRecipe._id),
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.displayName,
    ).toBe("Deleted User");
    expect(response.body.recipe.linkedRecipes[0].recipeId.title).toBe(
      linkedRecipe.title,
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.isDeleted,
    ).not.toBeDefined();
  });

  it("should return 'Deleted User' as author for a linked recipe whose author has been fully deleted", async () => {
    const deletedUser = await createSecondaryTestUser({
      username: `deleteduser${testUserSlugIndex}`,
      displayName: `Deleted User${testUserSlugIndex++}`,
      email: `deleteduser@example.com${crypto.randomUUID()}`,
      password: "password123",
    });

    const linkedRecipe = await createTestRecipe(deletedUser._id, {
      title: `Linked Recipe ${testRecipeSlugIndex}`,
      slug: `linked-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Linked Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: linkedRecipe._id,
          role: "component",
        },
      ],
    });

    await User.findByIdAndDelete(deletedUser._id);

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toBeDefined();
    expect(Array.isArray(response.body.recipe.linkedRecipes)).toBe(true);
    expect(response.body.recipe.linkedRecipes.length).toBe(1);
    expect(response.body.recipe.linkedRecipes[0].recipeId._id).toBe(
      String(linkedRecipe._id),
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.displayName,
    ).toBe("Deleted User");
    expect(response.body.recipe.linkedRecipes[0].recipeId.title).toBe(
      linkedRecipe.title,
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.profileImage,
    ).toBeNull();
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author._id,
    ).toBeUndefined();
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.isDeleted,
    ).toBeUndefined();
  });

  it("should return 'Deleted User' as author for a linked recipe whose author has been banned", async () => {
    const bannedUser = await createSecondaryTestUser({
      username: `banneduser${testUserSlugIndex}`,
      displayName: `Banned User${testUserSlugIndex++}`,
      email: `banneduser@example.com${crypto.randomUUID()}`,
      password: "password123",
      isBanned: true,
    });

    const linkedRecipe = await createTestRecipe(bannedUser._id, {
      title: `Linked Recipe ${testRecipeSlugIndex}`,
      slug: `linked-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Linked Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      linkedRecipes: [
        {
          recipeId: linkedRecipe._id,
          role: "component",
        },
      ],
    });

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe.linkedRecipes).toBeDefined();
    expect(Array.isArray(response.body.recipe.linkedRecipes)).toBe(true);
    expect(response.body.recipe.linkedRecipes.length).toBe(1);
    expect(response.body.recipe.linkedRecipes[0].recipeId._id).toBe(
      String(linkedRecipe._id),
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.displayName,
    ).toBe("Deleted User");
    expect(response.body.recipe.linkedRecipes[0].recipeId.title).toBe(
      linkedRecipe.title,
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.profileImage,
    ).toBeNull();
    expect(response.body.recipe.linkedRecipes[0].recipeId.author._id).toBe(
      bannedUser._id.toString(),
    );
    expect(
      response.body.recipe.linkedRecipes[0].recipeId.author.isBanned,
    ).toBeUndefined();
  });
});

// Test cases: updateRecipe //
describe("PUT /api/v1/recipes/:recipeSlug", () => {
  it("should update a recipe with valid data", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "Updated Test Recipe",
      description: "This is an updated test recipe",
      image: "",
      preptimeSeconds: 400,
      cooktimeSeconds: 800,
      servings: 6,
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [
            {
              ingredient: testIngredient.title,
              quantity: "3",
              measurement: testMeasurement.title,
            },
          ],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Updated Test Steps",
          steps: ["Updated Step 1", "Updated Step 2"],
        },
      ],
      source: {
        name: "Updated Test Source",
        note: "This is an updated test source note",
      },
      tags: ["updatedtag1", "updatedtag2"],
      cuisines: ["updatedcuisine1", "updatedcuisine2"],
      meals: ["updatedmeal1", "updatedmeal2"],
      seasons: ["updatedseason1", "updatedseason2"],
      holidays: ["updatedholiday1"],
      notes: "These are updated test notes.",
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.title).toBe(updatedRecipeData.title);
    expect(response.body.recipe.slug).toBe("updated-test-recipe");
    expect(response.body.recipe.description).toBe(
      updatedRecipeData.description,
    );
    expect(response.body.recipe.image).toBe(updatedRecipeData.image);
    expect(response.body.recipe.preptimeSeconds).toBe(
      updatedRecipeData.preptimeSeconds,
    );
    expect(response.body.recipe.cooktimeSeconds).toBe(
      updatedRecipeData.cooktimeSeconds,
    );
    expect(response.body.recipe.servings).toBe(updatedRecipeData.servings);
    expect(response.body.recipe.ingredientSections).toBeDefined();
    expect(Array.isArray(response.body.recipe.ingredientSections)).toBe(true);
    for (const ingredientSection of response.body.recipe.ingredientSections) {
      expect(ingredientSection.sectionTitle).toBeDefined();
      expect(Array.isArray(ingredientSection.ingredients)).toBe(true);
      for (const ingredient of ingredientSection.ingredients) {
        expect(ingredient.ingredient.title).toBeDefined();
        expect(ingredient.measurement.title).toBeDefined();
      }
    }
    expect(response.body.recipe.notes).toBe(updatedRecipeData.notes);
    expect(response.body.recipe.author.displayName).toBe(testUser1.displayName);
    expect(response.body.recipe.author.profileImage).toBe(
      testUser1.profileImage,
    );
    expect(response.body.recipe.source).toBeDefined();
    expect(response.body.recipe.source.name).toBe(
      updatedRecipeData.source.name,
    );
    expect(response.body.recipe.source.note).toBe(
      updatedRecipeData.source.note,
    );
    expect(response.body.recipe.tags).toBeDefined();
    expect(Array.isArray(response.body.recipe.tags)).toBe(true);
    expect(response.body.recipe.tags.length).toBe(2);
    expect(response.body.recipe.tags[0].title).toBe("updatedtag1");
    expect(response.body.recipe.tags[1].title).toBe("updatedtag2");
    expect(response.body.recipe.meals).toBeDefined();
    expect(Array.isArray(response.body.recipe.meals)).toBe(true);
    expect(response.body.recipe.meals.length).toBe(2);
    expect(response.body.recipe.meals[0].title).toBe("updatedmeal1");
    expect(response.body.recipe.meals[1].title).toBe("updatedmeal2");
    expect(response.body.recipe.cuisines).toBeDefined();
    expect(Array.isArray(response.body.recipe.cuisines)).toBe(true);
    expect(response.body.recipe.cuisines.length).toBe(2);
    expect(response.body.recipe.cuisines[0].title).toBe("updatedcuisine1");
    expect(response.body.recipe.cuisines[1].title).toBe("updatedcuisine2");
    expect(response.body.recipe.seasons).toBeDefined();
    expect(Array.isArray(response.body.recipe.seasons)).toBe(true);
    expect(response.body.recipe.seasons.length).toBe(2);
    expect(response.body.recipe.seasons[0].title).toBe("updatedseason1");
    expect(response.body.recipe.seasons[1].title).toBe("updatedseason2");
    expect(response.body.recipe.holidays).toBeDefined();
    expect(Array.isArray(response.body.recipe.holidays)).toBe(true);
    expect(response.body.recipe.holidays.length).toBe(1);
    expect(response.body.recipe.holidays[0].title).toBe("updatedholiday1");
  });

  it("should return an error when updating a recipe with invalid data", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "",
      slug: "",
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should return an error when updating a recipe with a banned word in the title", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "Banned Recipe Title",
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the description", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      description: "Banned Recipe Description",
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the ingredients", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: "Banned Ingredient" }],
        },
      ],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the steps", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      stepSections: [
        {
          sectionTitle: "Updated Test Section",
          steps: ["Banned Step"],
        },
      ],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the notes", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      notes: ["Banned Note"],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the tags", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      tags: ["Banned Tag"],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the holidays", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      holidays: ["Banned Holiday"],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should return an error when updating a recipe with a banned word in the seasons", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      seasons: ["Banned Season"],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should update a recipe when updated with flagged words", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "Flagged Recipe Title",
      description: "Flagged recipe description",
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: "flagged" }],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Updated Test Section",
          steps: ["Flagged test step"],
        },
      ],
      notes: "Flagged",
      tags: ["Flagged"],
      holidays: ["Flagged"],
      seasons: ["Flagged"],
      preptimeSeconds: 10,
      cooktimeSeconds: 20,
      servings: 2,
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe updated successfully");
  });

  it("should return an error when updating a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "Updated Test Recipe",
      slug: "updated-test-recipe",
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    };

    const response = await request(app)
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error when updating a recipe that does not belong to the user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Other User Recipe`,
      slug: `other-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const updatedRecipeData = {
      title: "Updated Other User Recipe",
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: testIngredient.title }],
        },
      ],
      stepSections: [
        {
          sectionTitle: "Updated Test Steps",
          steps: ["Updated Step 1", "Updated Step 2"],
        },
      ],
      preptimeSeconds: 400,
      cooktimeSeconds: 800,
      servings: 6,
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/${testRecipe.slug}`)
      .send(updatedRecipeData);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "You do not have permission to edit this recipe",
    );
  });

  it("should return an error when updating a non-existent recipe", async () => {
    const updatedRecipeData = {
      title: "Updated Non-Existent Recipe",
      slug: "updated-non-existent-recipe",
      ingredientSections: [
        {
          sectionTitle: "Updated Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    };

    const response = await loginAgent1
      .put(`/api/v1/recipes/nonexistent-slug`)
      .send(updatedRecipeData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: publishRecipe //
describe("PATCH /api/v1/recipes/:recipeSlug/publish", () => {
  it("should publish a recipe", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await loginAgent1.patch(
      `/api/v1/recipes/${testRecipe.slug}/publish`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Recipe published successfully");
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.isPublished).toBe(true);
  });

  it("should unpublish a recipe that is already published", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.patch(
      `/api/v1/recipes/${testRecipe.slug}/publish`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Recipe unpublished successfully");
    expect(response.body.success).toBe(true);
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(response.body.recipe.isPublished).toBe(false);
  });

  it("should return an error when publishing a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isPublished: false,
    });

    const response = await request(app).patch(
      `/api/v1/recipes/${testRecipe.slug}/publish`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error when publishing a recipe that does not belong to the user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Other User Recipe`,
      slug: `other-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.patch(
      `/api/v1/recipes/${testRecipe.slug}/publish`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "You do not have permission to update this recipe",
    );
  });

  it("should return an error when publishing a non-existent recipe", async () => {
    const response = await loginAgent1.patch(
      `/api/v1/recipes/nonexistent-slug/publish`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: deleteRecipe //
describe("DELETE /api/v1/recipes/:recipeSlug", () => {
  it("should soft delete a recipe", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.delete(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe deleted successfully");

    const deletedRecipe = await Recipe.findById(testRecipe._id).select(
      "isDeleted",
    );
    expect(deletedRecipe).toBeDefined();
    expect(deletedRecipe.isDeleted).toBe(true);
  });

  it("should throw an error when deleting a recipe that does not belong to the user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Other User Recipe ${testRecipeSlugIndex}`,
      slug: `other-user-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1.delete(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "You do not have permission to delete this recipe",
    );
  });

  it("should return an error when deleting a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await request(app).delete(
      `/api/v1/recipes/${testRecipe.slug}`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error when deleting a non-existent recipe", async () => {
    const response = await loginAgent1.delete(
      `/api/v1/recipes/nonexistent-slug`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: restoreRecipe //
describe("PATCH /api/v1/recipes/:recipeSlug/restore", () => {
  it("should restore a soft-deleted recipe", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await loginAgent1.delete(`/api/v1/recipes/${testRecipe.slug}`);

    const response = await loginAgent1.patch(
      `/api/v1/recipes/${testRecipe.slug}/restore`,
    );

    const returnRecipe = await Recipe.findById(testRecipe._id).select(
      "isDeleted",
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe restored successfully");
    expect(response.body.recipe).toBeDefined();
    expect(response.body.recipe._id).toBe(testRecipe._id.toString());
    expect(returnRecipe.isDeleted).toBe(false);
  });

  it("should throw an error when restoring a recipe that does not belong to the user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Other User Recipe`,
      slug: `other-user-recipe`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      isDeleted: true,
    });

    await loginAgent1.delete(`/api/v1/recipes/${testRecipe.slug}`);

    const response = await loginAgent1.patch(
      `/api/v1/recipes/${testRecipe.slug}/restore`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "You do not have permission to restore this recipe",
    );
  });

  it("should return an error when restoring a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await loginAgent1.delete(`/api/v1/recipes/${testRecipe.slug}`);

    const response = await request(app).patch(
      `/api/v1/recipes/${testRecipe.slug}/restore`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error when restoring a non-existent recipe", async () => {
    const response = await loginAgent1.patch(
      `/api/v1/recipes/nonexistent-slug/restore`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found or not deleted");
  });
});

// Test cases: rateRecipe //
describe("POST /api/v1/recipes/:recipeSlug/rating", () => {
  it("should allow a user to rate a recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/rating`)
      .send({ rating: 4 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe rated successfully");
    expect(response.body.recipe.aggregateRating).toBe(4);
    expect(response.body.recipe.ratingCount).toBe(1);
    expect(response.body.recipe.totalRating).toBe(4);

    const rating = await Rating.findOne({
      authorId: testUser1._id,
      recipeId: testRecipe._id,
    });

    expect(rating).toBeDefined();
    expect(rating.rating).toBe(4);
  });

  it("should correctly update aggregate rating on a recipe that has already been rated", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 23,
      aggregateRating: 4.5,
      totalRating: 103.5,
    });

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/rating`)
      .send({ rating: 2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe rated successfully");
    expect(response.body.recipe.aggregateRating).toBeCloseTo(4.395, 2);
    expect(response.body.recipe.ratingCount).toBe(24);
    expect(response.body.recipe.totalRating).toBe(105.5);
  });

  it("should update an existing rating if the user has already rated the recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 1,
      aggregateRating: 4,
      totalRating: 4,
    });

    await createTestRating(testRecipe._id, testUser1._id, { rating: 4 });

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/rating`)
      .send({ rating: 5 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recipe rated successfully");
    expect(response.body.recipe.aggregateRating).toBe(5);
    expect(response.body.recipe.ratingCount).toBe(1);
    expect(response.body.recipe.totalRating).toBe(5);

    const rating = await Rating.findOne({
      authorId: testUser1._id,
      recipeId: testRecipe._id,
    });

    expect(rating).toBeDefined();
    expect(rating.rating).toBe(5);
  });

  it("should throw an error if a user tries to rate their own recipe", async () => {
    const testRecipe = await createTestRecipe(testUser1._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/rating`)
      .send({ rating: 5 });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("You cannot rate your own recipe");
  });

  it("should return an error when rating a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const response = await request(app)
      .post(`/api/v1/recipes/${testRecipe.slug}/rating`)
      .send({ rating: 5 });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error when rating a non-existent recipe", async () => {
    const response = await loginAgent1
      .post(`/api/v1/recipes/nonexistent-slug/rating`)
      .send({ rating: 5 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: removeRatingFromRecipe //
describe("DELETE /api/v1/recipes/:recipeSlug/rating", () => {
  it("should allow a user to remove their rating from a recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 1,
      aggregateRating: 4,
      totalRating: 4,
    });

    await createTestRating(testRecipe._id, testUser1._id, { rating: 4 });

    const response = await loginAgent1.delete(
      `/api/v1/recipes/${testRecipe.slug}/rating`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Rating removed successfully");
    expect(response.body.recipe.aggregateRating).toBe(0);
    expect(response.body.recipe.ratingCount).toBe(0);
    expect(response.body.recipe.totalRating).toBe(0);

    const rating = await Rating.findOne({
      authorId: testUser1._id,
      recipeId: testRecipe._id,
    });

    expect(rating).toBeNull();
  });

  it("should update the recipe's aggregate rating correctly when a rating is removed", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 2,
      aggregateRating: 3,
      totalRating: 6,
    });

    await createTestRating(testRecipe._id, testUser1._id, { rating: 4 });
    await createTestRating(testRecipe._id, otherUser._id, { rating: 2 });

    const response = await loginAgent1.delete(
      `/api/v1/recipes/${testRecipe.slug}/rating`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Rating removed successfully");
    expect(response.body.recipe.aggregateRating).toBe(2);
    expect(response.body.recipe.ratingCount).toBe(1);
    expect(response.body.recipe.totalRating).toBe(2);
  });

  it("should throw an error if a user tries to remove a rating that does not exist", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 0,
      aggregateRating: 0,
      totalRating: 0,
    });

    const response = await loginAgent1.delete(
      `/api/v1/recipes/${testRecipe.slug}/rating`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("You have not rated this recipe");
  });

  it("should return an error when removing a rating from a recipe as an unauthenticated user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
      ratingCount: 1,
      aggregateRating: 4,
      totalRating: 4,
    });

    const response = await request(app).delete(
      `/api/v1/recipes/${testRecipe.slug}/rating`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error when removing a rating from a non-existent recipe", async () => {
    const response = await loginAgent1.delete(
      `/api/v1/recipes/nonexistent-slug/rating`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: getRecipeCommentsById //
describe("GET /api/v1/recipes/:recipeSlug/comments", () => {
  it("should fetch comments for a recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    await createTestComment(testRecipe._id, testUser1._id, null, {
      content: "This is a test comment",
    });

    const response = await request(app).get(
      `/api/v1/recipes/${testRecipe.slug}/comments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.comments).toBeDefined();
    expect(Array.isArray(response.body.comments.comments)).toBe(true);
  });

  it("should fetch comments with comment votes for the authenticated user", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      {
        content: "This is a test comment for voting",
      },
    );

    await createTestCommentVote(testUser1._id, comment._id, "upvote");

    const response = await loginAgent1.get(
      `/api/v1/recipes/${testRecipe.slug}/comments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.comments).toBeDefined();
    expect(Array.isArray(response.body.comments.comments)).toBe(true);
    const fetchedComment = response.body.comments.comments.find(
      (c) => c._id === comment._id.toString(),
    );
    expect(fetchedComment).toBeDefined();
    expect(fetchedComment.userVote).toBe("upvote");
  });

  it("should fetch comments without user votes for unauthenticated users while still showing the overall vote", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const comment = await createTestComment(
      testUser1._id,
      testRecipe._id,
      null,
      {
        content: "This is a test comment for unauthenticated users",
      },
    );

    await createTestCommentVote(testUser1._id, comment._id, "upvote");

    const response = await request(app).get(
      `/api/v1/recipes/${testRecipe.slug}/comments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.comments).toBeDefined();
    expect(Array.isArray(response.body.comments.comments)).toBe(true);
    const fetchedComment = response.body.comments.comments.find(
      (c) => c._id === comment._id.toString(),
    );
    expect(fetchedComment).toBeDefined();
    expect(fetchedComment.userVote).toBeUndefined();
  });

  it("should return an error when fetching comments for a non-existent recipe", async () => {
    const response = await request(app).get(
      `/api/v1/recipes/nonexistent-slug/comments`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});

// Test cases: createCommentByRecipeId //
describe("POST /api/v1/recipes/:recipeSlug/comments", () => {
  it("should allow an authenticated user to create a comment on a recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentData = {
      content: "This is a test comment",
    };

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/comments`)
      .send(commentData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Comment created successfully");
    expect(response.body.comment).toBeDefined();
    expect(response.body.comment.content).toBe(commentData.content);
    expect(response.body.comment.authorId.displayName).toBe(
      testUser1.displayName,
    );
    expect(response.body.comment.authorId.profileImage).toBe(
      testUser1.profileImage,
    );
  });

  it("should throw an error when creating a comment with content that is too short", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentData = {
      content: "",
    };

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/comments`)
      .send(commentData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Comment must be between 1 and 500 characters",
    );
  });

  it("should throw an error when creating a comment with a banned word", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentData = {
      content: "banned word",
    };

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/comments`)
      .send(commentData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Content contains banned word: banned`);
  });

  it("should allow a user to make a comment with a flagged word", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentData = {
      content: "flagged word",
    };

    const response = await loginAgent1
      .post(`/api/v1/recipes/${testRecipe.slug}/comments`)
      .send(commentData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Comment created successfully");
  });

  it("should not allow an unauthenticated user to create a comment on a recipe", async () => {
    const testRecipe = await createTestRecipe(otherUser._id, {
      title: `Test Recipe ${testRecipeSlugIndex}`,
      slug: `test-recipe-${testRecipeSlugIndex++}`,
      ingredientSections: [
        {
          sectionTitle: "Test Section",
          ingredients: [{ ingredient: testIngredient._id }],
        },
      ],
    });

    const commentData = {
      content: "This is a test comment",
    };

    const response = await request(app)
      .post(`/api/v1/recipes/${testRecipe.slug}/comments`)
      .send(commentData);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should return an error when creating a comment on a non-existent recipe", async () => {
    const commentData = {
      content: "This is a test comment for a non-existent recipe",
    };

    const response = await loginAgent1
      .post("/api/v1/recipes/nonexistent-slug/comments")
      .send(commentData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Recipe not found");
  });
});
