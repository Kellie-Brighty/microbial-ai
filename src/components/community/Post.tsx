import React, { useState } from "react";
import { format } from "date-fns";
import { FiHeart, FiMessageSquare, FiSend } from "react-icons/fi";
import { useCommunity } from "../../context/CommunityContext";
import { CommunityPost } from "../../utils/communityModel";
import CommentItem from "./CommentItem";

interface PostProps {
  post: CommunityPost;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    anonymousId,
    toggleLikePost,
    commentOnPost,
    loadCommentsForPost,
    commentsByPostId,
  } = useCommunity();

  const userLiked = post.likedBy.includes(anonymousId || "");
  const comments = commentsByPostId[post.id || ""] || [];
  const postDate = post.createdAt
    ? new Date(post.createdAt.seconds * 1000)
    : new Date();

  const handleToggleLike = async () => {
    try {
      if (!post.id) return;
      await toggleLikePost(post.id);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments && post.id && !commentsByPostId[post.id]) {
      // Load comments if not already loaded
      await loadCommentsForPost(post.id);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !post.id) return;

    try {
      setIsSubmitting(true);
      await commentOnPost(post.id, newComment);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-start mb-3">
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full p-2 mr-3">
            <span className="font-semibold">
              {post.anonymousId.substring(0, 4)}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {format(postDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-3 text-gray-900 dark:text-gray-100">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="mt-2">
              <img
                src={post.imageUrl}
                alt="Post"
                className="max-h-96 rounded-lg object-contain mx-auto"
              />
            </div>
          )}
        </div>

        <div className="flex border-t dark:border-gray-700 pt-3">
          <button
            onClick={handleToggleLike}
            className={`flex items-center mr-6 ${
              userLiked
                ? "text-red-500 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <FiHeart
              className={`mr-1 ${userLiked ? "fill-current" : ""}`}
              size={18}
            />
            <span>{post.likes}</span>
          </button>

          <button
            onClick={handleToggleComments}
            className="flex items-center text-gray-500 dark:text-gray-400"
          >
            <FiMessageSquare className="mr-1" size={18} />
            <span>{post.commentCount}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t dark:border-gray-700">
          <h4 className="font-medium mb-3">Comments</h4>

          <form onSubmit={handleSubmitComment} className="mb-4 flex">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 mr-2 bg-white dark:bg-gray-800"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            >
              <FiSend size={18} />
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Post;
