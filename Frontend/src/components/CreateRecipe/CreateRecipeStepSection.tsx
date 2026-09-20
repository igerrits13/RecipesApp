import { useFieldArray, useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import { Minus, Plus } from "lucide-react";
import CreateRecipeStepSingle from "./CreateRecipeStepSingle";
import ValidationError from "../ValidationError";

// CreateRecipeStepSection component is a single step section
export default function CreateRecipeStepSection({
  sectionIndex,
  removeSection,
}: {
  sectionIndex: number;
  removeSection: (sectionIndex: number) => void;
}) {
  // React hook form for tracking individual steps
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    name: `stepSections.${sectionIndex}.steps`,
  });

  return (
    <>
      <div className="flex flex-col px-4 pt-4">
        <div className="flex justify-between">
          <div>
            Cooking Instructions for
            <input
              className="focus:outline-none w-36 ms-2 text-olive-500
          autofill-parchment"
              type="text"
              placeholder="Section Title"
              {...register(`stepSections.${sectionIndex}.sectionTitle`)}
              onBlur={(e) => {
                const trimmedSectionTitle = e.target.value.trim();
                setValue(
                  `stepSections.${sectionIndex}.sectionTitle`,
                  trimmedSectionTitle,
                  {
                    shouldValidate: true,
                  },
                );
              }}
            />
            :
          </div>
          {/* Remove section button */}
          {sectionIndex > 0 && (
            <button
              type="button"
              className="place-items-center hover:cursor-pointer"
              onClick={() => removeSection(sectionIndex)}
            >
              <Minus className="size-6 text-olive-500 hover:text-olive-400" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-[auto_auto_1fr] gap-1 pt-2 text-olive-500 text-nowrap">
          {stepFields.map((field, stepIndex) => (
            <CreateRecipeStepSingle
              key={field.id}
              sectionIndex={sectionIndex}
              stepIndex={stepIndex}
              removeStep={removeStep}
            />
          ))}
          {/* Add step button */}
          {stepFields.length < 50 && (
            <button
              type="button"
              className="place-items-center hover:cursor-pointer text-olive-500 hover:text-olive-400"
              onClick={() => appendStep({}, { shouldFocus: false })}
            >
              <Plus className="size-6" />
            </button>
          )}
        </div>
        <div className="place-self-center pt-2">
          {errors.stepSections?.[sectionIndex]?.sectionTitle?.message && (
            <ValidationError
              message={errors.stepSections[sectionIndex].sectionTitle.message}
            />
          )}
        </div>
      </div>
    </>
  );
}
