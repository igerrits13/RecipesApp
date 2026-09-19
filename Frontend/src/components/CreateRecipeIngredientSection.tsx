import { Minus, Plus } from "lucide-react";
import type { CreateRecipeData } from "../types/Recipe";
import { useFieldArray, useFormContext } from "react-hook-form";
import ValidationError from "./ValidationError";
import CreateRecipeSingleIngredient from "./CreateRecipeSingleIngredient";

// CreateRecipeIngredientSection component is a single ingredient section
export default function CreateRecipeIngredientSection({
  sectionIndex,
  removeSection,
}: {
  sectionIndex: number;
  removeSection: (sectionIndex: number) => void;
}) {
  // React hook form for tracking individual ingredients
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    name: `ingredientSections.${sectionIndex}.ingredients`,
  });

  return (
    <>
      <div className="flex flex-col px-4 pt-4">
        <div className="flex justify-between">
          <div>
            <input
              className="focus:outline-none w-36 text-olive-500
          autofill-parchment"
              type="text"
              placeholder="Section Title"
              {...register(`ingredientSections.${sectionIndex}.sectionTitle`)}
              onBlur={(e) => {
                const trimmedSectionTitle = e.target.value.trim();
                setValue(
                  `ingredientSections.${sectionIndex}.sectionTitle`,
                  trimmedSectionTitle,
                  {
                    shouldValidate: true,
                  },
                );
              }}
            />
            Ingredients:
          </div>
          {/* Remove section button */}
          {sectionIndex > 0 && (
            <button
              type="button"
              className="place-items-center hover:cursor-pointer"
              onClick={() => removeSection(sectionIndex)}
            >
              <Minus className="size-6 text-olive-500 " />
            </button>
          )}
        </div>
        <div className="grid grid-cols-[1fr_3fr_2fr_3fr_5fr] gap-1 pt-2 text-center text-olive-500 text-nowrap">
          <div></div>
          <div>Quantity</div>
          <div>Unit</div>
          <div>*Ingredient</div>
          <div>Additional Info</div>
          {ingredientFields.map((field, ingredientIndex) => (
            <CreateRecipeSingleIngredient
              key={field.id}
              sectionIndex={sectionIndex}
              ingredientIndex={ingredientIndex}
              removeIngredient={removeIngredient}
            />
          ))}
          {/* Add ingredient button */}
          {ingredientFields.length < 50 && (
            <button
              type="button"
              className="place-items-center hover:cursor-pointer"
              onClick={() =>
                appendIngredient(
                  {
                    quantity: null,
                    measurement: null,
                    ingredient: "",
                    additionalInfo: "",
                  },
                  { shouldFocus: false },
                )
              }
            >
              <Plus className="size-6 text-olive-500" />
            </button>
          )}
        </div>
        <div className="place-self-center pt-2">
          {errors.ingredientSections?.[sectionIndex]?.sectionTitle?.message && (
            <ValidationError
              message={
                errors.ingredientSections[sectionIndex].sectionTitle.message
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
