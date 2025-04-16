import React, { useState } from "react";
import { format } from "date-fns";
import {
  FiHeart,
  FiMessageSquare,
  FiSend,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useCommunity } from "../../context/CommunityContext";
import { PostComment, CommentReply } from "../../utils/communityModel";

interface CommentItemProps {
  comment: PostComment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    anonymousId,
    toggleLikeComment,
    replyToComment,
    loadRepliesForComment,
    repliesByCommentId,
  } = useCommunity();

  const userLiked = comment.likedBy.includes(anonymousId || "");
  const replies = repliesByCommentId[comment.id || ""] || [];
  const commentDate = comment.createdAt
    ? new Date(comment.createdAt.seconds * 1000)
    : new Date();

  const handleToggleLike = async () => {
    try {
      if (!comment.id) return;
      await toggleLikeComment(comment.id);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies && comment.id && !repliesByCommentId[comment.id]) {
      // Load replies if not already loaded
      await loadRepliesForComment(comment.id);
    }
    setShowReplies(!showReplies);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReply.trim() || !comment.id) return;

    try {
      setIsSubmitting(true);
      await replyToComment(comment.id, newReply);
      setNewReply("");
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
      <div className="flex items-start mb-2">
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full p-2 mr-3">
          <span className="font-semibold">
            {comment.anonymousId.substring(0, 4)}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {format(commentDate, "MMM d, yyyy 'at' h:mm a")}
          </div>
          <p className="text-gray-900 dark:text-gray-100">{comment.content}</p>
        </div>
      </div>

      <div className="flex items-center ml-12 mb-2">
        <button
          onClick={handleToggleLike}
          className={`flex items-center mr-4 text-sm ${
            userLiked
              ? "text-red-500 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <FiHeart
            className={`mr-1 ${userLiked ? "fill-current" : ""}`}
            size={16}
          />
          <span>{comment.likes}</span>
        </button>

        <button
          onClick={handleToggleReplies}
          className="flex items-center text-sm text-gray-500 dark:text-gray-400"
        >
          <FiMessageSquare className="mr-1" size={16} />
          <span>{comment.replyCount}</span>
          {showReplies ? (
            <FiChevronUp className="ml-1" size={16} />
          ) : (
            <FiChevronDown className="ml-1" size={16} />
          )}
        </button>
      </div>

      {showReplies && (
        <div className="ml-12 mt-3 mb-4">
          <form onSubmit={handleSubmitReply} className="mb-3 flex">
            <input
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Reply to this comment..."
              className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 mr-2 text-sm bg-white dark:bg-gray-800"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newReply.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            >
              <FiSend size={16} />
            </button>
          </form>

          {replies.length === 0 ? (
            <p className="text-gray-500 text-sm">No replies yet.</p>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ReplyItemProps {
  reply: CommentReply;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => {
  const { anonymousId, toggleLikeReply } = useCommunity();
  const userLiked = reply.likedBy.includes(anonymousId || "");
  const replyDate = reply.createdAt
    ? new Date(reply.createdAt.seconds * 1000)
    : new Date();

  const handleToggleLike = async () => {
    try {
      if (!reply.id) return;
      await toggleLikeReply(reply.id);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
      <div className="flex items-start">
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full p-1.5 mr-2 text-sm">
          <span className="font-semibold">
            {reply.anonymousId.substring(0, 4)}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {format(replyDate, "MMM d, yyyy 'at' h:mm a")}
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {reply.content}
          </p>

          <button
            onClick={handleToggleLike}
            className={`flex items-center mt-1 text-xs ${
              userLiked
                ? "text-red-500 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <FiHeart
              className={`mr-1 ${userLiked ? "fill-current" : ""}`}
              size={14}
            />
            <span>{reply.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
