import { useNavigate, useParams } from "react-router-dom";
import { useRecipeStore } from "../../store/RecipeStore";
import RecipeTitle from "./RecipeTitle";
import { useEffect, useState } from "react";
import RecipeImage from "./RecipeImage";
import RecipeDescription from "./RecipeDescription";
import RecipeIngredients from "./RecipeIngredients";

export default function RecipeViewContainer() {
  // Allow navigation
  const navigate = useNavigate();

  // Access the get recipe function from the recipe store
  const { getRecipe, isLoading, getRecipeError } = useRecipeStore();
  const { recipeSlug } = useParams();

  useEffect(() => {
    if (recipeSlug) {
      getRecipe(recipeSlug);
    }
  }, [recipeSlug, getRecipe]);

  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Add an evenet listener to update the width state when the window is resized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  // If there is an error, navigate to the 404 page
  if (getRecipeError) {
    navigate("*");
  }

  return (
    <div className="flex flex-col">
      <div className="md:grid md:grid-cols-[1fr_4fr]">
        <RecipeTitle />
        {width <= 768 ? (
          <>
            <RecipeImage /> <RecipeDescription />
          </>
        ) : (
          <>
            <RecipeDescription /> <RecipeImage />
          </>
        )}
        <RecipeIngredients />
      </div>
    </div>
  );

  return <div>Container</div>;
}
