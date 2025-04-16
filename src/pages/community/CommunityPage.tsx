import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCommunity } from "../../context/CommunityContext";
import { db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import PostList from "../../components/community/PostList";
import CreatePostForm from "../../components/community/CreatePostForm";

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
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Community not found</h2>
          <button
            onClick={() => navigate("/communities")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{communityData.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {communityData.description}
              </p>
              <div className="text-sm text-gray-500">
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
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-md">
              <p className="text-green-800 dark:text-green-200">
                You are anonymously participating in this community as{" "}
                <span className="font-semibold">{anonymousId}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {hasMembership ? (
        <>
          <CreatePostForm />
          <PostList communityId={communityId || ""} />
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Join this community to see posts and interact
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
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
              Log in to Join
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
