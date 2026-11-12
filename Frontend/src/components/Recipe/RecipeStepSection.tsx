import RecipeStepSingle from "./RecipeStepSingle";

interface RecipeStepSectionProps {
  sectionTitle: string;
  steps: string[];
}

// RecipeStepSection component displays a single step section
export default function RecipeStepSection({
  sectionTitle,
  steps,
}: RecipeStepSectionProps) {
  return (
    <>
      <div className="flex flex-col px-4 pt-4">
        <div className="font-bold">
          {sectionTitle ? (
            <div>{sectionTitle} Instructions:</div>
          ) : (
            <div>Cooking Instructions:</div>
          )}
        </div>
        {steps.map((field, stepIndex) => (
          <RecipeStepSingle
            key={stepIndex}
            stepIndex={stepIndex}
            step={field}
          />
        ))}
      </div>
    </>
  );
}
