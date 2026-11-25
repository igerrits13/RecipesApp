import { useState } from "react";
import { useRecipeStore } from "../../store/RecipeStore";
import { commentSchema } from "../../schemas/CommentSchema";
import ValidationError from "../ValidationError";

interface RecipeCommentUpdateProps {
  setIsEditing: (isEditing: boolean) => void;
  commentId: string;
}

// RecipeCommentUpdate component that allows users to update a comment on a recipe
export default function RecipeCommentUpdate({
  setIsEditing,
  commentId,
}: RecipeCommentUpdateProps) {
  console.log("Editing comment");
  // Recipe and User store
  const { updateRecipeComment, isSavingComment, updateCommentError } =
    useRecipeStore();

  // State to keep track of the comment and error
  const [commentContent, setCommentContent] = useState<string>("");
  const [commentContentError, setCommentContentError] = useState<string | null>(
    null,
  );

  // Handle creation of a new comment
  const handleUpdateComment = async (
    commentId: string,
    commentContent: string,
  ) => {
    const result = commentSchema.safeParse({ content: commentContent });

    // Return if the comment is blank
    if (!commentContent) {
      return setCommentContentError("Comment is required");
    }

    if (!result.success) {
      setIsEditing(false);
      return setCommentContentError(result.error.issues[0]?.message);
    } else {
      await updateRecipeComment(commentId, commentContent);
    }

    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 py-4 w-full">
      <textarea
        className="w-full rounded-md border-2 border-rosewood-500 p-2"
        placeholder="Add a comment..."
        value={commentContent}
        onChange={(e) => {
          setCommentContent(e.target.value);
          setCommentContentError("");
        }}
        maxLength={500}
      />
      {updateCommentError && <ValidationError message={updateCommentError} />}
      {commentContentError && <ValidationError message={commentContentError} />}
      <div className="flex justify-between w-full">
        <button
          className={`w-fit rounded-full ${isSavingComment ? "bg-rosewood-300" : "bg-rosewood-500 cursor-pointer"} text-white py-1 px-3 sm:py-2 sm:px-5 hover:bg-rosewood-300`}
          type="button"
          onClick={() => handleUpdateComment(commentId, commentContent)}
          disabled={isSavingComment}
        >
          Submit
        </button>
        <button
          className={`w-fit rounded-full ${isSavingComment ? "bg-rosewood-300" : "bg-rosewood-500 cursor-pointer"} text-white py-1 px-3 sm:py-2 sm:px-5 hover:bg-rosewood-300`}
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={isSavingComment}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
