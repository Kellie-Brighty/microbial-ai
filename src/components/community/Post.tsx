import React, { useState } from "react";
import { format } from "date-fns";
import { FiHeart, FiMessageSquare, FiSend, FiFlag } from "react-icons/fi";
import { useCommunity } from "../../context/CommunityContext";
import { CommunityPost } from "../../utils/communityModel";
// import CommentItem from "./CommentItem";
import { useCommunityTheme } from "../../context/CommunityThemeContext";

interface PostProps {
  post: CommunityPost;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const {
    anonymousId,
    toggleLikePost,
    commentOnPost,
    loadCommentsForPost,
    commentsByPostId,
    reportPostContent,
  } = useCommunity();
  const { isDarkMode } = useCommunityTheme();

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

  const handleReport = async () => {
    setShowReportConfirm(true);
  };

  const confirmReport = async () => {
    if (!post.id) return;

    try {
      setIsReporting(true);
      await reportPostContent(post.id);
      setReportSuccess(true);

      // Hide report confirmation after 3 seconds
      setTimeout(() => {
        setShowReportConfirm(false);
        setReportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error reporting post:", error);
    } finally {
      setIsReporting(false);
    }
  };

  const cancelReport = () => {
    setShowReportConfirm(false);
  };

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start mb-3">
          <div
            className={`rounded-full p-2 mr-3 ${
              isDarkMode
                ? "bg-blue-900 text-blue-200"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            <span className="font-semibold">
              {post.anonymousId.substring(0, 4)}
            </span>
          </div>
          <div className="flex-1">
            <div
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {format(postDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p
            className={`mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
          >
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

        <div
          className={`flex border-t pt-3 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            onClick={handleToggleLike}
            className={`flex items-center mr-6 ${
              userLiked
                ? "text-red-500"
                : isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
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
            className={`flex items-center mr-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <FiMessageSquare className="mr-1" size={18} />
            <span>{post.commentCount}</span>
          </button>

          <button
            onClick={handleReport}
            className={`flex items-center ml-auto px-2 py-1 rounded-md ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-red-400 hover:text-red-300"
                : "bg-gray-100 hover:bg-gray-200 text-red-500 hover:text-red-600"
            }`}
            aria-label="Report post"
            title="Report inappropriate content"
          >
            <FiFlag size={16} className="mr-1" />
            <span className="text-sm">Report</span>
          </button>
        </div>

        {/* Report confirmation popup */}
        {showReportConfirm && (
          <div
            className={`mt-3 p-3 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            {reportSuccess ? (
              <p
                className={`text-sm ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}
              >
                Thank you for your report. We will review this content.
              </p>
            ) : (
              <>
                <p
                  className={`text-sm mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Are you sure you want to report this post as inappropriate?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={confirmReport}
                    disabled={isReporting}
                    className={`px-3 py-1 rounded text-xs ${
                      isDarkMode
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    } disabled:opacity-50`}
                  >
                    {isReporting ? "Reporting..." : "Report"}
                  </button>
                  <button
                    onClick={cancelReport}
                    disabled={isReporting}
                    className={`px-3 py-1 rounded text-xs ${
                      isDarkMode
                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showComments && (
        <div
          className={`p-4 border-t ${
            isDarkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <h4
            className={`font-medium mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Comments
          </h4>

          <form onSubmit={handleSubmitComment} className="mb-4 flex">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className={`flex-1 border rounded-lg px-3 py-2 mr-2 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className={`${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white rounded-lg px-3 py-2 disabled:opacity-50`}
            >
              <FiSend size={18} />
            </button>
          </form>

          {comments.length === 0 ? (
            <p
              className={`text-center py-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {/* {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))} */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Post;
