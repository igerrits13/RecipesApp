import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVertical } from "lucide-react";
import { useAuthStore } from "../../store/AuthStore";
import { useRecipeStore } from "../../store/RecipeStore";
import ValidationError from "../ValidationError";

type RecipeCommentDropdownProps = {
  commentId: string;
  commentAuthorSlug: string;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

// RecipeCommentDropdown component allowing users to edit or delete their own comments, and report other comments
export default function RecipeCommentDropdown({
  commentId,
  commentAuthorSlug,
  setIsEditing,
}: RecipeCommentDropdownProps) {
  // User and recipe store
  const { user } = useAuthStore();
  const { recipe, deleteRecipeComment, updateCommentError, isSavingComment } =
    useRecipeStore();

  if (!user || !recipe || !recipe.comments) return <></>;

  // Helper function for deleting a comment
  const handleDeleteComment = async () => {
    await deleteRecipeComment(commentId);
  };

  return (
    <Menu>
      <MenuButton
        aria-label="Open comment menu"
        className="inline-flex items-center focus:not-data-focus:outline-none cursor-pointer"
      >
        <EllipsisVertical className="hover:cursor-pointer text-sage-olive-500 hover:text-sage-olive-300" />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="z-20 w-52 origin-top-right rounded-xl border-2 border-rosewood-500 bg-antique-parchment-500 py-2 px-1 text-base transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        {user.slug === commentAuthorSlug ? (
          <>
            <MenuItem>
              <button
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300 hover:cursor-pointer"
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSavingComment}
              >
                Edit Comment
              </button>
            </MenuItem>
            <MenuItem>
              <button
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300 hover:cursor-pointer"
                type="button"
                onClick={() => handleDeleteComment()}
                disabled={isSavingComment}
              >
                Delete Comment
              </button>
            </MenuItem>
            {updateCommentError && (
              <ValidationError message={updateCommentError} />
            )}
          </>
        ) : (
          <>
            <MenuItem>
              <button
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300 hover:cursor-pointer"
                type="button"
                onClick={() => {}}
                disabled={isSavingComment}
              >
                Report Comment
              </button>
            </MenuItem>
            {/* {logoutError && <ValidationError message={logoutError} />} */}
          </>
        )}
      </MenuItems>
    </Menu>
  );
}
