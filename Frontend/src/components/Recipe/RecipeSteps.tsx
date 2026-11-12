import { useRecipeStore } from "../../store/RecipeStore";
import RecipeStepSection from "./RecipeStepSection";

// RecipeSteps component is a wrapper for all step sections
export default function RecipeSteps() {
  // Recipe store
  const { recipe } = useRecipeStore();

  return (
    <div className="w-full h-full">
      <div className="flex flex-col w-full h-fit">
        {recipe?.stepSections.map((field) => (
          <RecipeStepSection
            key={field._id}
            sectionTitle={field.sectionTitle}
            steps={field.steps}
          />
        ))}
      </div>
    </div>
  );
}
