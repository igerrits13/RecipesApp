import type { Ingredient } from "./Ingredient";
import type { Measurement } from "./Measurement";
import type { Tag } from "./Tag";
import type { Cuisine } from "./Cuisine";
import type { Meal } from "./Meal";
import type { Holiday } from "./Holiday";
import type { Season } from "./Season";

// Interface for recipe
export interface Recipe {
  _id: string;
  title: string;
  slug: string;
  description: string;
  ingredientSections: IngredientSection[];
  stepSections: StepSection[];
  preptimeSeconds: number;
  cooktimeSeconds: number;
  servings: number;
  image: string;
  notes: string;
  linkedRecipes: {
    _id: string;
    recipeId: LinkedRecipe;
    role: "component" | "pairing" | "variation";
  }[];
  author: Author;
  source?: {
    url?: string;
    name?: string;
    note?: string;
  } | null;
  tags: Tag[];
  cuisines: Cuisine[];
  meals: Meal[];
  holidays: Holiday[];
  seasons: Season[];
  aggregateRating: number;
  ratingCount: number;
  totalRating: number;
  reportCount: number;
  isDeleted: boolean;
  deletedAt: Date;
  isPublished: boolean;
  isApproved: boolean;
}

// Interface for creating a recipe
export interface CreateRecipeData {
  title: string;
  description: string;
  ingredientSections: CreateIngredientSectionData[];
  stepSections: CreateStepSectionData[];
  preptime: { hours: number; minutes: number };
  cooktime: { hours: number; minutes: number };
  servings: number;
  image: File | null;
  notes: string;
  linkedRecipes: {
    recipeId: string;
    role: "component" | "pairing" | "variation";
  }[];
  source?: {
    url?: string;
    name: string;
    note?: string;
  } | null;
  tags: string[];
  cuisines: string[];
  meals: string[];
  holidays: string[];
  seasons: string[];
  isPublished: boolean;
}

// Interface for ingredient section
export interface IngredientSection {
  _id: string;
  sectionTitle: string;
  ingredients: {
    quantity?: string | null;
    measurement?: Measurement | null;
    ingredient: Ingredient;
    additionalInfo?: string | null;
  }[];
}

// Interface for creating an ingredient section
export interface CreateIngredientSectionData {
  sectionTitle: string;
  ingredients: {
    quantity?: string | null;
    measurement?: string | null;
    ingredient: string;
    additionalInfo?: string | null;
  }[];
}

// Interface for step section
export interface StepSection {
  _id: string;
  sectionTitle: string;
  steps: string[];
}

// Interface for creating a step section
export interface CreateStepSectionData {
  sectionTitle: string;
  steps: string[];
}

// Interface for a linked recipe
export interface LinkedRecipe {
  _id: string;
  title: string;
  slug: string;
  description: string;
  preptimeSeconds: number;
  cooktimeSeconds: number;
  image: string;
  author: Author;
  aggregateRating: number;
  ratingCount: number;
  isDeleted: boolean;
  isPublished: boolean;
  isApproved: boolean;
}

// Interface for a recipe author
export interface Author {
  _id: string;
  displayName: string;
  profileImage: string;
}
