import mongoose from "mongoose";

// Create a seperate schema for source to allow for source to be null while still requiring a name if source is not null
const sourceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      maxlength: 2048,
      trim: true,
    },
    name: {
      type: String,
      maxlength: 50,
      trim: true,
      required: true,
    },
    note: {
      type: String,
      maxlength: 100,
      trim: true,
    },
  },
  { _id: false },
);

const recipeSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    ingredientSections: {
      type: [
        {
          sectionTitle: {
            type: String,
            maxlength: 100,
            trim: true,
          },
          ingredients: {
            type: [
              {
                quantity: {
                  type: Number,
                  min: 0,
                  max: 99,
                },
                measurement: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Measurement",
                },
                ingredient: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Ingredient",
                  required: true,
                },
                additionalInfo: {
                  type: String,
                  maxlength: 100,
                  trim: true,
                },
              },
            ],
            required: true,
            _id: false,
            validate: {
              validator: (v) =>
                Array.isArray(v) && v.length > 0 && v.length <= 50,
            },
          },
        },
      ],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 5,
      },
    },
    stepSections: {
      type: [
        {
          sectionTitle: {
            type: String,
            maxlength: 100,
            trim: true,
          },
          steps: {
            type: [
              {
                type: String,
                trim: true,
                minlength: 3,
                maxlength: 500,
                required: true,
              },
            ],
            required: true,
            validate: {
              validator: (v) =>
                Array.isArray(v) && v.length > 0 && v.length <= 50,
            },
          },
        },
      ],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 5,
      },
    },
    preptimeSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 86400,
    },
    cooktimeSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 86400,
    },
    servings: {
      type: Number,
      required: true,
      min: 0,
      max: 99,
    },
    image: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    linkedRecipes: {
      type: [
        {
          recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recipe",
            required: true,
          },
          role: {
            type: String,
            enum: ["component", "pairing", "variation"],
            required: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length <= 3,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: {
      type: sourceSchema,
      default: null,
    },
    tags: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
      validate: (v) => Array.isArray(v) && v.length <= 10,
    },
    cuisines: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cuisine" }],
      validate: (v) => Array.isArray(v) && v.length <= 3,
    },
    meals: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Meal" }],
      validate: (v) => Array.isArray(v) && v.length <= 3,
    },
    holidays: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Holiday" }],
      validate: (v) => Array.isArray(v) && v.length <= 3,
    },
    seasons: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Season" }],
      validate: (v) => Array.isArray(v) && v.length <= 3,
    },
    aggregateRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0, select: false },
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, default: null, select: false },
    isPublished: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// Ensure a user can only have one recipe with the same title
recipeSchema.index({ author: 1, title: 1, isDeleted: false }, { unique: true });

// Provide easy qurying for recipes by a given author
recipeSchema.index({ author: 1 });

// Provide easy querying for recipes that are published
recipeSchema.index({ isPublished: 1 });

// Do not send unnecessary fields by default when creating a recipe
recipeSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.isDeleted;
    delete ret.deletedAt;
    return ret;
  },
});

const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);

export default Recipe;
