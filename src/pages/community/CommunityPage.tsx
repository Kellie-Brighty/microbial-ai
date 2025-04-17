import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCommunity } from "../../context/CommunityContext";
import { db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import PostList from "../../components/community/PostList";
import CreatePostForm from "../../components/community/CreatePostForm";
import { useCommunityTheme } from "../../context/CommunityThemeContext";
import DarkModeToggle from "../../components/community/DarkModeToggle";

interface CommunityData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

const CommunityPage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const [communityData, setCommunityData] = useState<CommunityData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const {
    anonymousId,
    isLoading: membershipLoading,
    hasMembership,
    joinCommunity,
    leaveCurrentCommunity,
    loadPostsForCommunity,
  } = useCommunity();
  const navigate = useNavigate();
  const { isDarkMode } = useCommunityTheme();

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId) return;

      try {
        // Fetch community details
        const communityDoc = await getDoc(doc(db, "communities", communityId));

        if (!communityDoc.exists()) {
          navigate("/communities");
          return;
        }

        const data = communityDoc.data();
        setCommunityData({
          id: communityDoc.id,
          name: data.name,
          description: data.description,
          memberCount: data.memberCount || 0,
        });

        // Load posts for this community
        await loadPostsForCommunity(communityId);
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityId, navigate, loadPostsForCommunity]);

  const handleJoinLeave = async () => {
    if (!currentUser) {
      navigate("/login?redirect=/community/" + communityId);
      return;
    }

    if (!communityId) return;

    if (hasMembership) {
      await leaveCurrentCommunity();
    } else {
      await joinCommunity(communityId);
    }
  };

  if (loading || membershipLoading) {
    return (
      <div
        className={`min-h-screen flex justify-center items-center ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div
        className={`min-h-screen p-6 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold">Community not found</h2>
          <p className="mt-2">
            The community you are looking for does not exist or may have been
            removed.
          </p>
          <button
            onClick={() => navigate("/communities")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go back to communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto px-4 py-8 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Community</h1>
        <div className="flex items-center space-x-3">
          <DarkModeToggle />
          <button
            onClick={() => navigate("/communities")}
            className={`px-3 py-1 rounded ${
              isDarkMode
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Communities
          </button>
        </div>
      </div>

      <div
        className={`bg-white rounded-lg overflow-hidden shadow-md mb-8 ${
          isDarkMode ? "bg-gray-800" : ""
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1
                className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {communityData.name}
              </h1>
              <p
                className={`mb-4 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {communityData.description}
              </p>
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {communityData.memberCount} member
                {communityData.memberCount !== 1 ? "s" : ""}
              </div>
            </div>

            {currentUser && (
              <button
                onClick={handleJoinLeave}
                className={`px-4 py-2 rounded ${
                  hasMembership
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {hasMembership ? "Leave Community" : "Join Anonymously"}
              </button>
            )}
          </div>

          {hasMembership && (
            <div
              className={`mt-4 p-3 rounded-md ${
                isDarkMode
                  ? "bg-green-900 text-green-200"
                  : "bg-green-100 text-green-800"
              }`}
            >
              <p>
                You are anonymously participating in this community as{" "}
                <span className="font-semibold">
                  {anonymousId?.substring(0, 8)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {hasMembership ? (
        <>
          <div className="mb-8">
            <CreatePostForm />
          </div>

          <div>
            <PostList communityId={communityId || ""} />
          </div>
        </>
      ) : (
        <div
          className={`rounded-lg p-8 text-center shadow-md ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Join this community to see posts and interact
          </h2>
          <p
            className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Your identity will be kept anonymous when you participate in this
            community.
          </p>

          {currentUser ? (
            <button
              onClick={handleJoinLeave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Join Anonymously
            </button>
          ) : (
            <button
              onClick={() =>
                navigate("/login?redirect=/community/" + communityId)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Login
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
