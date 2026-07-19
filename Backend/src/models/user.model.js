import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 32,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
    },
    displayName: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 32,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 128,
      select: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    profileBackgroundImage: {
      type: String,
      default: "",
    },
    favoriteRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
        index: true,
      },
    ],
    favoriteCuisines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cuisine",
      },
    ],
    allergies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
      },
    ],
    shoppingList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
      },
    ],
    preferences: {
      measurementSystem: {
        type: String,
        enum: ["metric", "imperial"],
        default: "imperial",
      },
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
      select: false,
    },
    previousDisplayName: {
      type: String,
      default: null,
      select: false,
    },
    lastDisplayNameChange: {
      type: Date,
      default: null,
      select: false,
    },
    previousEmail: {
      type: String,
      default: null,
      select: false,
    },
    lastEmailChange: {
      type: Date,
      default: null,
      select: false,
    },
    emailChangeCount: {
      type: Number,
      default: 0,
      select: false,
    },
    lastPasswordChange: {
      type: Date,
      default: null,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastFailedLogin: {
      type: Date,
      default: null,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
