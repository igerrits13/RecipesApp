import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema({
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
  // For rule-based holidays
  month: Number,
  weekday: Number,
  week: Number,
  duration: Number,
});

const Holiday =
  mongoose.models.Holiday || mongoose.model("Holiday", holidaySchema);

export default Holiday;
