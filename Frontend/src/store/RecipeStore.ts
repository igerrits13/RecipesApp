import axios from "axios";
import { create } from "zustand";
import type { Recipe } from "../types/Recipe";

// Types for creating recipes
interface RecipeState {
  recipe: Recipe | null;
  isSavingRecipe: boolean;
  isLoadingRecipe: boolean;
  isLoadingRating: boolean;
  isLoadingNote: boolean;
  getRecipeError: string | null;
  createRecipeError: string | null;
  rateRecipeError: string | null;
  noteError: string | null;
}

// Types of recipe actions
interface RecipeActions {
  getRecipe: (recipeSlug: string) => Promise<void>;
  createRecipe: (formData: FormData) => Promise<void>;
  rateRecipe: (recipeSlug: string, rating: number) => Promise<void>;
  removeRatingFromRecipe: (recipeSlug: string) => Promise<void>;
  createNote: (recipeId: string, content: string) => Promise<void>;
  updateNote: (content: string, noteId?: string) => Promise<void>;
  deleteNote: (noteId?: string) => Promise<void>;
  clearCreateRecipeError: () => void;
  clearRateRecipeError: () => void;
}

// Combine recipe state and actions
type RecipeStore = RecipeState & RecipeActions;

// Define the initial state
const initialRecipeState: RecipeState = {
  recipe: null,
  isSavingRecipe: false,
  isLoadingRecipe: false,
  isLoadingRating: false,
  isLoadingNote: false,
  getRecipeError: null,
  createRecipeError: null,
  rateRecipeError: null,
  noteError: null,
};

// Create the recipe store
export const useRecipeStore = create<RecipeStore>((set) => ({
  // Initial state
  ...initialRecipeState,

  // Get an existing recipe
  getRecipe: async (recipeSlug) => {
    set({ getRecipeError: null, isLoadingRecipe: true, recipe: null });
    try {
      const response = await axios.get(`/api/v1/recipes/${recipeSlug}`);
      set({
        recipe: response.data.recipe,
        isLoadingRecipe: false,
        getRecipeError: null,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          getRecipeError:
            error.response?.data?.message || "Failed to get recipe",
          isLoadingRecipe: false,
          recipe: null,
        });
      } else {
        set({
          getRecipeError: "Unable to get recipe. Please try again",
          isLoadingRecipe: false,
          recipe: null,
        });
      }
      throw error;
    }
  },

  // Create a new recipe
  createRecipe: async (formData) => {
    set({ createRecipeError: null, isSavingRecipe: true, recipe: null });
    try {
      const response = await axios.post("/api/v1/recipes", formData);
      set({
        recipe: response.data.recipe,
        createRecipeError: null,
        isSavingRecipe: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          createRecipeError:
            error.response?.data?.message || "Failed to create recipe",
          isSavingRecipe: false,
          recipe: null,
        });
      } else {
        set({
          createRecipeError: "Unable to create recipe. Please try again",
          isSavingRecipe: false,
          recipe: null,
        });
      }
      throw error;
    }
  },

  // Rate a recipe
  rateRecipe: async (recipeSlug, rating) => {
    set({ rateRecipeError: null, isLoadingRating: true });
    try {
      await axios.post(`/api/v1/recipes/${recipeSlug}/rating`, { rating });
      set({
        rateRecipeError: null,
        isLoadingRating: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          rateRecipeError:
            error.response?.data?.message || "Failed to rate recipe",
          isLoadingRating: false,
        });
      } else {
        set({
          rateRecipeError: "Unable to rate recipe. Please try again",
          isLoadingRating: false,
        });
      }
      throw error;
    }
  },

  // Remove a rating from a recipe
  removeRatingFromRecipe: async (recipeSlug) => {
    set({ rateRecipeError: null, isLoadingRating: true });
    try {
      await axios.delete(`/api/v1/recipes/${recipeSlug}/rating`);
      set({
        rateRecipeError: null,
        isLoadingRating: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          rateRecipeError:
            error.response?.data?.message || "Failed to remove rating",
          isLoadingRating: false,
        });
      } else {
        set({
          rateRecipeError: "Unable to remove rating. Please try again",
          isLoadingRating: false,
        });
      }
      throw error;
    }
  },

  // Create a new user note for a recipe
  createNote: async (recipeId, content) => {
    set({ noteError: null, isLoadingNote: true });
    try {
      const response = await axios.post(`/api/v1/notes/recipe/${recipeId}`, {
        content,
      });
      set((state) => ({
        recipe: state.recipe
          ? { ...state.recipe, userNote: response.data.note }
          : null,
        noteError: null,
        isLoadingNote: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          noteError: error.response?.data?.message || "Failed to create note",
          isLoadingNote: false,
        });
      } else {
        set({
          noteError: "Unable to create note. Please try again",
          isLoadingNote: false,
        });
      }
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (content, noteId) => {
    set({ noteError: null, isLoadingNote: true });
    try {
      const response = await axios.put(`/api/v1/notes/${noteId}`, { content });
      set((state) => ({
        recipe: state.recipe
          ? { ...state.recipe, userNote: response.data.note }
          : null,
        noteError: null,
        isLoadingNote: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          noteError: error.response?.data?.message || "Failed to update note",
          isLoadingNote: false,
        });
      } else {
        set({
          noteError: "Unable to update note. Please try again",
          isLoadingNote: false,
        });
      }
      throw error;
    }
  },

  // Delete an existing note
  deleteNote: async (noteId) => {
    set({ noteError: null, isLoadingNote: true });
    try {
      await axios.delete(`/api/v1/notes/${noteId}`);
      set((state) => ({
        recipe: state.recipe ? { ...state.recipe, userNote: undefined } : null,
        noteError: null,
        isLoadingNote: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          noteError: error.response?.data?.message || "Failed to delete note",
          isLoadingNote: false,
        });
      } else {
        set({
          noteError: "Unable to delete note. Please try again",
          isLoadingNote: false,
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
