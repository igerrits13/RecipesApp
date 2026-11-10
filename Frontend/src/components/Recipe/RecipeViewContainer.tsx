import { useParams } from "react-router-dom";
import { useRecipeStore } from "../../store/RecipeStore";
import RecipeTitle from "./RecipeTitle";
import { useEffect, useState } from "react";
import RecipeImage from "./RecipeImage";
import RecipeDescription from "./RecipeDescription";

export default function RecipeViewContainer() {
  // Allow navigation
  //   const navigate = useNavigate();

  // Access the get recipe function from the recipe store
  const { recipe, getRecipe, isLoading } = useRecipeStore();
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

  console.log(recipe);

  return (
    <div className="flex flex-col">
      <div className="md:grid md:grid-cols-[1fr_4fr]">
        <RecipeTitle />
        {width > 768 ? (
          <>
            <RecipeImage /> <RecipeDescription />
          </>
        ) : (
          <>
            <RecipeDescription /> <RecipeImage />
          </>
        )}
      </div>
    </div>
  );

  return <div>Container</div>;
}
