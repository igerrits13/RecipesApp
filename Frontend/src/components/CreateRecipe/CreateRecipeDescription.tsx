import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import ValidationError from "../ValidationError";
import { Clock, HandPlatter } from "lucide-react";

// CreateRecipeDescription component takes in and stores the description information for a new recipe
export default function CreateRecipeDescription() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex grow flex-col py-6 items-center gap-2 h-full bg-antique-parchment-500 text-ink-black-500 text-nowrap">
        {/* Prep/Cook time */}
        <div className="flex px-2">
          <div className="text-olive-500"> * </div>
          <input
            className="focus:outline-none w-6 lg:w-8 text-center text-olive-500 autofill-parchment"
            type="text"
            placeholder="0"
            {...register("preptime.hours", { valueAsNumber: true })}
          />
          h&nbsp; <div className="text-olive-500"> * </div>
          <input
            className="focus:outline-none w-6 lg:w-8 text-center text-olive-500 autofill-parchment"
            type="text"
            placeholder="0"
            {...register("preptime.minutes", { valueAsNumber: true })}
          />
          m Prep/
          <div className="text-olive-500"> * </div>
          <input
            className="focus:outline-none w-6 lg:w-8 text-center text-olive-500 autofill-parchment"
            type="text"
            placeholder="0"
            {...register("cooktime.hours", { valueAsNumber: true })}
          />
          h&nbsp; <div className="text-olive-500"> * </div>
          <input
            className="focus:outline-none w-6 lg:w-8 text-center text-olive-500 autofill-parchment"
            type="text"
            placeholder="0"
            {...register("cooktime.minutes", { valueAsNumber: true })}
          />
          m Cook <Clock className="size-6 text-rosewood-500 ml-2" />
        </div>
        {errors.preptime?.hours?.message && (
          <ValidationError message={errors.preptime.hours.message} />
        )}
        {errors.preptime?.minutes?.message && (
          <ValidationError message={errors.preptime.minutes.message} />
        )}
        {errors.cooktime?.hours?.message && (
          <ValidationError message={errors.cooktime.hours.message} />
        )}
        {errors.cooktime?.minutes?.message && (
          <ValidationError message={errors.cooktime.minutes.message} />
        )}

        {/* Servings */}
        <div className="flex px-2">
          <div className="text-olive-500"> * </div>
          <input
            className="focus:outline-none w-6 lg:w-8 text-center text-olive-500 autofill-parchment"
            type="text"
            placeholder="0"
            {...register("servings", { valueAsNumber: true })}
          />
          Servings <HandPlatter className="size-6 text-rosewood-500 ml-2" />
        </div>
        {errors.servings?.message && (
          <ValidationError message={errors.servings.message} />
        )}
        <hr className="w-full my-2 border-2 border-rosewood-500" />

        {/* Description */}
        <textarea
          className="focus:outline-none w-full h-full px-4 text-start text-olive-500 autofill-parchment resize-none"
          placeholder="Describe your dish"
          {...register("description")}
          onBlur={(e) => {
            const trimmedDescription = e.target.value.trim();
            setValue("description", trimmedDescription, {
              shouldValidate: true,
            });
          }}
        />
        {errors.description?.message && (
          <ValidationError message={errors.description.message} />
        )}
      </div>
      <hr className="w-full place-self-end border-2 border-rosewood-500" />
    </div>
  );
}
