import { useFieldArray, useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../types/Recipe";
import CreateRecipeStepSection from "./CreateRecipeStepSection";
import { Plus } from "lucide-react";
import ValidationError from "./ValidationError";

// CreateRecipeSteps component is a wrapper for all step sections and allows for adding/removing sections
export default function CreateRecipeSteps() {
  // React hook form for tracking step sections
  const {
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({ name: "stepSections" });

  return (
    <div className="w-full h-full">
      <div className="flex flex-col w-full h-fit">
        {sectionFields.map((field, sectionIndex) => (
          <CreateRecipeStepSection
            key={field.id}
            sectionIndex={sectionIndex}
            removeSection={removeSection}
          />
        ))}
        {/* Add section button */}
        {sectionFields.length < 5 && (
          <button
            type="button"
            className="place-items-center hover:cursor-pointer mt-4 w-full bg-gray-300 text-olive-500 hover:text-olive-400"
            onClick={() =>
              appendSection(
                { sectiontitle: "", steps: [{ step: "" }] },
                { shouldFocus: false },
              )
            }
          >
            <Plus className="size-6" />
          </button>
        )}
        {errors.stepSections?.message && (
          <ValidationError message={errors.stepSections.message} />
        )}
      </div>
    </div>
  );
}
