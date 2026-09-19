import { Plus } from "lucide-react";
import RecipeCardTemplate from "./RecipeCardTemplate";
import type { UseFieldArrayAppend } from "react-hook-form";
import type { CreateRecipeData } from "../types/Recipe";

export default function CreateRecipeLinkedRecipeAdd({
  maxLinkedRecipes,
  totalLinkedRecipes,
  linkedRecipeType,
  appendLinkedRecipe,
}: {
  maxLinkedRecipes: number;
  totalLinkedRecipes: number;
  linkedRecipeType: "component" | "pairing" | "variation";
  appendLinkedRecipe: UseFieldArrayAppend<CreateRecipeData, "linkedRecipes">;
}) {
  const cardContents = (
    <button
      className={`flex h-full w-full items-center justify-center hover:cursor-pointer text-olive-500 hover:text-olive-400 ${totalLinkedRecipes >= maxLinkedRecipes ? "pointer-events-none bg-gray-300 opacity-50" : ""}`}
      type="button"
      disabled={totalLinkedRecipes >= maxLinkedRecipes}
      onClick={() =>
        appendLinkedRecipe({ recipeId: "", role: linkedRecipeType })
      }
    >
      <Plus className="size-6" />
    </button>
  );
  return <RecipeCardTemplate cardContents={cardContents} />;
}
