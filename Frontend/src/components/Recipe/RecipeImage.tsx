import { Heart } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";
import defaultRecipeImage from "../../../public/images/defaultRecipeImage.jpg";
import { useAuthStore } from "../../store/AuthStore";

// RecipeImage component displays the current image of the recipe
export default function RecipeImage() {
  // Recipe and user store
  const { recipe } = useRecipeStore();
  const { user } = useAuthStore();

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
          {/* TODO: Allow users to favorite recipes */}
          {/* Favorite button */}
          <button
            type="button"
            className="absolute bottom-2 right-4 lg:right-6 bg-antique-parchment-500 rounded-full p-1 hover:bg-antique-parchment-300 cursor-pointer text-rosewood-500 hover:text-rosewood-400"
            // onClick={() => {
            //   setValue("image", null, { shouldValidate: true });
            // }}
          >
            <Heart className="size-8" />
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
    </div>
  );
}
