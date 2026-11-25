import axios from "axios";
import { create } from "zustand";
import type { Recipe } from "../types/Recipe";
import type { CreateCommentData } from "../types/Comment";

// Types for creating recipes
interface RecipeState {
  recipe: Recipe | null;
  isSavingRecipe: boolean;
  isLoadingRecipe: boolean;
  isLoadingRating: boolean;
  isLoadingNote: boolean;
  isLoadingFavorite: boolean;
  isLoadingComments: boolean;
  isSavingComment: boolean;
  getRecipeError: string | null;
  createRecipeError: string | null;
  rateRecipeError: string | null;
  noteError: string | null;
  favoriteRecipeError: string | null;
  commentsError: string | null;
  createCommentError: string | null;
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
  addFavoriteRecipe: (recipeId: string) => Promise<void>;
  removeFavoriteRecipe: (recipeId: string) => Promise<void>;
  getRecipeComments: (recipeSlug: string, page?: number) => Promise<void>;
  createComment: (
    recipeSlug: string,
    comment: CreateCommentData,
  ) => Promise<void>;
  createReplyComment: (
    recipeSlug: string,
    comment: CreateCommentData,
  ) => Promise<void>;
  clearGetRecipeError: () => void;
  clearCreateRecipeError: () => void;
  clearRateRecipeError: () => void;
  clearNoteError: () => void;
  clearFavoriteRecipeError: () => void;
  clearCommentsError: () => void;
  clearCreateCommentError: () => void;
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
  isLoadingFavorite: false,
  isLoadingComments: false,
  isSavingComment: false,
  getRecipeError: null,
  createRecipeError: null,
  rateRecipeError: null,
  noteError: null,
  favoriteRecipeError: null,
  commentsError: null,
  createCommentError: null,
};

// Create the recipe store
export const useRecipeStore = create<RecipeStore>((set, get) => ({
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
      const response = await axios.post(
        `/api/v1/recipes/${recipeSlug}/rating`,
        { rating },
      );
      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              aggregateRating: response.data.aggregateRating,
              ratingCount: response.data.ratingCount,
              userInteractions: {
                ...state.recipe.userInteractions,
                userRating: response.data.userRating,
              },
            }
          : null,
        rateRecipeError: null,
        isLoadingRating: false,
      }));
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
      const response = await axios.delete(
        `/api/v1/recipes/${recipeSlug}/rating`,
      );
      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              aggregateRating: response.data.aggregateRating,
              ratingCount: response.data.ratingCount,
              userInteractions: {
                ...state.recipe.userInteractions,
                userRating: null,
              },
            }
          : null,
        rateRecipeError: null,
        isLoadingRating: false,
      }));
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
          ? {
              ...state.recipe,
              userInteractions: {
                ...state.recipe.userInteractions,
                userNote: response.data.note,
              },
            }
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
          ? {
              ...state.recipe,
              userInteractions: {
                ...state.recipe.userInteractions,
                userNote: response.data.note,
              },
            }
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
        recipe: state.recipe
          ? {
              ...state.recipe,
              userInteractions: {
                ...state.recipe.userInteractions,
                userNote: null,
              },
            }
          : null,
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

  // Add the recipe to the current user's favorites
  addFavoriteRecipe: async (recipeId) => {
    set({ favoriteRecipeError: null, isLoadingFavorite: true });
    try {
      await axios.post(`/api/v1/users/me/favorites/${recipeId}`);
      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              userInteractions: {
                ...state.recipe.userInteractions,
                isFavorited: true,
              },
            }
          : null,
        favoriteRecipeError: null,
        isLoadingFavorite: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          favoriteRecipeError:
            error.response?.data?.message || "Failed to favorite recipe",
          isLoadingFavorite: false,
        });
      } else {
        set({
          favoriteRecipeError: "Unable to favorite recipe. Please try again",
          isLoadingFavorite: false,
        });
      }
      throw error;
    }
  },

  // Remove the recipe from the current user's favorites
  removeFavoriteRecipe: async (recipeId) => {
    set({ favoriteRecipeError: null, isLoadingFavorite: true });
    try {
      await axios.delete(`/api/v1/users/me/favorites/${recipeId}`);
      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              userInteractions: {
                ...state.recipe.userInteractions,
                isFavorited: false,
              },
            }
          : null,
        favoriteRecipeError: null,
        isLoadingFavorite: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          favoriteRecipeError:
            error.response?.data?.message || "Failed to unfavorite recipe",
          isLoadingFavorite: false,
        });
      } else {
        set({
          favoriteRecipeError: "Unable to unfavorite recipe. Please try again",
          isLoadingFavorite: false,
        });
      }
      throw error;
    }
  },

  // Get all comments for a recipe
  getRecipeComments: async (recipeSlug, page = 1) => {
    set({ commentsError: null, isLoadingComments: true });
    try {
      const response = await axios.get(
        `/api/v1/recipes/${recipeSlug}/comments?page=${page}`,
      );
      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              comments: {
                ...response.data.comments,
                comments:
                  page === 1
                    ? response.data.comments.comments
                    : [
                        ...(state.recipe.comments?.comments || []),
                        ...response.data.comments.comments,
                      ],
              },
            }
          : null,
        commentsError: null,
        isLoadingComments: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          commentsError:
            error.response?.data?.message || "Failed to get comments",
          isLoadingComments: false,
        });
      } else {
        set({
          commentsError: "Unable to get comments. Please try again",
          isLoadingComments: false,
        });
      }
      throw error;
    }
  },

  // Create a new comment for a recipe
  createComment: async (recipeSlug, comment) => {
    set({ createCommentError: null, isSavingComment: true });

    try {
      await axios.post(`/api/v1/recipes/${recipeSlug}/comments`, comment);

      // Refresh page 1 so the new comment appears at the top
      await get().getRecipeComments(recipeSlug, 1);

      set({
        createCommentError: null,
        isSavingComment: false,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          createCommentError:
            error.response?.data?.message || "Failed to create comment",
          isSavingComment: false,
        });
      } else {
        set({
          createCommentError: "Unable to create comment. Please try again",
          isSavingComment: false,
        });
      }

      throw error;
    }
  },

  // Reply to the parent comment
  createReplyComment: async (recipeSlug, reply) => {
    set({ createCommentError: null, isSavingComment: true });

    try {
      const response = await axios.post(
        `/api/v1/recipes/${recipeSlug}/comments`,
        reply,
      );

      set((state) => ({
        recipe: state.recipe
          ? {
              ...state.recipe,
              comments: state.recipe.comments
                ? {
                    ...state.recipe.comments,
                    comments: state.recipe.comments.comments.map((comment) =>
                      comment._id === reply.parentCommentId
                        ? {
                            ...comment,
                            replies: [
                              response.data.comment,
                              ...comment.replies,
                            ],
                          }
                        : comment,
                    ),
                  }
                : undefined,
            }
          : null,
        createCommentError: null,
        isSavingComment: false,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          createCommentError:
            error.response?.data?.message || "Failed to create comment",
          isSavingComment: false,
        });
      } else {
        set({
          createCommentError: "Unable to create comment. Please try again",
          isSavingComment: false,
        });
      }

      throw error;
    }
  },

  // Clear the get recipe error
  clearGetRecipeError: () => set({ getRecipeError: null }),

  // Clear the create recipe error
  clearCreateRecipeError: () => set({ createRecipeError: null }),

  // Clear the rate recipe error
  clearRateRecipeError: () => set({ rateRecipeError: null }),

  // Clear the favorite recipe error
  clearFavoriteRecipeError: () => set({ favoriteRecipeError: null }),

  // Clear the note error
  clearNoteError: () => set({ noteError: null }),

  // Clear the comments error
  clearCommentsError: () => set({ commentsError: null }),

  // Clear the create comment error
  clearCreateCommentError: () => set({ createCommentError: null }),
}));
