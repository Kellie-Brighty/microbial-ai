import React, { useEffect, useState } from "react";
import { useCommunity } from "../../context/CommunityContext";
import Post from "./Post";

interface PostListProps {
  communityId: string;
}

const PostList: React.FC<PostListProps> = ({ communityId }) => {
  const { posts, isLoading, loadPostsForCommunity } = useCommunity();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Initial load of posts
    const loadPosts = async () => {
      await loadPostsForCommunity(communityId);
    };

    loadPosts();
  }, [communityId, loadPostsForCommunity]);

  const handleRefresh = async () => {
    await loadPostsForCommunity(communityId);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-md">
        <h3 className="text-xl font-semibold mb-4">No posts yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to share something with this community!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Posts</h2>
        <button
          onClick={handleRefresh}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>

      {posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={async () => {
              if (posts.length === 0) return;

              setLoadingMore(true);
              try {
                // Load more posts passing the last post ID
                // This would need to be implemented in the context
                // const lastPostId = posts[posts.length - 1].id;
                // await loadMorePosts(communityId, lastPostId);
              } catch (error) {
                console.error("Error loading more posts:", error);
              } finally {
                setLoadingMore(false);
              }
            }}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md disabled:opacity-50"
            disabled={loadingMore || isLoading}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList;
