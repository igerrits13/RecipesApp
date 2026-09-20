import { useFormContext, useWatch } from "react-hook-form";
import type { CreateRecipeData } from "../../types/Recipe";
import { Plus } from "lucide-react";
import CreateRecipeMetadataSingle from "./CreateRecipeMetadataSingle";
import ValidationError from "../ValidationError";

type MetadataName = "tags" | "cuisines" | "meals" | "holidays" | "seasons";

type CreateRecipeMetadataTemplateProps = {
  metadataName: MetadataName;
  displayName: string;
  maxItems: number;
};

// CreateRecipeMetadataSection component  is a single metadata section
export default function CreateRecipeMetadataSection({
  metadataName,
  displayName,
  maxItems,
}: CreateRecipeMetadataTemplateProps) {
  const {
    setValue,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const metadataErrors = errors[metadataName];

  const values = useWatch({ name: metadataName });

  // Helper function to add a new value to the section
  const handleAddSection = (value: string) => {
    if (values.length >= maxItems) return;

    setValue(metadataName, [...values, value]);
  };

  // Helper function to remove a value from the section
  const handleRemoveSection = (index: number) => {
    setValue(
      metadataName,
      values.filter((_: string, i: number) => i !== index),
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-center text-olive-500 bg-antique-parchment-500 rounded-4xl overflow-hidden">
      {displayName} ({maxItems} Max)
      {values.map((value: string, index: number) => (
        <CreateRecipeMetadataSingle
          key={`${index}`}
          metadataName={metadataName}
          index={index}
          handleRemoveSection={handleRemoveSection}
        />
      ))}
      {/* Add value button */}
      {values.length < maxItems && (
        <button
          type="button"
          className="place-self-start place-items-center hover:cursor-pointer text-olive-500 hover:text-olive-400"
          onClick={() => handleAddSection("")}
        >
          <Plus className="size-6" />
        </button>
      )}
      {metadataErrors?.message && (
        <ValidationError message={metadataErrors.message} />
      )}
    </div>
  );
}
