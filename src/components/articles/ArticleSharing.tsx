import React, { useState } from "react";
import {
  FaShare,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaLink,
  FaCheck,
} from "react-icons/fa";

interface ArticleSharingProps {
  articleId: string;
  title: string;
  excerpt?: string;
  authorName: string;
}

const ArticleSharing: React.FC<ArticleSharingProps> = ({
  articleId,
  title,
  // excerpt,
  authorName,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const articleUrl = `${window.location.origin}/articles/${articleId}`;
  const shareText = `${title} by ${authorName}`;
  // const shareDescription = excerpt || `Check out this article by ${authorName}`;

  const shareLinks = [
    {
      name: "Twitter",
      icon: FaTwitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(articleUrl)}`,
      color: "text-blue-400 hover:text-blue-500",
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        articleUrl
      )}`,
      color: "text-blue-600 hover:text-blue-700",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        articleUrl
      )}`,
      color: "text-blue-700 hover:text-blue-800",
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShare = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <FaShare className="mr-2" />
        Share
      </button>

      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />

          {/* Share Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-48">
            <h4 className="font-medium text-charcoal mb-3">
              Share this article
            </h4>

            <div className="space-y-2">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleShare(link.url)}
                  className={`w-full flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${link.color}`}
                >
                  <link.icon className="mr-3" />
                  {link.name}
                </button>
              ))}

              <button
                onClick={copyToClipboard}
                className="w-full flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-800"
              >
                {copied ? (
                  <>
                    <FaCheck className="mr-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaLink className="mr-3" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArticleSharing;
