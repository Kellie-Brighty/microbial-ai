import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationCircle,
  FaEye,
  FaStar,
  FaGlobe,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import { getAuthorProfile } from "../../utils/firebase";
import Header from "../../components/Header";

interface AuthorProfile {
  id: string;
  displayName: string;
  email: string;
  bio: string;
  expertise: string[];
  institution: string;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    researchGate?: string;
  };
  profileImage: string;
  articles: any[];
  stats: {
    totalArticles: number;
    totalViews: number;
    totalPurchases: number;
    totalEarnings: number;
    averageRating: number;
  };
}

const AuthorProfilePage: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authorId) {
      loadAuthorProfile();
    }
  }, [authorId]);

  const loadAuthorProfile = async () => {
    try {
      setLoading(true);
      const authorData = await getAuthorProfile(authorId!);
      setAuthor(authorData as AuthorProfile);
    } catch (error) {
      console.error("Error loading author profile:", error);
      setError("Author profile not found");
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
            <p className="text-gray-500">Loading author profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaExclamationCircle className="text-red-500 text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Author Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              {error || "The author profile you're looking for doesn't exist."}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
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

        {/* Author Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="w-24 h-24 bg-mint rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {author.profileImage ? (
                <img
                  src={author.profileImage}
                  alt={author.displayName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                author.displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-charcoal mb-2">
                {author.displayName}
              </h1>

              {author.institution && (
                <p className="text-gray-600 mb-2">{author.institution}</p>
              )}

              {author.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {author.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-mint/10 text-mint"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex items-center space-x-4">
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-mint transition-colors"
                  >
                    <FaGlobe className="text-lg" />
                  </a>
                )}
                {author.socialLinks.twitter && (
                  <a
                    href={author.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-400 transition-colors"
                  >
                    <FaTwitter className="text-lg" />
                  </a>
                )}
                {author.socialLinks.linkedin && (
                  <a
                    href={author.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <FaLinkedin className="text-lg" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 min-w-48">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-mint">
                    {author.stats.totalArticles}
                  </div>
                  <div className="text-sm text-gray-600">Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple">
                    {author.stats.totalViews}
                  </div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {author.stats.totalPurchases}
                  </div>
                  <div className="text-sm text-gray-600">Purchases</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ₦{author.stats.totalEarnings}
                  </div>
                  <div className="text-sm text-gray-600">Earnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {author.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-charcoal mb-3">
                About
              </h3>
              <p className="text-gray-700 leading-relaxed">{author.bio}</p>
            </div>
          )}
        </div>

        {/* Author's Articles */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            Articles by {author.displayName}
          </h2>

          {author.articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-charcoal mb-2">
                No Articles Yet
              </h3>
              <p className="text-gray-600">
                This author hasn't published any articles yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {author.articles.map((article) => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-mint transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint text-white">
                      {article.category}
                    </span>
                    {article.isMonetized && (
                      <span className="text-sm font-medium text-purple-600">
                        ₦{article.price}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-charcoal mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.excerpt ||
                      article.content.substring(0, 150) + "..."}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{formatDate(article.publishedAt)}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <FaEye className="mr-1" />
                        <span>{article.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <FaStar className="mr-1 text-yellow-400" />
                        <span>{article.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/articles/${article.id}`}
                    className="inline-flex items-center px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm font-medium"
                  >
                    Read Article
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage;
