import React, { useState, useEffect } from "react";
import { FaStar, FaSpinner } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { addArticleRating, getArticleRating, getArticleAverageRating } from "../../utils/firebase";

interface ArticleRatingProps {
  articleId: string;
  onRatingUpdate?: (rating: number, totalRatings: number) => void;
}

const ArticleRating: React.FC<ArticleRatingProps> = ({ articleId, onRatingUpdate }) => {
  const { currentUser } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingData();
  }, [articleId, currentUser]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      
      // Load average rating
      const avgData = await getArticleAverageRating(articleId);
      setAverageRating(avgData.averageRating);
      setTotalRatings(avgData.totalRatings);

      // Load user's rating if logged in
      if (currentUser) {
        const userRatingData = await getArticleRating(articleId, currentUser.uid);
        if (userRatingData) {
          setUserRating(userRatingData.rating);
          setReview(userRatingData.review || "");
        }
      }
    } catch (error) {
      console.error("Error loading rating data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || userRating === 0) return;

    try {
      setSubmitting(true);
      await addArticleRating(articleId, currentUser.uid, userRating, review);
      
      // Reload rating data
      await loadRatingData();
      
      // Notify parent component
      if (onRatingUpdate) {
        onRatingUpdate(userRating, totalRatings + 1);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const filled = starValue <= rating;
      
      return (
        <button
          key={index}
          type={interactive ? "button" : "button"}
          onClick={interactive ? () => setUserRating(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          disabled={!interactive}
          className={`text-2xl transition-colors ${
            interactive ? "cursor-pointer" : "cursor-default"
          } ${
            filled
              ? "text-yellow-400"
              : "text-gray-300 hover:text-yellow-200"
          }`}
        >
          <FaStar />
        </button>
      );
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin text-mint text-xl mr-2" />
          <span className="text-gray-500">Loading ratings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-charcoal mb-4">
        Rate this Article
      </h3>

      {/* Average Rating Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              {renderStars(averageRating)}
              <span className="ml-2 text-lg font-semibold text-charcoal">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>
          {userRating > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Your rating:</p>
              <div className="flex items-center">
                {renderStars(userRating)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Form */}
      {currentUser && (
        <form onSubmit={handleRatingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center space-x-1">
              {renderStars(hoverRating || userRating, true)}
              <span className="ml-2 text-sm text-gray-600">
                {hoverRating || userRating > 0 ? `${hoverRating || userRating}/5` : "Click to rate"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this article..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {review.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={userRating === 0 || submitting}
            className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Rating"
            )}
          </button>
        </form>
      )}

      {!currentUser && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">
            Sign in to rate this article
          </p>
          <button className="text-mint hover:text-purple font-medium">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleRating; 