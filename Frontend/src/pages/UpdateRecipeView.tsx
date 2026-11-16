import { useEffect } from "react";
import { useRecipeStore } from "../store/RecipeStore";
import { useNavigate, useParams } from "react-router-dom";

// UpdateRecipeView component that allows users to update their own existing recipe
export default function UpdateRecipeView() {
  // Allow navigation
  const navigate = useNavigate();

  // Access the get recipe function from the recipe store
  const { getRecipe, recipe, isLoading, getRecipeError } = useRecipeStore();
  const { recipeSlug } = useParams();

  useEffect(() => {
    if (recipeSlug) {
      getRecipe(recipeSlug);
    }
  }, [recipeSlug, getRecipe]);

  if (isLoading) return <div>Loading...</div>;

  // If there is an error, navigate to the 404 page
  if (getRecipeError) {
    navigate("*");
  }

  return <div>Update your recipe {recipe?.title} here</div>;
}
