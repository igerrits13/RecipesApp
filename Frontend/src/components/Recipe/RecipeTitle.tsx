import { NutOff, SquarePen, Upload } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import { useAuthStore } from "../../store/AuthStore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import RecipeRating from "./RecipeRating";

// RecipeTitle component that displays the title and heading information of the recipe
export default function RecipeTitle() {
  // Recipe and user stores
  const { recipe, rateRecipe, removeRatingFromRecipe } = useRecipeStore();
  const { user } = useAuthStore();

  // State to keep track of the current rating to be displayed
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Use debounce for rating
  const [debouncedRating] = useDebounce(rating, 800);

  // Handle rating changes
  useEffect(() => {
    if (!recipe || debouncedRating === undefined) return;

    // const previousRating = recipe.userRating?.rating ?? null;

    // If the user has deleted their rating, remove it
    if (debouncedRating === 0) {
      removeRatingFromRecipe(recipe.slug).catch(() => {});
      return;
    }

    // If the rating has changed, update it
    else {
      rateRecipe(recipe.slug, debouncedRating).catch(() => {});
    }
  }, [debouncedRating, recipe, rateRecipe, removeRatingFromRecipe]);

  // Get all ingredients to check for allergies
  const allIngredients = useMemo(() => {
    return new Set(
      recipe?.ingredientSections.flatMap(({ ingredients }) =>
        ingredients.map(({ ingredient }) => ingredient._id),
      ),
    );
  }, [recipe?.ingredientSections]);

  if (!recipe) return <div>Loading...</div>;

  // Calculate the ratings variables
  const previousRating = recipe.userRating?.rating ?? null;

  // null = no interaction yet
  // 0 = user explicitly removed their rating
  // 1-5 = user's selected rating

  const currentRating =
    rating === undefined ? previousRating : rating === 0 ? null : rating;

  const newTotalRating =
    recipe.totalRating - (previousRating ?? 0) + (currentRating ?? 0);

  const newRatingCount =
    recipe.ratingCount +
    (previousRating === null && currentRating !== null ? 1 : 0) -
    (previousRating !== null && currentRating === null ? 1 : 0);

  const newAggregateRating =
    newRatingCount > 0 ? newTotalRating / newRatingCount : 0;

  const displayRating = hoverRating ?? currentRating ?? newAggregateRating;

  // Helper function to update user's rating
  const handleUpdateRating = () => {
    if (hoverRating === null) return;

    setRating(hoverRating === currentRating ? 0 : hoverRating);
  };

  // Recipe title component that displays the title and heading information of the recipe
  return (
    <div className="text-ink-black-500 sm:col-start-2 px-4 py-2 flex flex-col place-items-center">
      {/* Recipe title */}
      <div className="flex justify-between w-full">
        <div className="grow w-full font-title focus:outline-none autofill-light text-2xl md:text-3xl lg:text-4xl">
          {recipe.title}
        </div>
      </div>
      {/* Recipe source */}
      {recipe.source && (
        <div className="flex justify-between w-full">
          <div className="flex">
            Inspired by{" "}
            {recipe.source?.url ? (
              <div className="relative inline-block group">
                <a
                  href={recipe.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer ps-1"
                >
                  {recipe.source.name}
                </a>
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {recipe.source.url}
                  <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                </div>
              </div>
            ) : (
              recipe.source.name
            )}
            {recipe.source?.note && `: ${recipe.source.note}`}
          </div>
          {/* Allergen, edit, and publish buttons */}
          <div className="flex gap-2">
            {user &&
              user.allergies.some((allergen) =>
                allIngredients.has(allergen),
              ) && (
                <div className="relative inline-block group">
                  <NutOff className="size-4 lg:size-6 text-rosewood-500" />
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Contains allergens
                    <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                  </div>
                </div>
              )}
            {user && user._id === recipe.author._id && (
              <Link
                to={`/recipe/${recipe.slug}/edit`}
                className="relative inline-block group"
              >
                <SquarePen className="size-4 lg:size-6 text-rosewood-500 hover:text-rosewood-300 hover:cursor-pointer" />
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Edit this recipe
                  <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                </div>
              </Link>
            )}
            {user && user._id === recipe.author._id && !recipe.isPublished && (
              <button className="relative inline-block group">
                <Upload className="size-4 lg:size-6 text-rosewood-500 hover:text-rosewood-300 hover:cursor-pointer" />
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Share this recipe
                  <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Rating, users cannot rate their own recipes */}
      <div className="flex justify-between w-full">
        <RecipeRating
          displayRating={displayRating}
          hoverRating={hoverRating}
          rating={rating}
          interactive={user && user._id !== recipe.author._id}
          setHoverRating={setHoverRating}
          handleUpdateRating={handleUpdateRating}
          newAggregateRating={newAggregateRating}
          newRatingCount={newRatingCount}
        />
        {/* Author */}
        <div className="flex gap-1">
          Shared by
          {recipe.author.displayName === "Deleted User" ? (
            <div>{recipe.author.displayName}</div>
          ) : (
            <Link
              to={`/other-profile/${recipe.author.slug}`}
              className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer"
            >
              {recipe.author.displayName}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
