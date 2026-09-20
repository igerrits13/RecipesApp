import { Minus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import ValidationError from "../ValidationError";

// CreateRecipeIngredientSingle component is a single ingredient as part of an ingredient section
export default function CreateRecipeIngredientSingle({
  sectionIndex,
  ingredientIndex,
  removeIngredient,
}: {
  sectionIndex: number;
  ingredientIndex: number;
  removeIngredient: (ingredientIndex: number) => void;
}) {
  // React hook form for tracking individual ingredients
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  return (
    <>
      {/* Remove Ingredient Button */}
      {ingredientIndex > 0 ? (
        <button
          type="button"
          className="place-items-center hover:cursor-pointer"
          onClick={() => removeIngredient(ingredientIndex)}
        >
          <Minus className="size-6 text-olive-500 hover:text-olive-400" />
        </button>
      ) : (
        <div></div>
      )}
      <input
        className="focus:outline-none w-full text-center bg-gray-300 autofill-gray"
        type="text"
        {...register(
          `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.quantity`,
        )}
        onBlur={(e) => {
          const trimmedQuantity = e.target.value.trim();
          if (trimmedQuantity === "") {
            setValue(
              `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.quantity`,
              null,
              { shouldValidate: true },
            );
          } else {
            setValue(
              `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.quantity`,
              trimmedQuantity,
              { shouldValidate: true },
            );
          }
        }}
      />
      <input
        className="focus:outline-none w-full text-center bg-gray-300 autofill-gray"
        type="text"
        {...register(
          `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.measurement`,
        )}
      />
      <input
        className="focus:outline-none w-full text-center bg-gray-300 autofill-gray"
        type="text"
        {...register(
          `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.ingredient`,
        )}
        onBlur={(e) => {
          const trimmedIngredient = e.target.value.trim();
          setValue(
            `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.ingredient`,
            trimmedIngredient,
            { shouldValidate: true },
          );
        }}
      />
      <input
        className="focus:outline-none w-full text-center bg-gray-300 autofill-gray"
        type="text"
        {...register(
          `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.additionalInfo`,
        )}
        onBlur={(e) => {
          const trimmedInfo = e.target.value.trim();
          setValue(
            `ingredientSections.${sectionIndex}.ingredients.${ingredientIndex}.additionalInfo`,
            trimmedInfo,
            { shouldValidate: true },
          );
        }}
      />
      <div className="place-self-center place-items-center py-2 col-span-full">
        {errors.ingredientSections?.[sectionIndex]?.ingredients?.[
          ingredientIndex
        ]?.quantity?.message && (
          <ValidationError
            message={
              errors.ingredientSections[sectionIndex]?.ingredients?.[
                ingredientIndex
              ]?.quantity?.message
            }
          />
        )}
        {errors.ingredientSections?.[sectionIndex]?.ingredients?.[
          ingredientIndex
        ]?.measurement?.message && (
          <ValidationError
            message={
              errors.ingredientSections[sectionIndex]?.ingredients?.[
                ingredientIndex
              ]?.measurement?.message
            }
          />
        )}
        {errors.ingredientSections?.[sectionIndex]?.ingredients?.[
          ingredientIndex
        ]?.ingredient?.message && (
          <ValidationError
            message={
              errors.ingredientSections[sectionIndex]?.ingredients?.[
                ingredientIndex
              ]?.ingredient?.message
            }
          />
        )}
        {errors.ingredientSections?.[sectionIndex]?.ingredients?.[
          ingredientIndex
        ]?.additionalInfo?.message && (
          <ValidationError
            message={
              errors.ingredientSections[sectionIndex]?.ingredients?.[
                ingredientIndex
              ]?.additionalInfo?.message
            }
          />
        )}
      </div>
    </>
  );
}
