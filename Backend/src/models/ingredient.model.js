import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: 2,
    maxlength: 100,
    lowercase: true,
    trim: true,
    required: true,
    unique: true,
  },
  // Whether or not to show this item in index searches
  indexItem: {
    type: Boolean,
    default: true,
  },
});

const Ingredient =
  mongoose.models.Ingredient || mongoose.model("Ingredient", ingredientSchema);

export default Ingredient;
