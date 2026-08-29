import { ImagePlus, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { CreateRecipeData } from "../types/Recipe";
import ValidationError from "./ValidationError";
import { useState } from "react";

export default function CreateRecipeImage() {
  const {
    register,
    setValue,
    control,
    formState: { errors, isLoading },
  } = useFormContext<CreateRecipeData>();

  // State of the active recipe image
  const selectedImage = useWatch({ control, name: "image" });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Function to handle image preview
  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setValue("image", file, {
      shouldValidate: true,
    });
  };

  return (
    <div className="flex flex-col gap-1 w-full sm:col-start-2 items-center">
      <div className="relative flex items-center justify-center w-full py-2 overflow-hidden min-h-75 sm:min-h-87.5 lg:min-h-100 max-h-[60vh] landscape:max-h-none sm:landscape:max-h-[60vh]">
        {!selectedImage ? (
          <label htmlFor="recipe-image" className="cursor-pointer">
            <ImagePlus className="size-6 text-sage-olive-500" />
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
          <div>
            {previewImage && (
              <img
                src={previewImage}
                alt="Selected recipe image"
                className="object-cover"
              />
            )}
            <button
              type="button"
              className="absolute top-2 right-2 bg-antique-parchment-500 rounded-full p-1 hover:bg-antique-parchment-300 cursor-pointer"
              onClick={() => {
                setValue("image", null, { shouldValidate: true });
                setPreviewImage(null);
              }}
            >
              <X className="size-6 text-sage-olive-500" />
            </button>
          </div>
        )}
      </div>
      {errors.image?.message && (
        <ValidationError message={errors.image.message} />
      )}
    </div>
  );
}
