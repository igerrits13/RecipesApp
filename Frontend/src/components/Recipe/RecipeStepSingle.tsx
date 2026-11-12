interface RecipeStepSingleProps {
  step: string;
  stepIndex: number;
}

// RecipeStepSingle component displays a single step as part of a step section
export default function RecipeStepSingle({
  step,
  stepIndex,
}: RecipeStepSingleProps) {
  return (
    <div>
      <div className="flex text-start gap-2 py-2 pb-4">
        <span>
          {stepIndex + 1}. {step}
        </span>
      </div>
    </div>
  );
}
