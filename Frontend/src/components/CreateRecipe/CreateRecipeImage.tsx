import { ImagePlus, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import ValidationError from "../ValidationError";

// CreateRecipeImage component takes in and stores the image information for a new recipe
export default function CreateRecipeImage() {
  const {
    register,
    setValue,
    control,
    formState: { errors, isLoading },
  } = useFormContext<CreateRecipeData>();

  // State of the active recipe image
  const selectedImage = useWatch({ control, name: "image" });

  // Function to handle image preview
  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    setValue("image", file, {
      shouldValidate: true,
    });
  };

  return (
    <div className="flex flex-col gap-1 w-full sm:col-start-2 items-center">
      <div className="relative flex items-center justify-center w-full py-2 overflow-hidden min-h-75 max-h-[60vh]">
        {!selectedImage ? (
          <label htmlFor="recipe-image" className="cursor-pointer">
            <ImagePlus className="size-6 text-sage-olive-500 hover:text-sage-olive-300" />
            <input
              id="recipe-image"
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              {...register("image")}
              onChange={handleImagePreview}
              disabled={isLoading}
            />
          </label>
        ) : (
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            {selectedImage && (
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected recipe image"
                className="block max-w-full max-h-[60vh] w-auto h-auto px-2 object-contain"
              />
            )}
            <button
              type="button"
              className="absolute top-2 right-4 lg:right-6 bg-antique-parchment-500 rounded-full p-1 hover:bg-antique-parchment-300 cursor-pointer text-sage-olive-500 hover:text-sage-olive-300"
              onClick={() => {
                setValue("image", null, { shouldValidate: true });
              }}
            >
              <X className="size-6" />
            </button>
          </div>
        )}
      </div>
      {selectedImage && (
        <div className="text-rosewood-500 text-[14px]">
          <div className="flex items-center gap-1 p-2 text-center">
            Images require approval before they appear on the website. Your
            recipe can be viewed immediately upon successful submission, but
            your photo may take a while to show up.
          </div>
        </div>
      )}
      {errors.image?.message && (
        <ValidationError message={errors.image.message} />
      )}
    </div>
  );
}
