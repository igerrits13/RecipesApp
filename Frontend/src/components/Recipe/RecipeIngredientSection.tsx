import type { RecipeIngredient } from "../../types/Recipe";
import RecipeIngredientSingle from "./RecipeIngredientSingle";

interface RecipeIngredientSectionProps {
  sectionTitle: string;
  ingredients: RecipeIngredient[];
}

// RecipeIngredientSection component displays a single ingredient section
export default function RecipeIngredientSection({
  sectionTitle,
  ingredients,
}: RecipeIngredientSectionProps) {
  return (
    <>
      <div className="flex flex-col px-4 pt-4">
        <div className="font-bold">
          <div>{sectionTitle} Ingredients:</div>
        </div>
        {ingredients.map((field, ingredientIndex) => (
          <RecipeIngredientSingle
            key={ingredientIndex}
            additionalInfo={field.additionalInfo}
            ingredient={field.ingredient}
            measurement={field.measurement}
            quantity={field.quantity}
          />
        ))}
      </div>
    </>
  );
}
