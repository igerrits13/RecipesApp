import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
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

const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);

export default Tag;
