import { ChefHat } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import ValidationError from "../ValidationError";

type RecipeRatingProps = {
  displayRating: number;
  hoverRating?: number | null;
  rating?: number;
  interactive: boolean | null;
  setHoverRating: (rating: number | null) => void;
  handleUpdateRating: () => void;
  newAggregateRating?: number;
  newRatingCount?: number;
};

// RecipeRating component that allows users to rate a recipe
export default function RecipeRating({
  displayRating,
  hoverRating,
  rating,
  interactive,
  setHoverRating,
  handleUpdateRating,
  newAggregateRating,
  newRatingCount,
}: RecipeRatingProps) {
  // Recipe store
  const { recipe, isLoadingRating, rateRecipeError } = useRecipeStore();

  const hasPersonalRating =
    rating === undefined ? Boolean(recipe?.userRating?.rating) : rating > 0;

  // Handle rating changes for keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
        handleUpdateRating();
        return;
      default:
        return;
    }

    e.preventDefault();
    setHoverRating(nextRating);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex" onMouseLeave={() => setHoverRating(null)}>
        {Array.from({ length: 5 }, (_, i) => {
          const fillAmount = Math.min(Math.max(displayRating - i, 0), 1);

          return (
            <div
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
              onMouseMove={
                interactive
                  ? (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                      setHoverRating(i + (isLeftHalf ? 0.5 : 1));
                    }
                  : undefined
              }
              onClick={interactive ? handleUpdateRating : undefined}
            >
              <ChefHat className="size-4 lg:size-6 text-rosewood-100" />
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <ChefHat
                  className={`size-4 lg:size-6 text-rosewood-500 max-w-none ${interactive && hasPersonalRating ? "fill-rosewood-500" : ""}`}
                />
              </div>
            </div>
          );
        })}
        {isLoadingRating ? (
          <div className="ps-1">Loading Rating...</div>
        ) : (
          <div className="ps-1">
            {Math.floor((newAggregateRating ?? 0) * 2) / 2} ({newRatingCount})
          </div>
        )}
      </div>
      {rateRecipeError && <ValidationError message={rateRecipeError} />}
    </div>
  );
}
