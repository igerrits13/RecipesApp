import { NutOff, SquarePen, Upload } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import { useAuthStore } from "../../store/AuthStore";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import RecipeRating from "./RecipeRating";

// RecipeTitle component that displays the title and heading information of the recipe
export default function RecipeTitle() {
  // Recipe and user stores
  const { recipe } = useRecipeStore();
  const { user } = useAuthStore();

  // Get all ingredients to check for allergies
  const allIngredients = useMemo(() => {
    return new Set(
      recipe?.ingredientSections.flatMap(({ ingredients }) =>
        ingredients.map(({ ingredient }) => ingredient._id),
      ),
    );
  }, [recipe?.ingredientSections]);

  if (!recipe) return <></>;

  // Recipe title component that displays the title and heading information of the recipe
  return (
    <div className="sm:col-start-2 px-4 py-2 flex flex-col place-items-center">
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
                  className="text-sage-olive-500 underline hover:text-sage-olive-300 ps-1"
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
                <SquarePen className="size-4 lg:size-6 text-rosewood-500 hover:text-rosewood-300" />
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
        <RecipeRating interactive={user && user._id !== recipe.author._id} />
        {/* Author */}
        <div className="flex gap-1">
          Shared by
          {recipe.author.displayName === "Deleted User" ? (
            <div>{recipe.author.displayName}</div>
          ) : (
            <Link
              to={`/other-profile/${recipe.author.slug}`}
              className="text-sage-olive-500 underline hover:text-sage-olive-300"
            >
              {recipe.author.displayName}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
