import { X } from "lucide-react";
import RecipeCardTemplate from "../RecipeCardTemplate";

export default function CreateRecipeLinkedRecipeCard({
  recipe,
  linkedRecipeIndex,
  removeLinkedRecipe,
}: {
  recipe: { recipeId: string; role: "component" | "pairing" | "variation" };
  linkedRecipeIndex: number;
  removeLinkedRecipe: (index: number) => void;
}) {
  const cardContents = (
    <>
      <button
        type="button"
        className="absolute top-4 right-4 lg:right-6 bg-gray-300 rounded-full p-1 hover:bg-gray-200 cursor-pointer text-sage-olive-500 hover:text-sage-olive-300"
        onClick={() => {
          removeLinkedRecipe(linkedRecipeIndex);
        }}
      >
        <X className="size-6" />
      </button>
      <h1 className="text-lg font-bold">
        Linked Recipe for {recipe.role} with index: {linkedRecipeIndex} and ID:{" "}
        {recipe.recipeId}
      </h1>
    </>
  );

  return <RecipeCardTemplate cardContents={cardContents} />;
}
