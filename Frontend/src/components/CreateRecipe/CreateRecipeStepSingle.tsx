import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import { Minus } from "lucide-react";
import ValidationError from "../ValidationError";

// CreateRecipeStepSingle component is a single step as part of a step section
export default function CreateRecipeStepSingle({
  sectionIndex,
  stepIndex,
  removeStep,
}: {
  sectionIndex: number;
  stepIndex: number;
  removeStep: (stepIndex: number) => void;
}) {
  // React hook form for tracking individual steps
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  return (
    <>
      {/* Remove step button */}
      {stepIndex > 0 ? (
        <button
          className="place-items-start hover:cursor-pointer"
          type="button"
          onClick={() => removeStep(stepIndex)}
        >
          <Minus className="size-6 text-olive-500 hover:text-olive-400" />
        </button>
      ) : (
        <div></div>
      )}{" "}
      <div className="flex items-start"> {stepIndex + 1} - </div>
      <textarea
        className="field-sizing-content overflow-hidden px-2 bg-gray-300 autofill-gray resize-none focus:outline-none"
        placeholder="*Cooking Instructions..."
        {...register(`stepSections.${sectionIndex}.steps.${stepIndex}.step`)}
        onBlur={(e) => {
          const trimmedStep = e.target.value.trim();
          setValue(
            `stepSections.${sectionIndex}.steps.${stepIndex}.step`,
            trimmedStep,
            { shouldValidate: true },
          );
        }}
      />
      <div className="place-self-center place-items-center py-2 col-span-full">
        {errors.stepSections?.[sectionIndex]?.steps?.[stepIndex]?.step
          ?.message && (
          <ValidationError
            message={
              errors.stepSections?.[sectionIndex]?.steps?.[stepIndex]?.step
                ?.message
            }
          />
        )}
      </div>
    </>
  );
}
