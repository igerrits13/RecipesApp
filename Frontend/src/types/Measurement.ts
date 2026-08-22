// Valid measurement titles
export type MeasurementTitle =
  // Volume units (US customary)
  | "teaspoon"
  | "tablespoon"
  | "fluid ounce"
  | "cup"
  | "pint"
  | "quart"
  | "gallon"
  // Dry weight units (US customary)
  | "ounce"
  | "pound"
  // Volume and mass units (metric)
  | "milliliter"
  | "liter"
  | "gram"
  | "kilogram"
  // Common non-standard units
  | "a pinch"
  | "a dash"
  | "a handful"
  | "shot"
  | "clove"
  | "slice"
  | "piece"
  | "can"
  | "stick"
  | "bunch"
  | "sprig"
  | "to taste";

// Valid measurement systems
export type MeasurementSystem = "us customary" | "metric" | "non-standard";

// Valid measurement base units
export type MeasurementBaseUnit = "volume" | "weight";

// Interface for measurement
export interface Measurement {
  _id: string;
  title: string;
  system: string;
  baseUnit: string;
  toBaseFactor: number;
}
