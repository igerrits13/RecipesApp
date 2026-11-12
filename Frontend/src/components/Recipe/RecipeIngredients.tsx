import { useRecipeStore } from "../../store/RecipeStore";
import RecipeIngredientSection from "./RecipeIngredientSection";

// RecipeIngredients component is a wrapper for displaying all ingredient sections
export default function RecipeIngredients() {
  // Recipe store
  const { recipe } = useRecipeStore();

  return (
    <div className="w-full h-full pb-4 bg-antique-parchment-500">
      <div className="flex flex-col w-full h-fit">
        {recipe?.ingredientSections.map((field) => (
          <RecipeIngredientSection
            key={field._id}
            sectionTitle={field.sectionTitle}
            ingredients={field.ingredients}
          />
        ))}
      </div>
    </div>
  );
}
