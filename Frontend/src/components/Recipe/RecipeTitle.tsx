import { ChefHat, NutOff, Upload } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import { useAuthStore } from "../../store/AuthStore";
import { useState } from "react";

export default function RecipeTitle() {
  // Recipe and user stores
  const { recipe } = useRecipeStore();
  const { user } = useAuthStore();

  // State to keep track of the current rating to be displayed
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!recipe) return <div>Loading...</div>;

  const displayRating = hoverRating ?? rating ?? recipe?.aggregateRating ?? 0;

  // Get all ingredients to check for allergies
  const allIngredients = new Set(
    recipe.ingredientSections.flatMap(({ ingredients }) =>
      ingredients.map(({ ingredient }) => ingredient._id),
    ),
  );

  console.log("Author slug: ", recipe.author.slug);

  // Recipe title component that displays the title and heading information of the recipe
  return (
    <div className="text-ink-black-500 sm:col-start-2 px-4 py-2 flex flex-col place-items-center">
      <div className="flex justify-between w-full">
        <div className="grow w-full font-title focus:outline-none autofill-light text-2xl md:text-3xl lg:text-4xl">
          {recipe.title}
        </div>
      </div>
      {recipe.source && (
        <div className="flex justify-between w-full">
          <div className="flex">
            Inspired by{" "}
            {recipe.source?.url ? (
              <div className="relative inline-block group">
                <a
                  href={recipe.source.url}
                  target="_blank"
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
          {user &&
            user.allergies.some((allergen) => allIngredients.has(allergen)) && (
              <div className="relative inline-block group">
                <NutOff className="size-4 lg:size-6 text-rosewood-500" />
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Contains allergens
                  <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                </div>
              </div>
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
      )}
      <div className="flex justify-between w-full">
        <div className="flex" onMouseLeave={() => setHoverRating(null)}>
          {Array.from({ length: 5 }, (_, i) => {
            const fillAmount = Math.min(Math.max(displayRating - i, 0), 1);

            return (
              <div
                key={i}
                className="relative cursor-pointer"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                  setHoverRating(i + (isLeftHalf ? 0.5 : 1));
                }}
                onClick={() => setRating(hoverRating ?? rating)}
              >
                <ChefHat className="size-4 lg:size-6 text-rosewood-300" />
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <ChefHat className="size-4 lg:size-6 text-rosewood-500 fill-rosewood-500 max-w-none" />
                </div>
              </div>
            );
          })}
          {/* TODO: Add a way to get the current users ratings and allow for rating other's recipes */}
          <div className="ps-1">
            {recipe.aggregateRating} ({recipe.ratingCount})
          </div>
        </div>
        <div className="flex gap-1">
          Shared by
          <a
            href={`/other-profile/${recipe.author.slug}`}
            className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer"
          >
            {recipe.author.displayName}
          </a>
        </div>
      </div>
    </div>
  );
}
