import { Square, SquareCheck } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import ValidationError from "../ValidationError";

// Props for the CreateRecipeTitle component
type ChildProps = {
  width: number;
};

// CreateRecipeTitle component takes in and stores the title and inspiration information for a new recipe
export default function CreateRecipeTitle({ width }: ChildProps) {
  const {
    register,
    setValue,
    getValues,
    watch,
    clearErrors,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  // State to track if the recipe will have a source and if the recipe should be public
  const [hasSource, setHasSource] = useState(false);
  const isPublished = watch("isPublished");

  // Function to handle updating the publish status of a recipe
  const handleTogglePublish = () => {
    setValue("isPublished", !getValues("isPublished"));
  };

  // Function to clear all data from source values and their errors on removing source user
  const handleRemoveSource = () => {
    setValue("source", null);
    clearErrors("source");
    setHasSource(false);
  };

  return (
    <div className="sm:col-start-2 px-4 py-2 flex flex-col place-items-center">
      <div className="flex place-self-end gap-1 items-center text-sage-olive-500">
        *Make Recipe Public
        <button
          type="button"
          className="place-items-center hover:cursor-pointer"
          onClick={handleTogglePublish}
        >
          {isPublished ? (
            <SquareCheck className="size-4 lg:size-6 text-rosewood-500 hover:text-rosewood-300" />
          ) : (
            <Square className="size-4 lg:size-6 text-rosewood-500 hover:text-rosewood-300" />
          )}
        </button>
      </div>
      <input
        id="title"
        className="grow w-full font-title focus:outline-none text-olive-500 autofill-light text-2xl md:text-3xl lg:text-4xl"
        type="text"
        placeholder="*Recipe Title"
        {...register("title")}
        onBlur={(e) => {
          const trimmedTitle = e.target.value.trim();
          setValue("title", trimmedTitle, { shouldValidate: true });
        }}
      />
      {errors.title?.message && (
        <ValidationError message={errors.title.message} />
      )}
      {!hasSource ? (
        <button
          type="button"
          className="place-self-start text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer"
          onClick={() => setHasSource(true)}
        >
          Add a source for this recipe
        </button>
      ) : (
        <div className="flex flex-col w-full">
          <div className="flex w-full gap-1">
            Inspired by{" "}
            <input
              id="inspirationName"
              className="grow focus:outline-none text-olive-500 autofill-light"
              type="text"
              placeholder="*Inspiration Name"
              {...register("source.name")}
              onBlur={(e) => {
                const trimmedSourceName = e.target.value.trim();
                setValue("source.name", trimmedSourceName, {
                  shouldValidate: true,
                });
              }}
            />
          </div>
          {errors.source?.name?.message && (
            <ValidationError message={errors.source.name.message} />
          )}
          <div className="flex w-full gap-1">
            Inspired by{" "}
            <input
              id="inspirationLink"
              className="grow focus:outline-none text-olive-500 autofill-light"
              type="text"
              placeholder={
                width <= 768
                  ? "Inspiration Link (ex. https://...)"
                  : "Inspiration Link (ex. https://example.com)"
              }
              {...register("source.url")}
              onBlur={(e) => {
                const trimmedSourceUrl = e.target.value.trim();
                setValue("source.url", trimmedSourceUrl, {
                  shouldValidate: true,
                });
              }}
            />
          </div>
          {errors.source?.url?.message && (
            <ValidationError message={errors.source.url.message} />
          )}
          <div className="flex w-full gap-1">
            Inspired by{" "}
            <input
              id="inspirationNotes"
              className="grow focus:outline-none text-olive-500 autofill-light"
              type="text"
              placeholder="Additional Notes"
              {...register("source.note")}
              onBlur={(e) => {
                const trimmedSourceNote = e.target.value.trim();
                setValue("source.note", trimmedSourceNote, {
                  shouldValidate: true,
                });
              }}
            />
          </div>
          {errors.source?.note?.message && (
            <ValidationError message={errors.source.note.message} />
          )}
          <button
            type="button"
            className="place-self-start text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer"
            onClick={handleRemoveSource}
          >
            Remove source for this recipe
          </button>
        </div>
      )}
    </div>
  );
}
