import { Heart } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import defaultRecipeImage from "../../../public/images/defaultRecipeImage.jpg";
import { useAuthStore } from "../../store/AuthStore";
import ValidationError from "../ValidationError";

// RecipeImage component displays the current image of the recipe
export default function RecipeImage() {
  // Recipe and user store
  const {
    recipe,
    addFavoriteRecipe,
    removeFavoriteRecipe,
    isLoadingFavorite,
    favoriteRecipeError,
  } = useRecipeStore();
  const { user } = useAuthStore();

  if (!recipe) return <></>;

  // Helper function update user's favorites
  const handleOnFavorite = () => {
    if (!recipe) return;

    if (recipe.userInteractions.isFavorited) {
      removeFavoriteRecipe(recipe._id).catch(() => {});
    } else {
      addFavoriteRecipe(recipe._id).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full sm:col-start-2 items-center">
      <div className="relative flex items-center justify-center w-full py-2 overflow-hidden min-h-75 max-h-[60vh]">
        <div className="relative flex items-center justify-center max-w-full max-h-full">
          {/* Recipe image or default image */}
          {recipe?.image?.isApproved ? (
            <img
              src={`${recipe?.image?.imageURL}`}
              alt="Selected recipe image"
              className="block max-w-full max-h-[60vh] w-auto h-auto px-2 object-contain"
            />
          ) : (
            <img
              src={defaultRecipeImage}
              alt="Selected recipe image"
              className="block max-w-full max-h-[60vh] w-auto h-auto px-2 object-contain"
            />
          )}
          {/* Favorite button */}
          <button
            type="button"
            className={`absolute bottom-2 right-4 lg:right-6 rounded-full p-1 hover:bg-antique-parchment-300  hover:text-rosewood-400 ${isLoadingFavorite ? "bg-antique-parchment-300 text-rosewood-400" : "bg-antique-parchment-500 text-rosewood-500 cursor-pointer"}`}
            onClick={() => handleOnFavorite()}
            disabled={isLoadingFavorite}
          >
            <Heart
              className={`size-8 ${recipe.userInteractions.isFavorited ? "fill-rosewood-500" : ""}`}
            />
          </button>
        </div>
      </div>
      {/* Newly uploaded images require approval notice */}
      {user?._id === recipe?.author._id && !recipe?.image?.isApproved && (
        <div className="text-rosewood-500 text-[14px]">
          <div className="flex items-center gap-1 p-2 text-center">
            Newly uploaded images require approval before appearing on the
            website. Please check back later.
          </div>
        </div>
      )}
      {favoriteRecipeError && <ValidationError message={favoriteRecipeError} />}
    </div>
  );
}
