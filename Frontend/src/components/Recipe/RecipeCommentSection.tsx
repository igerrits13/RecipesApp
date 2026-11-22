import { Link } from "react-router-dom";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { Comment } from "../../types/Comment";
import { useAuthStore } from "../../store/AuthStore";
import RecipeCommentReply from "./RecipeCommentReply";

interface RecipeCommentSectionProps {
  comment: Comment;
  index: number;
  maxIndex: number;
}

// RecipeCommentSection component displays a single comment with its replies
export default function RecipeCommentSection({
  comment,
  index,
  maxIndex,
}: RecipeCommentSectionProps) {
  // User store
  const { user } = useAuthStore();

  // Check if the user is the author of the comment
  const isAuthor = user?.slug === comment.authorId.slug;

  if (!comment) return <></>;

  const commentVotes = comment.aggregateVote;

  // Helper function for formatting the date
  const formatDate = (dateInput: Date | string): string => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // en-GB outputs "22 June 2026"; replace inserts the comma after the month
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
      .format(date)
      .replace(/ (\d{4})$/, ", $1");
  };

  return (
    <div className="flex flex-col gap-2 py-4">
      <div className="flex justify-between w-full">
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
        <div
          className={`p-2 ${commentVotes > 0 ? "text-sage-olive-500" : commentVotes === 0 ? "" : "text-rosewood-500"}`}
        >
          {commentVotes > 0 ? "+" : commentVotes === 0 ? "" : "-"}
          {commentVotes}
        </div>
      </div>
      {comment.content.trim()}
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
        <div className="text-sage-olive-500 underline hover:text-sage-olive-300 hover:cursor-pointer ps-1 w-fit">
          Reply
        </div>
      </div>
      <div className="ms-12 px-2 border-l-3 border-rosewood-500">
        {comment.replies.map((reply) => (
          <RecipeCommentReply
            key={reply._id}
            comment={reply}
            parentComment={comment}
            formatDate={formatDate}
          />
        ))}
      </div>
      {index !== maxIndex && (
        <hr className="w-full border-2 border-rosewood-500" />
      )}
    </div>
  );
}
