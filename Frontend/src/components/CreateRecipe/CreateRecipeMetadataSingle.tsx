import { useFormContext } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import { Minus } from "lucide-react";
import ValidationError from "../ValidationError";

type MetadataName = "tags" | "cuisines" | "meals" | "holidays" | "seasons";

type CreateRecipeMetadataSingleProps = {
  metadataName: MetadataName;
  index: number;
  handleRemoveSection: (index: number) => void;
};

export default function CreateRecipeMetadataSingle({
  metadataName,
  index,
  handleRemoveSection,
}: CreateRecipeMetadataSingleProps) {
  // React hook form for tracking individual metadata values
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const metadataError = errors[metadataName]?.[index];

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Remove value Button */}
        <button
          className="place-items-start hover:cursor-pointer"
          type="button"
          onClick={() => handleRemoveSection(index)}
        >
          <Minus className="size-6 text-olive-500 hover:text-olive-400" />
        </button>
        <input
          className="focus:outline-none overflow-hidden px-2 w-full text-olive-500 bg-gray-300 autofill-gray"
          type="text"
          placeholder={`*Add a ${metadataName.slice(0, metadataName.length - 1)}...`}
          {...register(`${metadataName}.${index}`)}
          onBlur={(e) => {
            const trimmedValue = e.target.value.trim();
            setValue(`${metadataName}.${index}`, trimmedValue, {
              shouldValidate: true,
            });
          }}
        />
      </div>
      {metadataError?.message && (
        <div className="place-self-center py-2">
          <ValidationError message={metadataError.message} />
        </div>
      )}
    </>
  );
}
