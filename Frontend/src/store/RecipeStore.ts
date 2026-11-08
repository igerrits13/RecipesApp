import axios from "axios";
import { create } from "zustand";
import type { Recipe } from "../types/Recipe";

// Types for creating recipes
interface RecipeState {
  recipe: Recipe | null;
  isSaving: boolean;
  createRecipeError: string | null;
}

// Types of recipe actions
interface RecipeActions {
  createRecipe: (formData: FormData) => Promise<void>;
  clearCreateRecipeError: () => void;
}

// Combine recipe state and actions
type RecipeStore = RecipeState & RecipeActions;

// Define the initial state
const initialRecipeState: RecipeState = {
  recipe: null,
  isSaving: false,
  createRecipeError: null,
};

// Create the recipe store
export const useRecipeStore = create<RecipeStore>((set) => ({
  // Initial state
  ...initialRecipeState,

  // Create a new recipe
  createRecipe: async (formData) => {
    set({ createRecipeError: null, isSaving: true });
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
        });
        throw error;
      } else {
        set({
          createRecipeError: "Unable to create recipe. Please try again",
          isSaving: false,
        });
        throw error;
      }
    }
  },

  // Clear the create recipe error
  clearCreateRecipeError: () => set({ createRecipeError: null }),
}));
