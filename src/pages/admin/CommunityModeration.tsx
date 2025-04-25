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
  
  FiUsers,
  FiRefreshCw,
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
  const [notification, _setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  

  useEffect(() => {
    // Check for admin authentication
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    fetchCommunities();
  }, [navigate]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-purple mb-2 flex items-center">
          <FiUsers className="mr-2" /> Community Management
        </h1>
        <p className="text-gray-600">
          Monitor and moderate communities and user groups
        </p>
      </div>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search communities by name or description"
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full ${
                filter === "all"
                  ? "bg-purple text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("reported")}
              className={`px-3 py-1 rounded-full ${
                filter === "reported"
                  ? "bg-purple text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Reported
            </button>
            <button
              onClick={() => setFilter("unverified")}
              className={`px-3 py-1 rounded-full ${
                filter === "unverified"
                  ? "bg-purple text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unverified
            </button>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setCommunities([]);
              setSearchQuery("");
              setFilter("all");
              fetchCommunities();
            }}
            className="px-3 py-1 flex items-center text-gray-700 hover:bg-gray-100 rounded-full"
            title="Refresh data"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span className="ml-1">Refresh</span>
          </button>
        </div>
      </div>

      {/* Community List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-purple border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Loading communities...</p>
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
  );
};

export default CommunityModeration;
