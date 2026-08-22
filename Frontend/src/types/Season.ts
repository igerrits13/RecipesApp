// Valid season types
export type SeasonType = "fixed" | "rule-based";

// Interface for season
export interface Season {
  _id: string;
  title: string;
  type: SeasonType;
  startDate: Date;
  endDate: Date;
  month?: number;
  weekday?: number;
  week?: number;
  duration?: number;
}
