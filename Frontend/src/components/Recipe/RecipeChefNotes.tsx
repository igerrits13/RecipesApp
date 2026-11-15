import { useRecipeStore } from "../../store/RecipeStore";

// RecipeChefNotes component that displays additional recipe notes
export default function RecipeChefNotes() {
  // Recipe store
  const { recipe } = useRecipeStore();

  return (
    <div className="flex flex-col w-full h-full text-ink-black-500 overflow-hidden md:overflow-visible">
      Notes from the Kitchen:
      <span className="w-full my-4 px-4">{recipe?.notes}</span>
      {/* Sticky note for personal notes not seen by other users */}
      <textarea
        className="resize-none p-2 content-center text-center h-50 w-50 bg-antique-parchment-500 font-title text-olive-500 focus:outline-none place-self-end rotate-345"
        placeholder="Add any personal notes here!"
        defaultValue={recipe?.userNote?.content}
      ></textarea>
    </div>
  );
}
