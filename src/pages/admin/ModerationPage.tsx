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
  getDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";

import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiCheck as FiCheckIcon,
  FiTrash2,
  FiAlertCircle,
  FiEye as FiEyeIcon,
  FiFilter,
  FiLogOut,
} from "react-icons/fi";

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: Timestamp;
  communityId: string;
  communityName?: string;
  reports?: number;
  flagged?: boolean;
  reportedBy?: string[];
}

const ModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filter, setFilter] = useState<"all" | "reported" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingPosts, setProcessingPosts] = useState<{
    [key: string]: string;
  }>({});
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  // Extract fetchFlaggedPosts into a separate function
  const fetchFlaggedPosts = async () => {
    try {
      console.log("Fetching reported posts...");
      // Get all communities to match with posts
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      const communities = communitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));

      // Get posts from multiple collections
      const collectionsToCheck = ["posts", "communityPosts", "anonymousPosts"];
      let allPosts: Post[] = [];

      for (const collectionName of collectionsToCheck) {
        console.log(`Checking ${collectionName} collection...`);
        try {
          const postsQuery = query(
            collection(db, collectionName),
            orderBy(
              collectionName === "anonymousPosts" ? "timestamp" : "createdAt",
              "desc"
            )
          );
          const postsSnapshot = await getDocs(postsQuery);
          console.log(`Found ${postsSnapshot.size} posts in ${collectionName}`);

          if (postsSnapshot.size > 0 && collectionName === "anonymousPosts") {
            // Log details of the first few posts to understand structure
            postsSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
              const data = doc.data();
              console.log(`anonymousPost ${idx} structure:`, {
                id: doc.id,
                content: data.content?.substring(0, 30) + "...",
                reports: data.reports,
                reportCount: data.reportCount,
                timestamp: data.timestamp,
              });
            });
          }

          // Process posts from this collection
          const postsFromCollection = postsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const communityInfo = communities.find(
              (c) => c.id === data.communityId
            );

            // Handle different data structures in different collections
            return {
              id: doc.id,
              content: data.content || "",
              author: data.author
                ? typeof data.author === "object" && data.author !== null
                  ? data.author
                  : { id: data.userId || "unknown", name: data.author }
                : {
                    id: data.anonymousId || data.userId || "unknown",
                    name: data.authorName || "Anonymous",
                  },
              createdAt: data.createdAt || data.timestamp,
              communityId: data.communityId || "",
              communityName: communityInfo?.name || "Unknown Community",
              reports:
                collectionName === "anonymousPosts"
                  ? data.reportCount || 0
                  : data.reports?.length ||
                    data.reportCount ||
                    data.reports ||
                    0,
              flagged: data.flagged || false,
              reportedBy:
                collectionName === "anonymousPosts"
                  ? Array.isArray(data.reports)
                    ? data.reports
                    : []
                  : data.reportedBy || data.reports || [],
            };
          });

          allPosts = [...allPosts, ...postsFromCollection];
        } catch (error) {
          console.error(`Error fetching from ${collectionName}:`, error);
        }
      }

      console.log(
        `Processed ${allPosts.length} total posts from all collections`
      );

      // Filter posts to include both flagged and reported
      const flaggedPosts = allPosts
        .filter(
          (post) =>
            post.flagged ||
            (post.reports !== undefined && post.reports > 0) ||
            (post.reportedBy && post.reportedBy.length > 0)
        )
        .sort((a, b) =>
          typeof b.reports === "number" && typeof a.reports === "number"
            ? b.reports - a.reports
            : 0
        );

      console.log(`Found ${flaggedPosts.length} flagged/reported posts`);

      // Log details about the first few filtered posts
      if (flaggedPosts.length > 0) {
        console.log("Sample flagged/reported posts:");
        flaggedPosts.slice(0, 3).forEach((post, idx) => {
          console.log(`Flagged post ${idx}:`, {
            id: post.id,
            content: post.content?.substring(0, 30) + "...",
            reports: post.reports,
            reportedBy: post.reportedBy?.length,
            flagged: post.flagged,
          });
        });
      } else {
        console.log("No flagged/reported posts found after filtering");
      }

      setPosts(flaggedPosts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching flagged posts:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoading(true);

    // Wait for UI to update before fetching data
    setTimeout(async () => {
      await fetchFlaggedPosts();
      setIsRefreshing(false);
    }, 100);
  };

  useEffect(() => {
    // Check for admin authentication
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    fetchFlaggedPosts();
  }, [navigate]);

  const approvePost = async (postId: string) => {
    try {
      // Set this post as processing (approving)
      setProcessingPosts((prev) => ({ ...prev, [postId]: "approving" }));

      // We need to check all three collections for this post
      const collectionsToCheck = ["posts", "communityPosts", "anonymousPosts"];
      let found = false;

      for (const collectionName of collectionsToCheck) {
        try {
          // Check if post exists in this collection
          const postRef = doc(db, collectionName, postId);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            // Update the post in the collection where it was found
            await updateDoc(postRef, {
              flagged: false,
              reports:
                collectionName === "communityPosts"
                  ? []
                  : collectionName === "anonymousPosts"
                  ? []
                  : 0,
              reportedBy: [],
              reportCount: 0,
              moderated: true,
              moderatedAt: Timestamp.now(),
              moderatedBy: "admin", // Using generic admin since we're not checking specific admin IDs
            });
            found = true;
            console.log(`Post approved in ${collectionName} collection`);
            break;
          }
        } catch (err) {
          console.error(`Error checking post in ${collectionName}:`, err);
        }
      }

      if (!found) {
        console.error("Could not find post in any collection:", postId);
      }

      setPosts(posts.filter((post) => post.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Error approving post:", error);
    } finally {
      // Remove the processing state
      setProcessingPosts((prev) => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      // Set this post as processing (deleting)
      setProcessingPosts((prev) => ({ ...prev, [postId]: "deleting" }));

      // We need to check all three collections for this post
      const collectionsToCheck = ["posts", "communityPosts", "anonymousPosts"];
      let found = false;

      for (const collectionName of collectionsToCheck) {
        try {
          // Check if post exists in this collection
          const postRef = doc(db, collectionName, postId);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            // Delete the post from the collection where it was found
            await deleteDoc(postRef);
            found = true;
            console.log(`Post deleted from ${collectionName} collection`);
            break;
          }
        } catch (err) {
          console.error(`Error checking post in ${collectionName}:`, err);
        }
      }

      if (!found) {
        console.error("Could not find post in any collection:", postId);
      }

      setPosts(posts.filter((post) => post.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      // Remove the processing state
      setProcessingPosts((prev) => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
    }
  };

  // Apply filters to the content
  const filteredPosts = posts.filter((item) => {
    // Filter by status
    if (
      filter === "reported" &&
      !item.flagged &&
      (!item.reports || item.reports === 0) &&
      (!item.reportedBy || item.reportedBy.length === 0)
    )
      return false;
    if (
      filter === "pending" &&
      (item.flagged !== undefined ||
        (item.reports && item.reports > 0) ||
        (item.reportedBy && item.reportedBy.length > 0))
    )
      return false;

    // Search query filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      // Safe way to get author name regardless of structure
      const getAuthorName = () => {
        if (!item.author) return "";
        if (typeof item.author === "string") return item.author;
        if (typeof item.author === "object" && item.author.name)
          return item.author.name;
        return "";
      };

      const authorName = getAuthorName().toLowerCase();
      const communityName = (item.communityName || "").toLowerCase();
      const content = (item.content || "").toLowerCase();

      return (
        authorName.includes(query) ||
        communityName.includes(query) ||
        content.includes(query)
      );
    }

    return true;
  });

  const handleFilterChange = (newFilter: "all" | "reported" | "pending") => {
    setIsFiltering(true);
    setFilter(newFilter);
    // Simulate a small delay to show the loading state
    setTimeout(() => setIsFiltering(false), 300);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFiltering(true);
    setSearchQuery(e.target.value);
    // Debounce search to avoid excessive re-renders
    setTimeout(() => setIsFiltering(false), 300);
  };

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
                onClick={() => navigate("/admin/moderation")}
                className="text-mint font-medium border-b-2 border-mint px-3 py-2"
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">
              Content Moderation
            </h2>
            <p className="text-gray-600">
              Manage reported and flagged content from the platform.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white py-2 px-4 rounded-lg border border-lightGray hover:bg-offWhite transition-colors disabled:opacity-50 flex items-center"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-mint rounded-full border-t-transparent mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <FiSearch className="mr-2" />
                Refresh Content
              </>
            )}
          </button>
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
              onClick={() => handleFilterChange("all")}
              disabled={isFiltering}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                filter === "reported"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
              onClick={() => handleFilterChange("reported")}
              disabled={isFiltering}
            >
              Reported
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                filter === "pending"
                  ? "bg-mint text-white"
                  : "bg-offWhite text-charcoal"
              }`}
              onClick={() => handleFilterChange("pending")}
              disabled={isFiltering}
            >
              Pending
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-full bg-offWhite focus:outline-none focus:border-mint"
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={isFiltering}
            />
            {isFiltering ? (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-mint rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            )}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-lightGray">
            <div className="animate-spin h-12 w-12 border-4 border-mint rounded-full border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium mb-2">Loading content...</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Searching through all collections for reported content. This may
              take a moment.
            </p>
          </div>
        ) : isFiltering ? (
          <div className="bg-white p-6 rounded-lg shadow text-center border border-lightGray">
            <div className="animate-spin h-8 w-8 border-3 border-mint rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Filtering content...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center border border-lightGray">
            <FiSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              No content found matching your criteria.
            </p>
            <p className="text-gray-500 text-sm">
              Try changing your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg shadow border border-lightGray"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-charcoal">
                      {item.author.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.communityName} •{" "}
                      {item.createdAt
                        ? typeof item.createdAt.toDate === "function"
                          ? item.createdAt.toDate().toLocaleString()
                          : typeof item.createdAt === "number"
                          ? new Date(item.createdAt).toLocaleString()
                          : "Unknown format"
                        : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {(item.flagged ||
                      (item.reports && item.reports > 0) ||
                      (item.reportedBy && item.reportedBy.length > 0)) && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <FiAlertCircle className="mr-1" />
                        {item.reports && item.reports > 0
                          ? `Reported (${item.reports})`
                          : "Reported"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {item.content.length > 200
                      ? item.content.substring(0, 200) + "..."
                      : item.content}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    className={`flex items-center px-3 py-1 ${
                      processingPosts[item.id] === "approving"
                        ? "bg-mint/70 cursor-not-allowed"
                        : "bg-mint hover:bg-purple"
                    } text-white rounded-full transition-colors`}
                    onClick={() => approvePost(item.id)}
                    disabled={!!processingPosts[item.id]}
                  >
                    {processingPosts[item.id] === "approving" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <FiCheckIcon className="mr-1" /> Approve
                      </>
                    )}
                  </button>
                  <button
                    className={`flex items-center px-3 py-1 ${
                      processingPosts[item.id] === "deleting"
                        ? "bg-red-500/70 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    } text-white rounded-full transition-colors`}
                    onClick={() => deletePost(item.id)}
                    disabled={!!processingPosts[item.id]}
                  >
                    {processingPosts[item.id] === "deleting" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="mr-1" /> Delete
                      </>
                    )}
                  </button>
                  <button
                    className={`flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors ${
                      !!processingPosts[item.id]
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() =>
                      window.open(`/content/post/${item.id}`, "_blank")
                    }
                    disabled={!!processingPosts[item.id]}
                  >
                    <FiEyeIcon className="mr-1" /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationPage;
