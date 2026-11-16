import axios from "axios";
import { create } from "zustand";
import type { Recipe } from "../types/Recipe";

// Types for creating recipes
interface RecipeState {
  recipe: Recipe | null;
  isSaving: boolean;
  isLoading: boolean;
  isRatingLoading: boolean;
  getRecipeError: string | null;
  createRecipeError: string | null;
  rateRecipeError: string | null;
}

// Types of recipe actions
interface RecipeActions {
  getRecipe: (recipeSlug: string) => Promise<void>;
  createRecipe: (formData: FormData) => Promise<void>;
  rateRecipe: (recipeSlug: string | undefined, rating: number) => Promise<void>;
  removeRatingFromRecipe: (recipeSlug: string | undefined) => Promise<void>;
  clearCreateRecipeError: () => void;
  clearRateRecipeError: () => void;
}

// Combine recipe state and actions
type RecipeStore = RecipeState & RecipeActions;

// Define the initial state
const initialRecipeState: RecipeState = {
  recipe: null,
  isSaving: false,
  isLoading: false,
  isRatingLoading: false,
  getRecipeError: null,
  createRecipeError: null,
  rateRecipeError: null,
};

// Create the recipe store
export const useRecipeStore = create<RecipeStore>((set) => ({
  // Initial state
  ...initialRecipeState,

  // Get an existing recipe
  getRecipe: async (recipeSlug) => {
    set({ getRecipeError: null, isLoading: true, recipe: null });
    try {
      const response = await axios.get(`/api/v1/recipes/${recipeSlug}`);
      set({
        recipe: response.data.recipe,
        isLoading: false,
        getRecipeError: null,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          getRecipeError:
            error.response?.data?.message || "Failed to get recipe",
          isLoading: false,
          recipe: null,
        });
      } else {
        set({
          getRecipeError: "Unable to get recipe. Please try again",
          isLoading: false,
          recipe: null,
        });
      }
      throw error;
    }
  },

  // Create a new recipe
  createRecipe: async (formData) => {
    set({ createRecipeError: null, isSaving: true, recipe: null });
    try {
      const response = await axios.post("/api/v1/recipes", formData);
      set({
        recipe: response.data.recipe,
        createRecipeError: null,
        isSaving: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          createRecipeError:
            error.response?.data?.message || "Failed to create recipe",
          isSaving: false,
          recipe: null,
        });
      } else {
        set({
          createRecipeError: "Unable to create recipe. Please try again",
          isSaving: false,
          recipe: null,
        });
      }
      throw error;
    }
  },

  // Rate a recipe
  rateRecipe: async (recipeSlug, rating) => {
    set({ rateRecipeError: null, isRatingLoading: true });
    try {
      await axios.post(`/api/v1/recipes/${recipeSlug}/rating`, { rating });
      set({
        rateRecipeError: null,
        isRatingLoading: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          rateRecipeError:
            error.response?.data?.message || "Failed to rate recipe",
          isRatingLoading: false,
        });
      } else {
        set({
          rateRecipeError: "Unable to rate recipe. Please try again",
          isRatingLoading: false,
        });
      }
      throw error;
    }
  },

  // Remove a rating from a recipe
  removeRatingFromRecipe: async (recipeSlug) => {
    set({ rateRecipeError: null, isRatingLoading: true });
    try {
      await axios.delete(`/api/v1/recipes/${recipeSlug}/rating`);
      set({
        rateRecipeError: null,
        isRatingLoading: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          rateRecipeError:
            error.response?.data?.message || "Failed to remove rating",
          isRatingLoading: false,
        });
      } else {
        set({
          rateRecipeError: "Unable to remove rating. Please try again",
          isRatingLoading: false,
        });
      }
      throw error;
    }
  },

  // Clear the create recipe error
  clearCreateRecipeError: () => set({ createRecipeError: null }),

  // Clear the rate recipe error
  clearRateRecipeError: () => set({ rateRecipeError: null }),
}));
