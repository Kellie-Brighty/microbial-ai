import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaEye,
  FaSpinner,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  getArticle,
  checkArticlePurchase,
  getArticleAverageRating,
} from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import ArticlePaymentModal from "../../components/payment/ArticlePaymentModal";
import ArticleComments from "../../components/articles/ArticleComments";
import ArticleRating from "../../components/articles/ArticleRating";
import ArticleSharing from "../../components/articles/ArticleSharing";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  authorEmail: string;
  category: string;
  tags: string[];
  isMonetized: boolean;
  price: number;
  publishedAt: any;
  viewCount: number;
  purchaseCount: number;
  rating: number;
}

const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { currentUser } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, _setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [error, setError] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [_averageRating, setAverageRating] = useState(0);
  const [_totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    if (!articleId) return;

    try {
      const articleData = await getArticle(articleId);
      setArticle(articleData as Article);

      // Check if user has purchased this article
      if (currentUser && (articleData as any).isMonetized) {
        const purchased = await checkArticlePurchase(
          currentUser.uid,
          articleId
        );
        setHasPurchased(purchased);
      }

      // Load rating data
      const ratingData = await getArticleAverageRating(articleId);
      setAverageRating(ratingData.averageRating);
      setTotalRatings(ratingData.totalRatings);
    } catch (error) {
      console.error("Error loading article:", error);
      setError("Article not found");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-mint text-3xl mb-4" />
            <p className="text-gray-500">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaExclamationCircle className="text-red-500 text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Article Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              {error || "The article you're looking for doesn't exist."}
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canReadArticle = !article.isMonetized || hasPurchased;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/articles"
            className="inline-flex items-center text-gray-600 hover:text-charcoal transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Articles
          </Link>
        </div>

        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mint text-white">
              {article.category}
            </span>
            {article.isMonetized && (
              <span className="text-lg font-semibold text-purple-600">
                ₦{article.price}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-charcoal mb-4">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-gray-600 mb-6 italic">
              "{article.excerpt}"
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <span>By {article.authorName}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center">
              <FaEye className="mr-1" />
              <span>{article.viewCount} views</span>
              {article.isMonetized && (
                <>
                  <span className="mx-2">•</span>
                  <span>{article.purchaseCount} purchases</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Purchase Button */}
          {article.isMonetized && !hasPurchased && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8 mb-6 shadow-md">
              <div className="text-center">
                <h3 className="text-xl font-bold text-purple-800 mb-3">
                  Premium Article
                </h3>
                <p className="text-purple-700 mb-6 text-lg">
                  Purchase this article to read the full content and support the
                  author
                </p>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={purchasing}
                  className="inline-flex items-center px-10 py-5 bg-mint text-white text-xl font-bold rounded-xl hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-4 border-purple transform hover:scale-105"
                >
                  Purchase for ₦{article.price}
                </button>
              </div>
            </div>
          )}

          {/* Article Content */}
          {canReadArticle && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            </div>
          )}

          {/* Social Features */}
          <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-charcoal">
                Article Feedback
              </h3>
              <ArticleSharing
                articleId={article.id}
                title={article.title}
                excerpt={article.excerpt}
                authorName={article.authorName}
              />
            </div>

            {/* Rating Section */}
            <div className="mb-8">
              <ArticleRating
                articleId={article.id}
                onRatingUpdate={(rating, total) => {
                  setAverageRating(rating);
                  setTotalRatings(total);
                }}
              />
            </div>

            {/* Comments Section */}
            <ArticleComments articleId={article.id} />
          </div>
        </div>

        {/* Payment Modal */}
        <ArticlePaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setHasPurchased(true);
            setPaymentModalOpen(false);
            // Reload article to get updated purchase count
            loadArticle();
          }}
          article={article}
        />
      </div>
    </div>
  );
};

export default ArticleDetailPage;
