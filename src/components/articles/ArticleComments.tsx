import React, { useState, useEffect } from "react";
import { FaComment, FaUser, FaClock, FaSpinner } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { addArticleComment, getArticleComments } from "../../utils/firebase";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: any;
}

interface ArticleCommentsProps {
  articleId: string;
}

const ArticleComments: React.FC<ArticleCommentsProps> = ({ articleId }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await getArticleComments(articleId);
      setComments(commentsData as Comment[]);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await addArticleComment(articleId, currentUser.uid, newComment.trim());
      setNewComment("");
      await loadComments(); // Reload comments to show the new one
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <FaComment className="text-mint mr-2" />
        <h3 className="text-lg font-semibold text-charcoal">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this article..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {newComment.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </button>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-mint text-xl mr-2" />
          <span className="text-gray-500">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaComment className="text-3xl mx-auto mb-2 text-gray-300" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-mint/10 p-2 rounded-full">
                  <FaUser className="text-mint" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-charcoal">
                      {comment.userName}
                    </h4>
                    <div className="flex items-center text-sm text-gray-500">
                      <FaClock className="mr-1" />
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {comment.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!currentUser && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">
            Sign in to leave a comment
          </p>
          <button className="text-mint hover:text-purple font-medium">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleComments; 