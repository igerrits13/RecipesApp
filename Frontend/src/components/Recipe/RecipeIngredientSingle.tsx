import { Circle } from "lucide-react";
import type { Ingredient } from "../../types/Ingredient";
import type { Measurement } from "../../types/Measurement";
import { useState } from "react";

interface RecipeIngredientSingleProps {
  additionalInfo: string | null;
  ingredient: Ingredient;
  measurement: Measurement | null;
  quantity: string | null;
}

// RecipeIngredientSingle component displays a single ingredient as part of an ingredient section
export default function RecipeIngredientSingle({
  additionalInfo,
  ingredient,
  measurement,
  quantity,
}: RecipeIngredientSingleProps) {
  // State to keep track of checkeked off ingredients
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div>
      <button
        type="button"
        className={`hover:cursor-pointer w-full ${isChecked ? "line-through" : ""}`}
        onClick={() => setIsChecked(!isChecked)}
      >
        <div className="flex items-start text-start gap-2">
          <Circle
            className={`size-2 mt-2 ${isChecked ? "fill-ink-black-500" : ""}`}
          />
          <span>
            {quantity?.toLowerCase()} {measurement?.title?.toLowerCase()}{" "}
            {ingredient.title?.toLowerCase()} {additionalInfo?.toLowerCase()}
          </span>
        </div>
      </button>
    </div>
  );
}
