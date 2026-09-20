import { Plus } from "lucide-react";
import CreateRecipeIngredientSection from "./CreateRecipeIngredientSection";
import { useFieldArray, useFormContext } from "react-hook-form";
import ValidationError from "../ValidationError";
import type { CreateRecipeData } from "../../types/Recipe";

// CreateRecipeIngredients component is a wrapper for all ingredient sections and allows for adding/removing sections
export default function CreateRecipeIngredients() {
  // React hook form for tracking ingredient sections
  const {
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    name: "ingredientSections",
  });

  return (
    <div className="w-full h-full  bg-antique-parchment-500">
      <div className="flex flex-col w-full h-fit">
        {sectionFields.map((field, sectionIndex) => (
          <CreateRecipeIngredientSection
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
                {
                  sectionTitle: "",
                  ingredients: [
                    {
                      quantity: null,
                      measurement: null,
                      ingredient: "",
                      additionalInfo: "",
                    },
                  ],
                },
                { shouldFocus: false },
              )
            }
          >
            <Plus className="size-6" />
          </button>
        )}
        {errors.ingredientSections?.message && (
          <ValidationError message={errors.ingredientSections.message} />
        )}
      </div>
    </div>
  );
}
