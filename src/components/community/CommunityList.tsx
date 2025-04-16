import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../utils/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
 
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: Date;
}

const CommunityList: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const communitiesQuery = query(
          collection(db, "communities"),
          orderBy("memberCount", "desc"),
          limit(10)
        );

        const querySnapshot = await getDocs(communitiesQuery);
        const communitiesList: Community[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          communitiesList.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            memberCount: data.memberCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        setCommunities(communitiesList);
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  const handleJoinCommunity = (communityId: string) => {
    if (!currentUser) {
      // Redirect to login if user is not authenticated
      navigate("/login?redirect=/communities");
      return;
    }

    // Navigate to the community page
    navigate(`/community/${communityId}`);
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login?redirect=/communities");
      return;
    }

    if (!newCommunityName.trim() || !newCommunityDesc.trim()) {
      return;
    }

    try {
      setLoading(true);

      // Create new community
      const communityRef = await addDoc(collection(db, "communities"), {
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        memberCount: 0,
      });

      // Reset form and hide it
      setNewCommunityName("");
      setNewCommunityDesc("");
      setShowCreateForm(false);

      // Navigate to the new community
      navigate(`/community/${communityRef.id}`);
    } catch (error) {
      console.error("Error creating community:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Communities</h1>
        {currentUser && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {showCreateForm ? "Cancel" : "Create Community"}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create New Community</h2>
          <form onSubmit={handleCreateCommunity}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Community Name
              </label>
              <input
                type="text"
                id="name"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={newCommunityDesc}
                onChange={(e) => setNewCommunityDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create
            </button>
          </form>
        </div>
      )}

      {communities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No communities found.
          </p>
          <p className="mt-2">Be the first to create a community!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div
              key={community.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{community.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {community.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {community.memberCount} member
                    {community.memberCount !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityList;
