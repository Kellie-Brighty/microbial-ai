import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  joinCommunityAnonymously,
  leaveCommunity,
  getAnonymousId,
  CommunityPost,
  PostComment,
  CommentReply,
  createPost,
  getPosts,
  likePost,
  addComment,
  getComments,
  likeComment,
  addReply,
  getReplies,
  likeReply,
  reportPost,
  getReportedPosts,
  deletePost,
} from "../utils/communityModel";

interface CommunityContextType {
  anonymousId: string | null;
  isLoading: boolean;
  hasMembership: boolean;
  posts: CommunityPost[];
  commentsByPostId: Record<string, PostComment[]>;
  repliesByCommentId: Record<string, CommentReply[]>;
  joinCommunity: (communityId: string) => Promise<boolean>;
  leaveCurrentCommunity: () => Promise<boolean>;
  createNewPost: (content: string, image?: File) => Promise<string>;
  loadPostsForCommunity: (communityId: string) => Promise<CommunityPost[]>;
  toggleLikePost: (postId: string) => Promise<void>;
  commentOnPost: (postId: string, content: string) => Promise<string>;
  loadCommentsForPost: (postId: string) => Promise<PostComment[]>;
  toggleLikeComment: (commentId: string) => Promise<void>;
  replyToComment: (commentId: string, content: string) => Promise<string>;
  loadRepliesForComment: (commentId: string) => Promise<CommentReply[]>;
  toggleLikeReply: (replyId: string) => Promise<void>;
  reportPostContent: (postId: string) => Promise<void>;
  getReportedPostsForAdmin: (
    minReportCount?: number
  ) => Promise<CommunityPost[]>;
  deletePostAsAdmin: (postId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | null>(null);

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
};

export const CommunityProvider: React.FC<{
  children: ReactNode;
  initialCommunityId?: string;
}> = ({ children, initialCommunityId }) => {
  const { currentUser } = useAuth();
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(
    initialCommunityId || null
  );
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMembership, setHasMembership] = useState<boolean>(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<string, PostComment[]>
  >({});
  const [repliesByCommentId, setRepliesByCommentId] = useState<
    Record<string, CommentReply[]>
  >({});

  // Load anonymous ID when user and community ID change
  useEffect(() => {
    const loadAnonymousId = async () => {
      if (!currentUser || !currentCommunityId) {
        setAnonymousId(null);
        setHasMembership(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const id = await getAnonymousId(currentUser.uid, currentCommunityId);
        setAnonymousId(id);
        setHasMembership(!!id);
      } catch (error) {
        console.error("Error loading anonymous ID:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnonymousId();
  }, [currentUser, currentCommunityId]);

  const joinCommunity = async (communityId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      setIsLoading(true);
      const newAnonymousId = await joinCommunityAnonymously(
        currentUser.uid,
        communityId
      );
      setAnonymousId(newAnonymousId);
      setCurrentCommunityId(communityId);
      setHasMembership(true);
      return true;
    } catch (error) {
      console.error("Error joining community:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCurrentCommunity = async (): Promise<boolean> => {
    if (!currentUser || !currentCommunityId) return false;

    try {
      setIsLoading(true);
      const success = await leaveCommunity(currentUser.uid, currentCommunityId);
      if (success) {
        setAnonymousId(null);
        setHasMembership(false);
      }
      return success;
    } catch (error) {
      console.error("Error leaving community:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPost = async (
    content: string,
    image?: File
  ): Promise<string> => {
    if (!currentUser || !anonymousId || !currentCommunityId) {
      throw new Error("User must be a member of a community to post");
    }

    try {
      const postId = await createPost(
        anonymousId,
        currentCommunityId,
        content,
        image
      );

      // Refresh posts after creating a new one
      await loadPostsForCommunity(currentCommunityId);

      return postId;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  };

  const loadPostsForCommunity = async (
    communityId: string
  ): Promise<CommunityPost[]> => {
    try {
      setCurrentCommunityId(communityId);
      const fetchedPosts = await getPosts(communityId);
      setPosts(fetchedPosts);
      return fetchedPosts;
    } catch (error) {
      console.error("Error loading posts:", error);
      return [];
    }
  };

  const toggleLikePost = async (postId: string): Promise<void> => {
    if (!anonymousId) {
      throw new Error("User must be a member to like posts");
    }

    try {
      await likePost(postId, anonymousId);

      // Update local posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const userLiked = post.likedBy.includes(anonymousId);
            return {
              ...post,
              likes: userLiked ? post.likes - 1 : post.likes + 1,
              likedBy: userLiked
                ? post.likedBy.filter((id) => id !== anonymousId)
                : [...post.likedBy, anonymousId],
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  };

  const commentOnPost = async (
    postId: string,
    content: string
  ): Promise<string> => {
    if (!anonymousId) {
      throw new Error("User must be a member to comment");
    }

    try {
      const commentId = await addComment(postId, anonymousId, content);

      // Update posts comment count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );

      // Refresh comments for this post
      await loadCommentsForPost(postId);

      return commentId;
    } catch (error) {
      console.error("Error commenting on post:", error);
      throw error;
    }
  };

  const loadCommentsForPost = async (
    postId: string
  ): Promise<PostComment[]> => {
    try {
      const comments = await getComments(postId);

      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: comments,
      }));

      return comments;
    } catch (error) {
      console.error("Error loading comments:", error);
      return [];
    }
  };

  const toggleLikeComment = async (commentId: string): Promise<void> => {
    if (!anonymousId) {
      throw new Error("User must be a member to like comments");
    }

    try {
      await likeComment(commentId, anonymousId);

      // Update local comments state
      setCommentsByPostId((prevCommentsByPostId) => {
        const newCommentsByPostId = { ...prevCommentsByPostId };

        for (const postId in newCommentsByPostId) {
          newCommentsByPostId[postId] = newCommentsByPostId[postId].map(
            (comment) => {
              if (comment.id === commentId) {
                const userLiked = comment.likedBy.includes(anonymousId);
                return {
                  ...comment,
                  likes: userLiked ? comment.likes - 1 : comment.likes + 1,
                  likedBy: userLiked
                    ? comment.likedBy.filter((id) => id !== anonymousId)
                    : [...comment.likedBy, anonymousId],
                };
              }
              return comment;
            }
          );
        }

        return newCommentsByPostId;
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      throw error;
    }
  };

  const replyToComment = async (
    commentId: string,
    content: string
  ): Promise<string> => {
    if (!anonymousId) {
      throw new Error("User must be a member to reply");
    }

    try {
      const replyId = await addReply(commentId, anonymousId, content);

      // Update comment reply count
      setCommentsByPostId((prevCommentsByPostId) => {
        const newCommentsByPostId = { ...prevCommentsByPostId };

        for (const postId in newCommentsByPostId) {
          newCommentsByPostId[postId] = newCommentsByPostId[postId].map(
            (comment) =>
              comment.id === commentId
                ? { ...comment, replyCount: comment.replyCount + 1 }
                : comment
          );
        }

        return newCommentsByPostId;
      });

      // Refresh replies for this comment
      await loadRepliesForComment(commentId);

      return replyId;
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  };

  const loadRepliesForComment = async (
    commentId: string
  ): Promise<CommentReply[]> => {
    try {
      const replies = await getReplies(commentId);

      setRepliesByCommentId((prev) => ({
        ...prev,
        [commentId]: replies,
      }));

      return replies;
    } catch (error) {
      console.error("Error loading replies:", error);
      return [];
    }
  };

  const toggleLikeReply = async (replyId: string): Promise<void> => {
    if (!anonymousId) {
      throw new Error("User must be a member to like replies");
    }

    try {
      await likeReply(replyId, anonymousId);

      // Update local replies state
      setRepliesByCommentId((prevRepliesByCommentId) => {
        const newRepliesByCommentId = { ...prevRepliesByCommentId };

        for (const commentId in newRepliesByCommentId) {
          newRepliesByCommentId[commentId] = newRepliesByCommentId[
            commentId
          ].map((reply) => {
            if (reply.id === replyId) {
              const userLiked = reply.likedBy.includes(anonymousId);
              return {
                ...reply,
                likes: userLiked ? reply.likes - 1 : reply.likes + 1,
                likedBy: userLiked
                  ? reply.likedBy.filter((id) => id !== anonymousId)
                  : [...reply.likedBy, anonymousId],
              };
            }
            return reply;
          });
        }

        return newRepliesByCommentId;
      });
    } catch (error) {
      console.error("Error liking reply:", error);
      throw error;
    }
  };

  const reportPostContent = async (postId: string): Promise<void> => {
    if (!anonymousId) {
      throw new Error("User must be a member to report posts");
    }

    try {
      await reportPost(postId, anonymousId);

      // Update local posts state - remove post if it was auto-deleted
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error reporting post:", error);
      throw error;
    }
  };

  const getReportedPostsForAdmin = async (
    minReportCount = 1
  ): Promise<CommunityPost[]> => {
    try {
      return await getReportedPosts(minReportCount);
    } catch (error) {
      console.error("Error getting reported posts:", error);
      throw error;
    }
  };

  const deletePostAsAdmin = async (postId: string): Promise<void> => {
    try {
      await deletePost(postId);

      // Update local posts state
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  };

  const value = {
    anonymousId,
    isLoading,
    hasMembership,
    posts,
    commentsByPostId,
    repliesByCommentId,
    joinCommunity,
    leaveCurrentCommunity,
    createNewPost,
    loadPostsForCommunity,
    toggleLikePost,
    commentOnPost,
    loadCommentsForPost,
    toggleLikeComment,
    replyToComment,
    loadRepliesForComment,
    toggleLikeReply,
    reportPostContent,
    getReportedPostsForAdmin,
    deletePostAsAdmin,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};
