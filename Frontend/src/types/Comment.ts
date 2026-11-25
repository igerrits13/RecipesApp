// Interface for comments
export interface Comment {
  _id: string;
  authorId: Author;
  content: string;
  originalContent: string | null;
  parentCommentId: string | null;
  aggregateVote: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  userVote: string | null;
}

// Interface for creating a comment
export interface CreateCommentData {
  content: string;
  parentCommentId: string | null;
}

interface Author {
  slug: string;
  displayName: string;
  profileImage: string;
}
