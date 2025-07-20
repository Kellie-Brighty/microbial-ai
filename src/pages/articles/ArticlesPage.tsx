import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaEye,
  FaBookmark,
  FaFilter,
  FaStar,
} from "react-icons/fa";
import { getAllArticles, checkArticlePurchase } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import Header from "../../components/Header";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  category: string;
  tags: string[];
  isMonetized: boolean;
  price: number;
  publishedAt: any;
  viewCount: number;
  purchaseCount: number;
  rating: number;
  authorId: string;
  reviewCount: number;
}

const ArticlesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [_purchasedArticles, setPurchasedArticles] = useState<Set<string>>(
    new Set()
  );

  const categories = [
    "All",
    "Health",
    "Science",
    "Microbiology",
    "Research",
    "Education",
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const articlesData = (await getAllArticles()) as any[];
      setArticles(articlesData as Article[]);

      // Check which articles the current user has purchased
      if (currentUser) {
        const purchased = new Set<string>();
        for (const article of articlesData) {
          if (article.isMonetized) {
            const hasPurchased = await checkArticlePurchase(
              currentUser.uid,
              article.id
            );
            if (hasPurchased) {
              purchased.add(article.id);
            }
          }
        }
        setPurchasedArticles(purchased);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All" || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return "Unknown date";
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Articles & Research
          </h1>
          <p className="text-gray-600">
            Discover insights from microbiological experts and researchers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint"
              />
              <FaSearch className="absolute left-3 top-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FaSpinner className="animate-spin text-mint text-3xl mb-4" />
              <p className="text-gray-500">Loading articles...</p>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBookmark className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search or filters"
                : "Check back later for new articles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint text-white shadow-sm">
                      {article.category}
                    </span>
                    {article.isMonetized && (
                      <span className="text-sm text-purple-600 font-semibold">
                        ₦{article.price}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-charcoal mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.excerpt || truncateText(article.content, 150)}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-500">
                        +{article.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <Link
                      to={`/authors/${article.authorId}`}
                      className="text-mint hover:text-purple transition-colors"
                    >
                      By {article.authorName}
                    </Link>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <FaEye className="mr-1" />
                        <span>{article.viewCount} views</span>
                      </div>
                      {article.rating > 0 && (
                        <div className="flex items-center">
                          <FaStar className="mr-1 text-yellow-400" />
                          <span>
                            {article.rating.toFixed(1)} (
                            {article.reviewCount || 0})
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/articles/${article.id}`}
                      className="text-mint hover:text-purple transition-colors"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
