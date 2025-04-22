import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiCheck,
  FiTrash2,
  FiAlertCircle,
  FiEye,
  FiUser,
  FiFilter,
  FiLogOut,
} from "react-icons/fi";

interface Community {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  createdBy: string;
  memberCount: number;
  tags: string[];
  isVerified: boolean;
  isReported?: boolean;
  reports?: number;
}

const CommunityModeration: React.FC = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "reported" | "unverified">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  useEffect(() => {
    // Check for admin authentication
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    const fetchCommunities = async () => {
      try {
        // Get all communities sorted by creation date
        const communitiesQuery = query(
          collection(db, "communities"),
          orderBy("createdAt", "desc")
        );
        const communitiesSnapshot = await getDocs(communitiesQuery);

        const communitiesList = communitiesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            memberCount: data.memberCount || 0,
            tags: data.tags || [],
            isVerified: data.isVerified || false,
            isReported: data.isReported || false,
            reports: data.reports || 0,
          };
        });

        setCommunities(communitiesList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching communities:", error);
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [navigate]);

  const verifyCommunity = async (communityId: string) => {
    try {
      await updateDoc(doc(db, "communities", communityId), {
        isVerified: true,
        isReported: false,
        reports: 0,
        moderatedAt: Timestamp.now(),
        moderatedBy: "admin", // Using generic admin since we're not checking specific admin IDs
      });

      // Update local state
      setCommunities(
        communities.map((comm) =>
          comm.id === communityId
            ? { ...comm, isVerified: true, isReported: false, reports: 0 }
            : comm
        )
      );

      if (selectedCommunity?.id === communityId) {
        setSelectedCommunity({
          ...selectedCommunity,
          isVerified: true,
          isReported: false,
          reports: 0,
        });
      }
    } catch (error) {
      console.error("Error verifying community:", error);
    }
  };

  const deleteCommunity = async (communityId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this community? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "communities", communityId));

      // Update local state
      setCommunities(communities.filter((comm) => comm.id !== communityId));

      if (selectedCommunity?.id === communityId) {
        setSelectedCommunity(null);
      }
    } catch (error) {
      console.error("Error deleting community:", error);
    }
  };

  // Apply filters to the communities
  const filteredCommunities = communities.filter((community) => {
    // Filter by status
    if (filter === "reported" && !community.isReported) return false;
    if (filter === "unverified" && community.isVerified) return false;

    // Search query filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query) ||
        community.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Check if admin is authenticated
  const isAdminAuthenticated =
    localStorage.getItem("adminAuthenticated") === "true";
  if (!isAdminAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-offWhite">
      {/* Admin Header */}
      <header className="bg-white border-b border-lightGray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-charcoal">Admin Portal</h1>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/activity")}
                className="text-charcoal hover:text-mint transition-colors px-3 py-2"
              >
                Activity Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/communities")}
                className="text-mint font-medium border-b-2 border-mint px-3 py-2"
              >
                Communities
              </button>
              <button
                onClick={() => navigate("/admin/moderation")}
                className="text-charcoal hover:text-mint transition-colors px-3 py-2"
              >
                Content Moderation
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:text-red-700 transition-colors"
                title="Logout"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-charcoal mb-2">
            Community Moderation
          </h2>
          <p className="text-gray-600">
            Manage all communities in the platform.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-lightGray">
          <div className="flex space-x-2 items-center">
            <FiFilter className="text-gray-500 mr-2" />
            <button
              className={`px-4 py-2 rounded-full ${
                filter === "all"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                filter === "reported"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
              onClick={() => setFilter("reported")}
            >
              Reported
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                filter === "unverified"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
              onClick={() => setFilter("unverified")}
            >
              Unverified
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-full bg-offWhite focus:outline-none focus:border-mint"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Communities List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-lightGray">
            <div className="animate-spin h-10 w-10 border-4 border-mint rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading communities...</p>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center border border-lightGray">
            <p className="text-gray-600">
              No communities found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-lightGray">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-offWhite">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommunities.map((community) => (
                  <tr key={community.id} className="hover:bg-offWhite">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-charcoal">
                            {community.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {community.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {community.memberCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {community.isVerified ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <FiCheck className="mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <FiAlertCircle className="mr-1" /> Unverified
                          </span>
                        )}
                        {community.isReported && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <FiAlertCircle className="mr-1" /> Reported
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {community.createdAt?.toDate().toLocaleDateString() ||
                        "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            window.open(`/community/${community.id}`, "_blank")
                          }
                          className="text-mint hover:text-purple transition-colors"
                          title="View Community"
                        >
                          <FiEye />
                        </button>
                        {!community.isVerified && (
                          <button
                            onClick={() => verifyCommunity(community.id)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="Verify Community"
                          >
                            <FiCheck />
                          </button>
                        )}
                        <button
                          onClick={() => deleteCommunity(community.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Delete Community"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityModeration;
