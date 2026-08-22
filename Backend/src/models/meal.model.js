import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  title: {
    type: String,
    minLength: 2,
    maxlength: 50,
    lowercase: true,
    trim: true,
    required: true,
    unique: true,
  },
});

const Meal = mongoose.models.Meal || mongoose.model("Meal", mealSchema);

export default Meal;
