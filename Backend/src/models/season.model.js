import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: 2,
    maxlength: 50,
    lowercase: true,
    trim: true,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["fixed", "rule-based"],
  },
  startDate: Date,
  endDate: Date,
  // For rule-based seasons
  month: Number,
  weekday: Number,
  week: Number,
  duration: Number,
});

const Season = mongoose.models.Season || mongoose.model("Season", seasonSchema);

export default Season;
