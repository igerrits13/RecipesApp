import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: [
      // Volume units (us customary)
      "teaspoon",
      "tablespoon",
      "fluid ounce",
      "cup",
      "pint",
      "quart",
      "gallon",
      // Dry weight units (us customary)
      "ounce",
      "pound",
      // Volume and mass units (metric)
      "milliliter",
      "liter",
      "gram",
      "kilogram",
      // Common non-standard units
      "a pinch",
      "a dash",
      "a handful",
      "shot",
      "clove",
      "slice",
      "piece",
      "can",
      "stick",
      "bunch",
      "sprig",
      "to taste",
    ],
    required: true,
    unique: true,
  },
  system: {
    type: String,
    enum: ["us customary", "metric", "non-standard"],
    required: true,
  },
  baseUnit: {
    type: String,
    enum: ["volume", "weight"],
    required: true,
  },
  toBaseFactor: {
    type: Number,
    min: 0,
    required: true,
  },
});

const Measurement =
  mongoose.models.Measurement ||
  mongoose.model("Measurement", measurementSchema);

export default Measurement;

// Common Key Conversions
// 1 tsp = ~5 mL (4.93 mL)
// 1 tbsp = ~15 mL (14.79 mL)
// 1 fl oz = ~30 mL (29.57 mL)
// 1 cup = ~237 mL (or 240 mL for legal labeling)
// 1 pint = ~473 mL
// 1 quart = ~946 mL
// 1 gallon = ~3.79 liters
// Exploratorium
// Exploratorium
//  +3
// Imperial/British Volume (Different from US)
// 1 Imperial cup = 10 imperial fl oz (different from 8 US fl oz)
// 1 Imperial pint = 20 imperial fl oz (~568 mL)
// 1 Imperial quart = 40 imperial fl oz (~1.14 L)
// 1 Imperial gallon = 160 imperial fl oz (~4.55 L)
// www.adagioblog.com
// www.adagioblog.com
//  +2
// Other Measurements
// 1 dash = <1/4 teaspoon = ~6 drops
// 1 dash/pinch = 1/8 teaspoon (approximate)
// 1 fifth = 757 mL
