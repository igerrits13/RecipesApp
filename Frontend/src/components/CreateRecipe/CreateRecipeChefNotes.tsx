import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import ValidationError from "../ValidationError";

// CreaterecipeChefNotes component that allows users to add notes to a recipe
export default function CreateRecipeChefNotes() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  return (
    <div className="flex flex-col w-full h-full text-ink-black-500">
      Notes from the Kitchen:
      <textarea
        className="field-sizing-content overflow-hidden w-full my-4 px-4 bg-gray-300 resize-none text-olive-500 focus:outline-none"
        placeholder="Add additional cooking notes or instructions here..."
        {...register("notes")}
        onBlur={(e) => {
          const trimmedNotes = e.target.value.trim();
          setValue("notes", trimmedNotes, { shouldValidate: true });
        }}
      />
      {errors.notes?.message && (
        <ValidationError message={errors.notes.message} />
      )}
    </div>
  );
}
