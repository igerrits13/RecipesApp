import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

// Ensure a user can rate a recipe only once
ratingSchema.index({ recipeId: 1, authorId: 1 }, { unique: true });

const Rating = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);

export default Rating;
