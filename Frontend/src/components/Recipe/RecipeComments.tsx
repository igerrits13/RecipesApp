import { useEffect } from "react";
import { useRecipeStore } from "../../store/RecipeStore";
import RecipeCommentSection from "./RecipeCommentSection";

// RecipeComments component is a wrapper for displaying all comments
export default function RecipeComments() {
  // Recipe store
  const { recipe, getRecipeComments, isLoadingComments } = useRecipeStore();

  const recipeSlug = recipe?.slug;

  useEffect(() => {
    if (recipeSlug) {
      getRecipeComments(recipeSlug);
    }
  }, [recipeSlug, getRecipeComments]);

  if (!recipe?.comments) return <></>;

  return (
    <div className="flex flex-col px-4">
      Notes from the community ({recipe.comments.totalComments}):
      {/* <RecipeCommentSection /> */}
      {recipe?.comments.totalComments > 0 && (
        <>
          {" "}
          <hr className="w-full mt-6 border-2 border-rosewood-500" />
          <div className="flex flex-col gap-4 bg-antique-parchment-500 p-2 py-4">
            {recipe.comments.comments.map((comment, index) => (
              <RecipeCommentSection
                key={comment._id}
                comment={comment}
                index={index}
                maxIndex={(recipe.comments?.comments.length ?? 0) - 1}
              />
            ))}
          </div>
          <hr className="w-full mb-6 border-2 border-rosewood-500" />
          {recipe.comments.currentPage < recipe.comments.totalPages && (
            <button
              className={`my-4 text-center w-fit place-self-center rounded-full bg-rosewood-500 text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300`}
              type="button"
              disabled={isLoadingComments}
              onClick={() => {
                if (recipeSlug)
                  getRecipeComments(
                    recipeSlug,
                    (recipe.comments?.currentPage ?? 1) + 1,
                  );
              }}
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
