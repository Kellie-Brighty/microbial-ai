import React, { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { createArticle } from "../../utils/firebase";

interface ArticleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ArticleCreationModal: React.FC<ArticleCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Health",
    tags: [] as string[],
    isMonetized: false,
    price: 0,
    excerpt: "",
  });

  const categoryOptions = [
    "Health",
    "Science",
    "Microbiology",
    "Research",
    "Education",
  ];
  const tagOptions = [
    "Microbiology",
    "Health",
    "Science",
    "Research",
    "Education",
    "Laboratory",
    "Disease Prevention",
    "Nutrition",
    "Biotechnology",
    "Medical",
    "Environmental",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      await createArticle(currentUser.uid, formData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to publish article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: "",
        content: "",
        category: "Health",
        tags: [],
        isMonetized: false,
        price: 0,
        excerpt: "",
      });
      setSuccess(false);
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-charcoal">
            Publish New Article
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <FaTimes size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Article Published Successfully!
            </h3>
            <p className="text-gray-600">
              Your article has been published and is now available to readers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                <FaExclamationCircle className="text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter a compelling title for your article..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="grid grid-cols-3 gap-3 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {tagOptions.map((tag) => (
                  <label key={tag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                      className="rounded border-gray-300 text-mint focus:ring-mint"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="A brief summary of your article (optional)..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Write your article content here. You can use markdown formatting..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint resize-none"
                rows={12}
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="monetize"
                  checked={formData.isMonetized}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isMonetized: e.target.checked,
                      price: e.target.checked ? prev.price : 0,
                    }))
                  }
                  className="rounded border-gray-300 text-mint focus:ring-mint"
                />
                <label
                  htmlFor="monetize"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Monetize this article (charge for access)
                </label>
              </div>

              {formData.isMonetized && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mint"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set price to 0 for free access. Recommended price range:
                    ₦100 - ₦1000
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                Publishing Guidelines
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure your content is accurate and well-researched</li>
                <li>
                  • Use clear, engaging language that's accessible to your
                  audience
                </li>
                <li>
                  • Include relevant citations and references when appropriate
                </li>
                <li>
                  • Your article will be reviewed for quality and compliance
                </li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  "Publish Article"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ArticleCreationModal;
