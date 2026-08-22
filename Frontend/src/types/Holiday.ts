// Valid holiday types
export type HolidayType = "fixed" | "rule-based";

// Interface for holiday
export interface Holiday {
  _id: string;
  title: string;
  type: HolidayType;
  startDate: Date;
  endDate: Date;
  month?: number;
  weekday?: number;
  week?: number;
  duration?: number;
}
