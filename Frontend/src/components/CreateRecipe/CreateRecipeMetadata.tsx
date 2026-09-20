import CreateRecipeMetadataSection from "./CreateRecipeMetadataSection";

// CreateRecipeMetadata component is a wrapper for all metadata sections and allows for adding/removing sections
export default function CreateRecipeMetadata() {
  return (
    <div className="p-4">
      Get more eyes on your recipe!
      <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 py-4">
        <CreateRecipeMetadataSection
          metadataName="tags"
          displayName="Tags"
          maxItems={10}
        />
        <CreateRecipeMetadataSection
          metadataName="cuisines"
          displayName="Cuisines"
          maxItems={3}
        />
        <CreateRecipeMetadataSection
          metadataName="meals"
          displayName="Meals"
          maxItems={3}
        />
        <CreateRecipeMetadataSection
          metadataName="holidays"
          displayName="Holidays"
          maxItems={3}
        />
        <CreateRecipeMetadataSection
          metadataName="seasons"
          displayName="Seasons"
          maxItems={3}
        />
      </div>
    </div>
  );
}
