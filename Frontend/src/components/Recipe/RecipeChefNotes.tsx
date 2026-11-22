import { useRecipeStore } from "../../store/RecipeStore";
import ValidationError from "../ValidationError";

// RecipeChefNotes component that displays additional recipe notes
export default function RecipeChefNotes() {
  // Recipe store
  const {
    recipe,
    createNote,
    updateNote,
    deleteNote,
    isLoadingNote,
    noteError,
  } = useRecipeStore();

  if (!recipe) return <></>;

  // Helper function to update user's personal note
  const handleNoteBlur = (newNote: string) => {
    const originalUserNote = recipe.userInteractions.userNote?.content ?? "";
    const trimmedNewNote = newNote.trim();

    // If the new note is too long or the new note and existing note are the same, do nothing
    if (trimmedNewNote.length > 500) return;
    if (originalUserNote === trimmedNewNote) return;

    // If the new note is empty, delete the existing note. If there is an existing note, update it. Otherwise, create a new note
    if (!trimmedNewNote) {
      if (recipe.userInteractions.userNote) {
        deleteNote(recipe.userInteractions.userNote._id);
      }
    } else if (recipe.userInteractions.userNote) {
      updateNote(trimmedNewNote, recipe.userInteractions.userNote._id);
    } else {
      createNote(recipe._id, trimmedNewNote);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden md:overflow-visible">
      Notes from the Kitchen:
      <span className="w-full my-4 px-4">{recipe?.notes}</span>
      {/* Sticky note for personal notes not seen by other users */}
      <div className="flex flex-col place-items-center text-center place-self-end gap-6">
        <textarea
          className="resize-none p-2 content-center text-center h-50 w-50 bg-antique-parchment-500 font-title text-olive-500 focus:outline-none place-self-end rotate-345"
          placeholder="Add any personal notes here!"
          defaultValue={recipe?.userInteractions.userNote?.content}
          maxLength={500}
          disabled={isLoadingNote}
          onBlur={(e) => {
            handleNoteBlur(e.target.value.trim());
          }}
        ></textarea>
        {isLoadingNote && <span>Saving note...</span>}
        {noteError && <ValidationError message={noteError} />}
      </div>
    </div>
  );
}
