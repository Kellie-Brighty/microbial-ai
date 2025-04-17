import React from "react";
import { format } from "date-fns";
import { FiHeart } from "react-icons/fi";
import { useCommunity } from "../../context/CommunityContext";
import { CommentReply } from "../../utils/communityModel";
import { useCommunityTheme } from "../../context/CommunityThemeContext";

interface ReplyItemProps {
  reply: CommentReply;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => {
  const { anonymousId, toggleLikeReply } = useCommunity();
  const { isDarkMode } = useCommunityTheme();

  const userLiked = reply.likedBy.includes(anonymousId || "");
  const replyDate = reply.createdAt
    ? new Date(reply.createdAt.seconds * 1000)
    : new Date();

  const handleToggleLike = async () => {
    try {
      if (!reply.id) return;
      await toggleLikeReply(reply.id);
    } catch (error) {
      console.error("Error toggling like on reply:", error);
    }
  };

  // Dark mode classes
  const textClass = isDarkMode ? "text-gray-200" : "text-gray-800";
  const secondaryTextClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const bgClass = isDarkMode ? "bg-gray-700" : "bg-gray-100";
  // const borderClass = isDarkMode ? "border-gray-600" : "border-gray-200";

  return (
    <div className={`${bgClass} rounded p-2 text-sm`}>
      <div className="flex items-start">
        <div
          className={`${
            isDarkMode
              ? "bg-teal-900 text-teal-200"
              : "bg-teal-100 text-teal-800"
          } rounded-full p-1 mr-2 text-xs flex items-center justify-center min-w-[30px]`}
        >
          <span className="font-semibold">
            {reply.anonymousId.substring(0, 3)}
          </span>
        </div>
        <div className="flex-1">
          <div className="mb-1">
            <span className={`text-xs ${secondaryTextClass}`}>
              {format(replyDate, "MMM d, h:mm a")}
            </span>
          </div>
          <p className={`${textClass}`}>{reply.content}</p>

          <div className="mt-1">
            <button
              onClick={handleToggleLike}
              className={`flex items-center text-xs ${
                userLiked ? "text-red-500" : secondaryTextClass
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
    </div>
  );
};

export default ReplyItem;
