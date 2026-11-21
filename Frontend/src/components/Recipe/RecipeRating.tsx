import { ChefHat } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import ValidationError from "../ValidationError";
import { useState } from "react";

type RecipeRatingProps = {
  interactive: boolean | null;
};

// RecipeRating component that allows users to rate a recipe
export default function RecipeRating({ interactive }: RecipeRatingProps) {
  // State to keep track of the current rating to be displayed
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Recipe store
  const {
    recipe,
    rateRecipe,
    removeRatingFromRecipe,
    isLoadingRating,
    rateRecipeError,
  } = useRecipeStore();

  // Calculate the rating to be displayed
  const userRating = recipe?.userInteractions.userRating?.rating;
  const aggregateRating = recipe?.aggregateRating ?? 0;
  const displayRating = hoverRating ?? userRating ?? aggregateRating ?? 0;

  // Helper function to update user's rating
  const handleUpdateRating = (rating: number) => {
    if (!recipe) return;

    setHoverRating(null);

    if (rating === 0) {
      removeRatingFromRecipe(recipe.slug).catch(() => {});
    } else {
      rateRecipe(recipe.slug, rating).catch(() => {});
    }
  };

  // Handle rating changes for keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextRating = hoverRating ?? displayRating;

    switch (e.key) {
      case "ArrowRight":
        nextRating = Math.min(nextRating + 0.5, 5);
        break;
      case "ArrowLeft":
        nextRating = Math.max(nextRating - 0.5, 0.5);
        break;
      case "Home":
        nextRating = 0.5;
        break;
      case "End":
        nextRating = 5;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (hoverRating !== null) {
          handleUpdateRating(hoverRating);
        }
        return;
      default:
        return;
    }

    e.preventDefault();
    setHoverRating(nextRating);
  };

  if (!recipe) return <></>;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        <div className="flex" onMouseLeave={() => setHoverRating(null)}>
          {Array.from({ length: 5 }, (_, i) => {
            const fillAmount = Math.min(Math.max(displayRating - i, 0), 1);

            return (
              <button
                key={i}
                className={`relative ${interactive ? "cursor-pointer" : ""}`}
                role="slider"
                aria-label="Recipe rating"
                aria-valuemin={0.5}
                aria-valuemax={5}
                aria-valuenow={hoverRating ?? displayRating}
                aria-valuetext={`${hoverRating ?? displayRating} out of 5`}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                disabled={isLoadingRating || !interactive}
                onMouseMove={
                  interactive
                    ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isLeftHalf =
                          e.clientX - rect.left < rect.width / 2;
                        setHoverRating(i + (isLeftHalf ? 0.5 : 1));
                      }
                    : undefined
                }
                onClick={
                  interactive && hoverRating !== null
                    ? () =>
                        hoverRating ===
                        recipe.userInteractions.userRating?.rating
                          ? handleUpdateRating(0)
                          : handleUpdateRating(hoverRating)
                    : undefined
                }
              >
                <ChefHat className="size-4 lg:size-6 text-rosewood-100" />
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <ChefHat
                    className={`size-4 lg:size-6 text-rosewood-500 max-w-none ${interactive && userRating && hoverRating === null ? "fill-rosewood-500" : ""}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className="ps-1">
          {recipe.aggregateRating} ({recipe.ratingCount})
        </div>
      </div>
      {rateRecipeError && <ValidationError message={rateRecipeError} />}
    </div>
  );
}
