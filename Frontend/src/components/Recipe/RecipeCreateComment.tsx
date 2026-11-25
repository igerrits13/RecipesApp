import { commentSchema } from "../../schemas/CommentSchema";
import { useAuthStore } from "../../store/AuthStore";
import { useState } from "react";
import ValidationError from "../ValidationError";
import { useRecipeStore } from "../../store/RecipeStore";

interface RecipeCreateCommentProps {
  setIsWritingComment: React.Dispatch<React.SetStateAction<boolean>>;
}

// RecipeCreateComment component allows the user to add a comment to a recipe
export default function RecipeCreateComment({
  setIsWritingComment,
}: RecipeCreateCommentProps) {
  // Recipe and User store
  const { recipe, createComment, isSavingComment, createCommentError } =
    useRecipeStore();
  const { user } = useAuthStore();

  // State to keep track of the comment and error
  const [commentContent, setCommentContent] = useState<string>("");
  const [commentContentError, setCommentContentError] = useState<string | null>(
    null,
  );

  if (!user || !recipe) return <></>;

  // Handle creation of a new comment
  const handleCreateComment = async () => {
    const result = commentSchema.safeParse({ content: commentContent });

    if (!result.success) {
      setIsWritingComment(false);
      return setCommentContentError(result.error.issues[0]?.message);
    }

    await createComment(recipe.slug, {
      content: commentContent,
      parentCommentId: null,
    });

    setIsWritingComment(false);
  };

  return (
    <div className="flex flex-col gap-2 py-4">
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
      {createCommentError && <ValidationError message={createCommentError} />}
      {commentContentError && <ValidationError message={commentContentError} />}
      <div className="flex justify-between w-full">
        <button
          className={`w-fit rounded-full ${isSavingComment ? "bg-rosewood-300" : "bg-rosewood-500 cursor-pointer"} text-white py-1 px-3 sm:py-2 sm:px-5 hover:bg-rosewood-300`}
          type="button"
          onClick={() => handleCreateComment()}
          disabled={isSavingComment}
        >
          Submit
        </button>
        <button
          className={`w-fit rounded-full ${isSavingComment ? "bg-rosewood-300" : "bg-rosewood-500 cursor-pointer"} text-white py-1 px-3 sm:py-2 sm:px-5 hover:bg-rosewood-300`}
          type="button"
          onClick={() => setIsWritingComment(false)}
          disabled={isSavingComment}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
