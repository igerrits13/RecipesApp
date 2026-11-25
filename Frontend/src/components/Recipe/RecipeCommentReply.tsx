import { Link } from "react-router-dom";
import type { Comment } from "../../types/Comment";
import { useAuthStore } from "../../store/AuthStore";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { JSX } from "react/jsx-runtime";
import RecipeCommentDropdown from "./RecipeCommentDropdown";
import { useState } from "react";
import RecipeCommentUpdate from "./RecipeCommentUpdate";

type RecipeCommentReplyProps = {
  comment: Comment;
  parentComment: Comment;
  formatDate: (
    dateInput: Date | string,
    use12Hour?: boolean,
    separator?: string,
    timeZone?: string,
    className?: string,
  ) => JSX.Element | null;
};

// RecipeCommentReply component displays replies to a comment
export default function RecipeCommentReply({
  comment,
  parentComment,
  formatDate,
}: RecipeCommentReplyProps) {
  // User store
  const { user } = useAuthStore();

  // State to keep track of if the user is replying to, or editing the comment
  const [isEditing, setIsEditing] = useState(false);

  // Check if the user is the author of the comment
  const isAuthor = user?.slug === comment.authorId.slug;

  if (!comment) return <></>;

  const commentVotes = comment.aggregateVote;

  return (
    <div className="flex flex-col gap-2 py-4">
      {isEditing ? (
        <RecipeCommentUpdate
          setIsEditing={setIsEditing}
          commentId={comment._id}
        />
      ) : (
        <>
          {" "}
          <div className="flex justify-between w-full">
            {/* Author and date */}
            <div className="flex gap-2 items-center">
              <img
                className="rounded-full size-8 sm:size-10 md:size-12 lg:size-14 xl:size-16 2xl:size-18 object-cover"
                src={comment.authorId.profileImage}
                alt="Profile Image"
              />
              <div className="flex flex-col">
                <Link
                  className="text-sage-olive-500 underline hover:text-sage-olive-300 ps-1 w-fit"
                  to={`/profile/${comment.authorId.slug}`}
                >
                  {comment.authorId.displayName}
                </Link>
                <div className="flex text-xs text-ink-black-300">
                  {formatDate(comment.createdAt)}{" "}
                  <div className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer ps-1 w-fit">
                    {comment.isEdited ? "edited" : ""}
                  </div>
                </div>
              </div>
            </div>
            {/* Like counter and dropdown */}
            <div className="flex gap-2 items-center">
              <div
                className={`p-2 ${commentVotes > 0 ? "text-sage-olive-500" : commentVotes === 0 ? "" : "text-rosewood-500"}`}
              >
                {commentVotes > 0 ? "+" : commentVotes === 0 ? "" : "-"}
                {commentVotes}
              </div>
              {user && (
                <RecipeCommentDropdown
                  commentId={comment._id}
                  commentAuthorSlug={comment.authorId.slug}
                  setIsEditing={setIsEditing}
                />
              )}
            </div>
          </div>
          <div className="items-center">
            <Link
              className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer ps-1 pe-2 w-fit"
              to={`/profile/${parentComment.authorId.slug}`}
            >
              @{parentComment.authorId.displayName}
            </Link>{" "}
            {comment.content.trim()}
          </div>
          {/* Like buttons */}
          <div className="flex justify-between gap-2 items-center w-full">
            <div className="flex gap-2 items-center">
              {!isAuthor && (
                <>
                  <button className="hover:cursor-pointer text-rosewood-300 hover:text-rosewood-500">
                    <ThumbsUp
                      className={`size-4 lg:size-6 max-w-none ${comment.userVote === "upvote" ? "fill-rosewood-500" : ""}`}
                    />
                  </button>
                  <button className="hover:cursor-pointer text-rosewood-300 hover:text-rosewood-500">
                    <ThumbsDown
                      className={`size-4 lg:size-6 max-w-none ${comment.userVote === "downvote" ? "fill-rosewood-500" : ""}`}
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
