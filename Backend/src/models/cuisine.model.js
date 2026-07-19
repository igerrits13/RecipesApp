import mongoose from "mongoose";

const cuisineSchema = new mongoose.Schema({
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

const Cuisine =
  mongoose.models.Cuisine || mongoose.model("Cuisine", cuisineSchema);

export default Cuisine;
