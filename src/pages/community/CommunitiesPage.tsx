import React, { useState, useEffect, useRef } from "react";
import {
  FaReply,
  FaRegComment,
  FaUserSecret,
  FaImage,
  FaPaperPlane,
  FaRegHeart,
  FaHeart,
  FaFlag,
  FaCheck,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import Notification, {
  NotificationType,
} from "../../components/ui/Notification";
import { db } from "../../utils/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  where,
  arrayUnion,
  increment,
  deleteDoc,
} from "firebase/firestore";

import { uploadImageToImgbb } from "../../utils/imageUpload";
import WhizparLogo from "../../assets/whizpar.png";
import { useCommunityTheme } from "../../context/CommunityThemeContext";
import DarkModeToggle from "../../components/community/DarkModeToggle";

// Interface for community posts
interface Post {
  id: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: Date;
  author: string;
  hasImage: boolean;
  imageUrl: string;
  liked: boolean;
  saved: boolean;
  tags: string[];
  likedBy: string[];
  savedBy: string[];
  reports?: string[];
  reportCount?: number;
}

// Interface for comments
interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
}

// Interface for replies
interface Reply {
  id: string;
  commentId: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
}

const CommunitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as NotificationType,
    message: "",
    isVisible: false,
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [uploadingPost, setUploadingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>(
    {}
  );
  const [commentReplies, setCommentReplies] = useState<Record<string, Reply[]>>(
    {}
  );
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [commentContent, setCommentContent] = useState<Record<string, string>>(
    {}
  );
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {}
  );
  const [commentListeners, setCommentListeners] = useState<
    Record<string, (() => void) | undefined>
  >({});
  const [replyListeners, setReplyListeners] = useState<
    Record<string, (() => void) | undefined>
  >({});

  // Add new state for the engagement modal
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);
  const [_engagementAction, setEngagementAction] = useState<
    "like" | "comment" | "post" | "report"
  >("post");

  // Add state for report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const { isDarkMode } = useCommunityTheme();

  // Fetch posts from Firebase on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const postsRef = collection(db, "anonymousPosts");
        const q = query(postsRef, orderBy("timestamp", "desc"));

        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const postsData: Post[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            postsData.push({
              id: doc.id,
              content: data.content || "",
              likes: data.likes || 0,
              comments: data.comments || 0,
              timestamp: data.timestamp?.toDate() || new Date(),
              author: data.author || "Anonymous",
              hasImage: !!data.imageUrl,
              imageUrl: data.imageUrl || "",
              liked: currentUser
                ? data.likedBy?.includes(currentUser.uid)
                : false,
              saved: currentUser
                ? data.savedBy?.includes(currentUser.uid)
                : false,
              tags: data.tags || [],
              likedBy: data.likedBy || [],
              savedBy: data.savedBy || [],
              reports: data.reports || [],
              reportCount: data.reportCount || 0,
            });
          });
          setPosts(postsData);
          setLoading(false);
        });

        // Clean up listener on unmount
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoading(false);
        showNotification("error", "Failed to load posts");
      }
    };

    fetchPosts();
  }, [currentUser]);

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("error", "Image size must be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleSelectImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open engagement modal when unauthenticated user tries to interact
  const handleUnauthenticatedAction = (
    action: "like" | "comment" | "post" | "report"
  ) => {
    if (!currentUser) {
      setEngagementAction(action);
      setEngagementModalOpen(true);
    }
  };

  // Handle report post
  const handleReportPost = (postId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("report");
      return;
    }

    setReportingPostId(postId);
    setReportModalOpen(true);
    setReportSuccess(false);
  };

  // Confirm report submission
  const confirmReport = async () => {
    if (!reportingPostId || !currentUser) return;

    try {
      setIsReporting(true);
      const postRef = doc(db, "anonymousPosts", reportingPostId);
      const post = posts.find((p) => p.id === reportingPostId);

      if (!post) return;

      // Check if user already reported this post
      if (post.reports?.includes(currentUser.uid)) {
        showNotification("error", "You've already reported this post");
        setIsReporting(false);
        return;
      }

      await updateDoc(postRef, {
        reports: arrayUnion(currentUser.uid),
        reportCount: increment(1),
      });

      setReportSuccess(true);
      showNotification("success", "Post reported successfully");

      // Auto-delete post if report count reaches 50
      const updatedPost = posts.find((p) => p.id === reportingPostId);
      if (updatedPost && (updatedPost.reportCount || 0) >= 49) {
        await deleteDoc(postRef);
      }

      // Hide report modal after 2 seconds
      setTimeout(() => {
        setReportModalOpen(false);
        setReportingPostId(null);
        setReportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error reporting post:", error);
      showNotification("error", "Failed to report post");
    } finally {
      setIsReporting(false);
    }
  };

  // Cancel report
  const cancelReport = () => {
    setReportModalOpen(false);
    setReportingPostId(null);
  };

  // Create a new post with Firebase
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      handleUnauthenticatedAction("post");
      return;
    }

    if (!newPostContent.trim() && !selectedImage) {
      showNotification("error", "Post must have text or an image");
      return;
    }

    try {
      setUploadingPost(true);

      // Generate tags from content
      const contentText = newPostContent.trim();
      const hashtagRegex = /#(\w+)/g;
      const matches = contentText.match(hashtagRegex) || [];
      const tags = matches.map((tag) => tag.substring(1));

      let imageUrl = "";

      // Upload image if selected
      if (selectedImage) {
        // Use imgbb instead of Firebase Storage
        imageUrl = await uploadImageToImgbb(selectedImage);
      }

      // Create post document
      await addDoc(collection(db, "anonymousPosts"), {
        content: contentText,
        likes: 0,
        comments: 0,
        timestamp: serverTimestamp(),
        author: "Anonymous_" + Math.floor(Math.random() * 10000),
        imageUrl,
        tags,
        likedBy: [],
        savedBy: [],
        reports: [],
        reportCount: 0,
        userId: currentUser.uid, // Store the user ID privately (not displayed)
      });

      // Reset form
      setNewPostContent("");
      setSelectedImage(null);
      setImagePreview(null);

      showNotification("success", "Posted successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      showNotification("error", "Failed to create post");
    } finally {
      setUploadingPost(false);
    }
  };

  // Like a post with Firebase
  const handleLike = async (postId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("like");
      return;
    }

    try {
      const postRef = doc(db, "anonymousPosts", postId);
      const post = posts.find((p) => p.id === postId);

      if (!post) return;

      let newLikedBy = [...post.likedBy];
      let newLikesCount = post.likes;

      if (post.liked) {
        // Unlike
        newLikedBy = newLikedBy.filter((uid) => uid !== currentUser.uid);
        newLikesCount--;
      } else {
        // Like
        newLikedBy.push(currentUser.uid);
        newLikesCount++;
      }

      await updateDoc(postRef, {
        likedBy: newLikedBy,
        likes: newLikesCount,
      });
    } catch (error) {
      console.error("Error updating like:", error);
      showNotification("error", "Failed to update like");
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const toggleExpandPost = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
    }
  };

  // Toggle comments visibility for a post
  const toggleComments = async (postId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("comment");
      return;
    }

    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter((id) => id !== postId));

      // Clean up any listeners when collapsing
      if (commentListeners[postId]) {
        commentListeners[postId]();
        setCommentListeners({
          ...commentListeners,
          [postId]: undefined,
        });
      }
    } else {
      setExpandedComments([...expandedComments, postId]);

      // Always load comments when expanding
      await loadComments(postId);
    }
  };

  // Load comments for a post with real-time updates
  const loadComments = async (postId: string) => {
    // Cancel any existing listener for this post
    if (commentListeners[postId]) {
      commentListeners[postId]();
    }

    try {
      setLoadingComments({ ...loadingComments, [postId]: true });

      const commentsRef = collection(db, "postComments");
      const q = query(commentsRef, where("postId", "==", postId));

      // Set up a real-time listener for comments
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const comments: Comment[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
              id: doc.id,
              postId: data.postId,
              content: data.content,
              author:
                data.author || "Anonymous_" + data.userId?.substring(0, 4),
              timestamp: data.timestamp?.toDate() || new Date(),
              likes: data.likes || 0,
              likedBy: data.likedBy || [],
            });
          });

          // Sort comments client-side
          comments.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );

          setPostComments({ ...postComments, [postId]: comments });
          setLoadingComments({ ...loadingComments, [postId]: false });
        },
        (error) => {
          console.error("Error in comments listener:", error);
          setLoadingComments({ ...loadingComments, [postId]: false });
        }
      );

      // Store the unsubscribe function for cleanup
      setCommentListeners({ ...commentListeners, [postId]: unsubscribe });
    } catch (error) {
      console.error("Error loading comments:", error);
      showNotification("error", "Failed to load comments");
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  // Toggle replies visibility for a comment
  const toggleReplies = async (commentId: string) => {
    if (expandedReplies.includes(commentId)) {
      setExpandedReplies(expandedReplies.filter((id) => id !== commentId));

      // Clean up any listeners when collapsing
      if (replyListeners[commentId]) {
        replyListeners[commentId]();
        setReplyListeners({
          ...replyListeners,
          [commentId]: undefined,
        });
      }
    } else {
      setExpandedReplies([...expandedReplies, commentId]);

      // Always load replies when expanding
      await loadReplies(commentId);
    }
  };

  // Load replies for a comment with real-time updates
  const loadReplies = async (commentId: string) => {
    // Cancel any existing listener for this comment
    if (replyListeners[commentId]) {
      replyListeners[commentId]();
    }

    try {
      setLoadingReplies({ ...loadingReplies, [commentId]: true });

      const repliesRef = collection(db, "commentReplies");
      const q = query(repliesRef, where("commentId", "==", commentId));

      // Set up a real-time listener for replies
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const replies: Reply[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            replies.push({
              id: doc.id,
              commentId: data.commentId,
              content: data.content,
              author:
                data.author || "Anonymous_" + data.userId?.substring(0, 4),
              timestamp: data.timestamp?.toDate() || new Date(),
              likes: data.likes || 0,
              likedBy: data.likedBy || [],
            });
          });

          // Sort replies client-side
          replies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          setCommentReplies({ ...commentReplies, [commentId]: replies });
          setLoadingReplies({ ...loadingReplies, [commentId]: false });
        },
        (error) => {
          console.error("Error in replies listener:", error);
          setLoadingReplies({ ...loadingReplies, [commentId]: false });
        }
      );

      // Store the unsubscribe function for cleanup
      setReplyListeners({ ...replyListeners, [commentId]: unsubscribe });
    } catch (error) {
      console.error("Error loading replies:", error);
      showNotification("error", "Failed to load replies");
      setLoadingReplies({ ...loadingReplies, [commentId]: false });
    }
  };

  // Clean up all listeners when component unmounts
  useEffect(() => {
    return () => {
      // Clean up comment listeners
      Object.values(commentListeners).forEach((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });

      // Clean up reply listeners
      Object.values(replyListeners).forEach((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [commentListeners, replyListeners]);

  // Modify the addComment function to not need to reload since we have real-time listeners
  const addComment = async (postId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("comment");
      return;
    }

    const content = commentContent[postId];
    if (!content?.trim()) return;

    try {
      const anonymousName = "Anonymous_" + Math.floor(Math.random() * 10000);

      const commentData = {
        postId,
        content,
        userId: currentUser.uid,
        author: anonymousName,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [],
      };

      // Add the comment to Firestore
      await addDoc(collection(db, "postComments"), commentData);

      // Update post's comment count
      const postRef = doc(db, "anonymousPosts", postId);
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const newCommentCount = (post.comments || 0) + 1;
        await updateDoc(postRef, {
          comments: newCommentCount,
        });

        // Update local posts state to reflect new comment count
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, comments: newCommentCount } : p
          )
        );
      }

      // Clear the comment input
      setCommentContent({ ...commentContent, [postId]: "" });

      // No need to manually add to state or reload since we have real-time listeners

      showNotification("success", "Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      showNotification("error", "Failed to add comment");
    }
  };

  // Modify the addReply function similarly
  const addReply = async (commentId: string, _postId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("comment");
      return;
    }

    const content = replyContent[commentId];
    if (!content?.trim()) return;

    try {
      const anonymousName = "Anonymous_" + Math.floor(Math.random() * 10000);

      const replyData = {
        commentId,
        content,
        userId: currentUser.uid,
        author: anonymousName,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [],
      };

      // Add the reply to Firestore
      await addDoc(collection(db, "commentReplies"), replyData);

      // Clear the reply input
      setReplyContent({ ...replyContent, [commentId]: "" });

      // No need to manually add to state or reload since we have real-time listeners

      showNotification("success", "Reply added");
    } catch (error) {
      console.error("Error adding reply:", error);
      showNotification("error", "Failed to add reply");
    }
  };

  // Like a comment
  const likeComment = async (commentId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("comment");
      return;
    }

    try {
      // Find the comment in our state
      let foundComment: Comment | undefined;
      let postId: string | undefined;

      for (const [pId, comments] of Object.entries(postComments)) {
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          foundComment = comment;
          postId = pId;
          break;
        }
      }

      if (!foundComment || !postId) return;

      // Check if the user already liked this comment
      const userLiked = foundComment.likedBy.includes(currentUser.uid);
      const commentRef = doc(db, "postComments", commentId);

      if (userLiked) {
        // Unlike
        await updateDoc(commentRef, {
          likes: foundComment.likes - 1,
          likedBy: foundComment.likedBy.filter((id) => id !== currentUser.uid),
        });
      } else {
        // Like
        await updateDoc(commentRef, {
          likes: foundComment.likes + 1,
          likedBy: [...foundComment.likedBy, currentUser.uid],
        });
      }

      // Update local state
      setPostComments({
        ...postComments,
        [postId]: postComments[postId].map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              likes: userLiked ? c.likes - 1 : c.likes + 1,
              likedBy: userLiked
                ? c.likedBy.filter((id) => id !== currentUser.uid)
                : [...c.likedBy, currentUser.uid],
            };
          }
          return c;
        }),
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      showNotification("error", "Failed to like comment");
    }
  };

  // Like a reply
  const likeReply = async (replyId: string) => {
    if (!currentUser) {
      handleUnauthenticatedAction("comment");
      return;
    }

    try {
      // Find the reply in our state
      let foundReply: Reply | undefined;
      let commentId: string | undefined;

      for (const [cId, replies] of Object.entries(commentReplies)) {
        const reply = replies.find((r) => r.id === replyId);
        if (reply) {
          foundReply = reply;
          commentId = cId;
          break;
        }
      }

      if (!foundReply || !commentId) return;

      // Check if the user already liked this reply
      const userLiked = foundReply.likedBy.includes(currentUser.uid);
      const replyRef = doc(db, "commentReplies", replyId);

      if (userLiked) {
        // Unlike
        await updateDoc(replyRef, {
          likes: foundReply.likes - 1,
          likedBy: foundReply.likedBy.filter((id) => id !== currentUser.uid),
        });
      } else {
        // Like
        await updateDoc(replyRef, {
          likes: foundReply.likes + 1,
          likedBy: [...foundReply.likedBy, currentUser.uid],
        });
      }

      // Update local state
      setCommentReplies({
        ...commentReplies,
        [commentId]: commentReplies[commentId].map((r) => {
          if (r.id === replyId) {
            return {
              ...r,
              likes: userLiked ? r.likes - 1 : r.likes + 1,
              likedBy: userLiked
                ? r.likedBy.filter((id) => id !== currentUser.uid)
                : [...r.likedBy, currentUser.uid],
            };
          }
          return r;
        }),
      });
    } catch (error) {
      console.error("Error liking reply:", error);
      showNotification("error", "Failed to like reply");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white dark:bg-white dark:text-gray-900">
      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(message) => showNotification("success", message)}
        />
      )}

      {/* Engagement Modal for unauthenticated users */}
      {engagementModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75"></div>

          {/* Modal content */}
          <div
            className={`relative w-full max-w-md p-6 mx-4 rounded-lg shadow-xl overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center">
                  <img
                    src={WhizparLogo}
                    alt="Whizpar"
                    className="w-10 h-10 text-white"
                  />
                </div>
              </div>

              <h3
                className={`text-xl font-bold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Join to Like Posts
              </h3>

              <p
                className={`mb-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Sign in to like posts and show appreciation for content that
                resonates with you.
              </p>

              <div
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                } rounded-lg p-4 mb-6`}
              >
                <h4
                  className={`text-md font-medium mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Why join Whizpar?
                </h4>

                <ul className="space-y-3 text-left">
                  <li className="flex items-start">
                    <span className="bg-green-400 p-1 rounded mr-2 text-white">
                      🔒
                    </span>
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Share your thoughts anonymously without fear of judgment
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-400 p-1 rounded mr-2 text-white">
                      👥
                    </span>
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Connect with researchers who share your interests
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-400 p-1 rounded mr-2 text-white">
                      💬
                    </span>
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Get feedback and insights from peers worldwide
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  className="w-full py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors"
                  onClick={() => {
                    setEngagementModalOpen(false);
                    setAuthModalOpen(true);
                  }}
                >
                  Sign in to continue
                </button>

                <button
                  className={`w-full py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setEngagementModalOpen(false)}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* Header */}
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

      {/* Position the dark mode toggle in a better location */}
      <div className="absolute top-24 right-8 z-10">
        <DarkModeToggle />
      </div>

      {/* Hero Section */}
      <div
        className={`relative pt-16 md:pt-20 text-white ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-800 to-purple-900"
            : "bg-gradient-to-br from-mint to-purple"
        }`}
      >
        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-4">
            <div
              className={`inline-flex items-center ${
                isDarkMode ? "bg-gray-700" : "bg-white"
              } ${
                isDarkMode ? "bg-opacity-30" : "bg-opacity-20"
              } backdrop-filter backdrop-blur-md rounded-full px-4 py-1 mb-4`}
            >
              <img src={WhizparLogo} alt="Whizpar Logo" className="h-5 mr-2" />
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Powered by Whizpar
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
              The Anonymous Lounge
            </h1>
            <p className="text-lg text-white mb-0 max-w-2xl">
              Where scientists speak freely. Share your thoughts, memes, and
              candid lab stories - all anonymously!
            </p>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-10 sm:h-16"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0Z"
              fill={isDarkMode ? "#111827" : "#f9fafb"}
            ></path>
          </svg>
        </div>
      </div>

      {/* Community Feed Section */}
      <div className={`py-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main content area */}
            <div className="md:w-8/12">
              {/* Post creation card */}
              <div
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-sm p-6 mb-6`}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-mint to-purple flex items-center justify-center text-white mr-3">
                    <FaUserSecret />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${
                        isDarkMode ? "text-gray-100" : "text-charcoal"
                      }`}
                    >
                      Share Anonymously
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Your identity is completely hidden
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3">
                  <textarea
                    className={`w-full border text-gray-700 ${
                      isDarkMode
                        ? "border-gray-600 text-gray-700 placeholder-gray-400"
                        : "border-gray-200 bg-white"
                    } rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-mint resize-none`}
                    placeholder={
                      currentUser
                        ? "What's on your mind? Share your lab stories, memes, or ask that question you've been afraid to ask..."
                        : "Sign in to post anonymously..."
                    }
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={!currentUser || uploadingPost}
                  ></textarea>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={`absolute -top-2 -right-2 ${
                          isDarkMode ? "bg-gray-800" : "bg-white"
                        } rounded-full p-1 shadow-md hover:bg-gray-100`}
                        disabled={uploadingPost}
                      >
                        <MdClose className="text-gray-600" />
                      </button>
                    </div>
                  )}

                  <div
                    className={`flex justify-between items-center pt-2 border-t ${
                      isDarkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        disabled={!currentUser || uploadingPost}
                      />
                      <button
                        type="button"
                        onClick={handleSelectImageClick}
                        className={`p-2 rounded-full ${
                          isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-500 hover:bg-gray-100"
                        } ${
                          !currentUser || uploadingPost
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:text-mint"
                        }`}
                        disabled={!currentUser || uploadingPost}
                      >
                        <FaImage className="text-lg" />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className={`px-5 py-2 rounded-full font-medium text-white flex items-center ${
                        currentUser && !uploadingPost
                          ? "bg-mint hover:bg-purple transition-colors"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      disabled={!currentUser || uploadingPost}
                      onClick={
                        currentUser
                          ? undefined
                          : () => handleUnauthenticatedAction("post")
                      }
                    >
                      {uploadingPost ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Posting...
                        </>
                      ) : currentUser ? (
                        <>
                          <FaPaperPlane className="mr-2" />
                          Post Anonymously
                        </>
                      ) : (
                        "Sign in to Post"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Recent posts header */}
              <div className="flex justify-between items-center mb-4">
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-charcoal"
                  }`}
                >
                  Anonymous Discussions
                </h2>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-mint border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Loading posts...
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!loading && posts.length === 0 && (
                <div
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-sm p-8 text-center`}
                >
                  <div className="text-6xl mb-4">🤫</div>
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-gray-100" : "text-charcoal"
                    } mb-2`}
                  >
                    No Posts Yet
                  </h3>
                  <p
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } mb-6`}
                  >
                    Be the first to share something in the Anonymous Lounge!
                  </p>
                  {!currentUser && (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="bg-mint hover:bg-purple text-white px-6 py-2 rounded-full transition-colors"
                    >
                      Sign in to Post
                    </button>
                  )}
                </div>
              )}

              {/* Posts feed */}
              {!loading && (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className={`${
                        isDarkMode ? "bg-gray-800" : "bg-white"
                      } rounded-xl shadow-sm overflow-hidden`}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 ${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                } rounded-full flex items-center justify-center ${
                                  isDarkMode ? "text-gray-300" : "text-gray-500"
                                } mr-3`}
                              >
                                <FaUserSecret />
                              </div>
                              <div>
                                <h4
                                  className={`font-medium ${
                                    isDarkMode
                                      ? "text-gray-100"
                                      : "text-charcoal"
                                  }`}
                                >
                                  {post.author}
                                </h4>
                                <span
                                  className={`text-xs ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {formatRelativeTime(post.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p
                            className={`${
                              isDarkMode ? "text-gray-100" : "text-gray-800"
                            } ${
                              !expandedPostId || expandedPostId !== post.id
                                ? "line-clamp-4"
                                : ""
                            }`}
                          >
                            {post.content}
                          </p>
                          {post.content.length > 280 && (
                            <button
                              className="text-mint hover:text-purple text-sm mt-1"
                              onClick={() => toggleExpandPost(post.id)}
                            >
                              {expandedPostId === post.id
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>

                        {/* Post tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className={`${
                                  isDarkMode
                                    ? "bg-gray-700 text-gray-200"
                                    : "bg-gray-100 text-gray-600"
                                } px-2 py-1 rounded-full text-xs hover:bg-gray-200 cursor-pointer`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Post image */}
                        {post.hasImage && (
                          <div className="mt-3 mb-3 rounded-xl overflow-hidden">
                            <img
                              src={post.imageUrl}
                              alt="Post content"
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between text-sm ${
                            isDarkMode
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-500 border-gray-100"
                          } border-t pt-3 mt-1`}
                        >
                          <div className="flex items-center space-x-4">
                            <button
                              className={`flex items-center hover:text-mint transition-colors ${
                                !currentUser ? "opacity-70" : ""
                              }`}
                              onClick={() =>
                                currentUser
                                  ? handleLike(post.id)
                                  : handleUnauthenticatedAction("like")
                              }
                            >
                              {post.liked ? (
                                <FaHeart className="mr-1 text-red-500" />
                              ) : (
                                <FaRegHeart className="mr-1" />
                              )}
                              {post.likes}
                            </button>
                            <button
                              className={`flex items-center hover:text-mint transition-colors ${
                                !currentUser ? "opacity-70" : ""
                              }`}
                              onClick={() => toggleComments(post.id)}
                            >
                              <FaRegComment className="mr-1" /> {post.comments}
                            </button>
                          </div>

                          {/* Report Button */}
                          <button
                            className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                              isDarkMode
                                ? "bg-gray-700 hover:bg-gray-600 text-red-400 hover:text-red-300"
                                : "bg-gray-100 hover:bg-gray-200 text-red-500 hover:text-red-600"
                            } ${!currentUser ? "opacity-70" : ""}`}
                            onClick={() =>
                              currentUser
                                ? handleReportPost(post.id)
                                : handleUnauthenticatedAction("report")
                            }
                            title="Report inappropriate content"
                          >
                            <FaFlag className="mr-1" size={14} />
                            <span className="text-sm">Report</span>
                          </button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments.includes(post.id) && (
                          <div
                            className={`border-t ${
                              isDarkMode
                                ? "border-gray-700 bg-gray-700"
                                : "border-gray-100 bg-gray-50"
                            } px-3 sm:px-6 py-4`}
                          >
                            <h4
                              className={`font-medium ${
                                isDarkMode ? "text-gray-100" : "text-gray-700"
                              } mb-4`}
                            >
                              Comments
                            </h4>

                            {/* Add Comment Form */}
                            <div className="flex items-start sm:items-center mb-6">
                              <div
                                className={`w-8 h-8 ${
                                  isDarkMode
                                    ? "bg-gray-600 text-gray-300"
                                    : "bg-gray-200 text-gray-500"
                                } rounded-full flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3 mt-1 sm:mt-0`}
                              >
                                <FaUserSecret />
                              </div>
                              <div className="flex-1 flex flex-col sm:flex-row">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  className={`flex-1 border text-gray-700 ${
                                    isDarkMode
                                      ? "border-gray-600 text-gray-700 placeholder-gray-400"
                                      : "border-gray-200 bg-white placeholder-gray-400"
                                  } rounded-lg sm:rounded-l-lg sm:rounded-r-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-mint text-sm`}
                                  value={commentContent[post.id] || ""}
                                  onChange={(e) =>
                                    setCommentContent({
                                      ...commentContent,
                                      [post.id]: e.target.value,
                                    })
                                  }
                                  disabled={!currentUser}
                                />
                                <button
                                  className={`mt-2 sm:mt-0 px-3 py-2 rounded-lg sm:rounded-l-none sm:rounded-r-lg transition-colors text-sm ${
                                    currentUser &&
                                    (commentContent[post.id]?.trim() || "")
                                      ? "bg-mint text-white hover:bg-mint/90"
                                      : `${
                                          isDarkMode
                                            ? "bg-gray-600 text-gray-400"
                                            : "bg-gray-200 text-gray-500"
                                        } cursor-not-allowed`
                                  }`}
                                  onClick={() => addComment(post.id)}
                                  disabled={
                                    !currentUser ||
                                    !(commentContent[post.id]?.trim() || "")
                                  }
                                >
                                  <span className="sm:hidden mr-1">Send</span>
                                  <FaPaperPlane className="inline sm:block" />
                                </button>
                              </div>
                            </div>

                            {/* Comments List */}
                            {loadingComments[post.id] ? (
                              <div className="text-center py-6">
                                <div className="inline-block w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
                                <p
                                  className={`${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-500"
                                  } mt-2`}
                                >
                                  Loading comments...
                                </p>
                              </div>
                            ) : postComments[post.id]?.length ? (
                              <div className="space-y-5">
                                {postComments[post.id].map((comment) => (
                                  <div
                                    key={comment.id}
                                    className={`border-l-2 ${
                                      isDarkMode
                                        ? "border-gray-600 pl-3 sm:pl-4 py-2 hover:bg-gray-600/50"
                                        : "border-gray-300 pl-3 sm:pl-4 py-2 hover:bg-gray-100/50"
                                    } rounded-r-lg transition-colors`}
                                  >
                                    <div className="flex items-start">
                                      <div
                                        className={`w-6 sm:w-7 h-6 sm:h-7 ${
                                          isDarkMode
                                            ? "bg-gray-600 text-gray-300"
                                            : "bg-gray-200 text-gray-500"
                                        } rounded-full flex-shrink-0 flex items-center justify-center mr-2 text-xs`}
                                      >
                                        <FaUserSecret />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center mb-1">
                                          <span
                                            className={`font-medium text-sm ${
                                              isDarkMode
                                                ? "text-gray-200"
                                                : "text-gray-800"
                                            } mr-2 break-all`}
                                          >
                                            {comment.author}
                                          </span>
                                          <span
                                            className={`text-xs ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {formatRelativeTime(
                                              comment.timestamp
                                            )}
                                          </span>
                                        </div>
                                        <p
                                          className={`text-sm ${
                                            isDarkMode
                                              ? "text-gray-200"
                                              : "text-gray-800"
                                          } mb-2 break-words`}
                                        >
                                          {comment.content}
                                        </p>

                                        {/* Comment Actions */}
                                        <div className="flex items-center mt-1 space-x-4">
                                          <button
                                            className={`text-xs flex items-center hover:text-mint transition-colors ${
                                              comment.likedBy.includes(
                                                currentUser?.uid || ""
                                              )
                                                ? "text-red-500"
                                                : isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                              likeComment(comment.id)
                                            }
                                            disabled={!currentUser}
                                          >
                                            {comment.likedBy.includes(
                                              currentUser?.uid || ""
                                            ) ? (
                                              <FaHeart
                                                className="mr-1"
                                                size={12}
                                              />
                                            ) : (
                                              <FaRegHeart
                                                className="mr-1"
                                                size={12}
                                              />
                                            )}
                                            <span>{comment.likes}</span>
                                          </button>
                                          <button
                                            className={`text-xs ${
                                              isDarkMode
                                                ? "text-gray-300 hover:text-mint"
                                                : "text-gray-500 hover:text-mint"
                                            } transition-colors flex items-center`}
                                            onClick={() =>
                                              toggleReplies(comment.id)
                                            }
                                          >
                                            <FaReply
                                              className="mr-1"
                                              size={12}
                                            />
                                            <span>Reply</span>
                                          </button>
                                        </div>

                                        {/* Reply Section */}
                                        {expandedReplies.includes(
                                          comment.id
                                        ) && (
                                          <div className="mt-3 pl-2 sm:pl-4">
                                            {/* Reply Form */}
                                            <div className="flex items-start mb-3">
                                              <div
                                                className={`w-5 h-5 ${
                                                  isDarkMode
                                                    ? "bg-gray-600 text-gray-300"
                                                    : "bg-gray-200 text-gray-500"
                                                } rounded-full flex-shrink-0 flex items-center justify-center mr-2 text-xs mt-1`}
                                              >
                                                <FaUserSecret />
                                              </div>
                                              <div className="flex-1 flex flex-col sm:flex-row">
                                                <input
                                                  type="text"
                                                  placeholder="Write a reply..."
                                                  className={`flex-1 border text-gray-700 ${
                                                    isDarkMode
                                                      ? "border-gray-600 text-gray-700 placeholder-gray-400"
                                                      : "border-gray-200 bg-white placeholder-gray-400"
                                                  } rounded-lg sm:rounded-l-lg sm:rounded-r-none px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-mint`}
                                                  value={
                                                    replyContent[comment.id] ||
                                                    ""
                                                  }
                                                  onChange={(e) =>
                                                    setReplyContent({
                                                      ...replyContent,
                                                      [comment.id]:
                                                        e.target.value,
                                                    })
                                                  }
                                                  disabled={!currentUser}
                                                />
                                                <button
                                                  className={`mt-2 sm:mt-0 px-2 py-1 rounded-lg sm:rounded-l-none sm:rounded-r-lg text-xs transition-colors ${
                                                    currentUser &&
                                                    (replyContent[
                                                      comment.id
                                                    ]?.trim() ||
                                                      "")
                                                      ? "bg-mint text-white hover:bg-mint/90"
                                                      : `${
                                                          isDarkMode
                                                            ? "bg-gray-600 text-gray-400"
                                                            : "bg-gray-200 text-gray-500"
                                                        } cursor-not-allowed`
                                                  }`}
                                                  onClick={() =>
                                                    addReply(
                                                      comment.id,
                                                      post.id
                                                    )
                                                  }
                                                  disabled={
                                                    !currentUser ||
                                                    !(
                                                      replyContent[
                                                        comment.id
                                                      ]?.trim() || ""
                                                    )
                                                  }
                                                >
                                                  <span className="sm:hidden mr-1 text-xs">
                                                    Reply
                                                  </span>
                                                  <FaPaperPlane
                                                    className="inline sm:block"
                                                    size={12}
                                                  />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Replies List */}
                                            {loadingReplies[comment.id] ? (
                                              <div className="text-center py-3">
                                                <div className="inline-block w-4 h-4 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
                                              </div>
                                            ) : commentReplies[comment.id]
                                                ?.length ? (
                                              <div className="space-y-3">
                                                {commentReplies[comment.id].map(
                                                  (reply) => (
                                                    <div
                                                      key={reply.id}
                                                      className={`border-l-2 ${
                                                        isDarkMode
                                                          ? "border-gray-600 pl-2 sm:pl-3 py-1 hover:bg-gray-600/50"
                                                          : "border-gray-200 pl-2 sm:pl-3 py-1 hover:bg-gray-100/50"
                                                      } rounded-r-lg transition-colors`}
                                                    >
                                                      <div className="flex items-start">
                                                        <div
                                                          className={`w-4 sm:w-5 h-4 sm:h-5 ${
                                                            isDarkMode
                                                              ? "bg-gray-600 text-gray-300"
                                                              : "bg-gray-200 text-gray-500"
                                                          } rounded-full flex-shrink-0 flex items-center justify-center mr-2 text-xs`}
                                                        >
                                                          <FaUserSecret />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex flex-wrap items-center mb-1">
                                                            <span
                                                              className={`font-medium text-xs ${
                                                                isDarkMode
                                                                  ? "text-gray-200"
                                                                  : "text-gray-700"
                                                              } mr-2 break-all`}
                                                            >
                                                              {reply.author}
                                                            </span>
                                                            <span
                                                              className={`text-xs ${
                                                                isDarkMode
                                                                  ? "text-gray-400"
                                                                  : "text-gray-500"
                                                              }`}
                                                            >
                                                              {formatRelativeTime(
                                                                reply.timestamp
                                                              )}
                                                            </span>
                                                          </div>
                                                          <p
                                                            className={`text-xs ${
                                                              isDarkMode
                                                                ? "text-gray-200"
                                                                : "text-gray-800"
                                                            } break-words`}
                                                          >
                                                            {reply.content}
                                                          </p>

                                                          {/* Reply Actions */}
                                                          <button
                                                            className={`text-xs flex items-center mt-1 hover:text-mint transition-colors ${
                                                              reply.likedBy.includes(
                                                                currentUser?.uid ||
                                                                  ""
                                                              )
                                                                ? "text-red-500"
                                                                : isDarkMode
                                                                ? "text-gray-300"
                                                                : "text-gray-500"
                                                            }`}
                                                            onClick={() =>
                                                              likeReply(
                                                                reply.id
                                                              )
                                                            }
                                                            disabled={
                                                              !currentUser
                                                            }
                                                          >
                                                            {reply.likedBy.includes(
                                                              currentUser?.uid ||
                                                                ""
                                                            ) ? (
                                                              <FaHeart
                                                                className="mr-1"
                                                                size={10}
                                                              />
                                                            ) : (
                                                              <FaRegHeart
                                                                className="mr-1"
                                                                size={10}
                                                              />
                                                            )}
                                                            <span>
                                                              {reply.likes}
                                                            </span>
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            ) : (
                                              <p
                                                className={`text-xs ${
                                                  isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-500"
                                                } text-center py-2`}
                                              >
                                                No replies yet
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div
                                className={`text-center py-6 ${
                                  isDarkMode
                                    ? "bg-gray-800 text-gray-300"
                                    : "bg-white text-gray-500"
                                } rounded-lg border ${
                                  isDarkMode
                                    ? "border-gray-700"
                                    : "border-gray-200"
                                }`}
                              >
                                <p>No comments yet. Be the first to comment!</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load more button - only show if we have posts */}
              {!loading && posts.length > 0 && (
                <div className="mt-6 text-center">
                  <button className="px-6 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
                    Load More Posts
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="md:w-4/12">
              {/* About Whizpar box */}
              <div
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-sm p-6 mb-6`}
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`rounded-full ${
                      isDarkMode ? "bg-gray-900" : "bg-white"
                    } border ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    } p-2 mr-3 flex items-center justify-center shadow-sm`}
                  >
                    <img
                      src={WhizparLogo}
                      alt="Whizpar Logo"
                      className="h-6 w-auto"
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${
                        isDarkMode ? "text-gray-100" : "text-charcoal"
                      }`}
                    >
                      Powered by Whizpar
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Anonymous & secure discussions
                    </p>
                  </div>
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-gray-200" : "text-gray-600"
                  } text-sm mb-3`}
                >
                  Microbial AI's anonymous community lets you speak freely about
                  your research, lab life, and more without revealing your
                  identity.
                </p>
                <div
                  className={`${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  } rounded-lg p-3`}
                >
                  <h4
                    className={`font-medium ${
                      isDarkMode ? "text-gray-100" : "text-charcoal"
                    } text-sm mb-2`}
                  >
                    Why go anonymous?
                  </h4>
                  <ul
                    className={`text-sm space-y-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    <li className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-mint mt-1.5 mr-2 flex-shrink-0"></div>
                      <span>Share honest opinions without judgment</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-mint mt-1.5 mr-2 flex-shrink-0"></div>
                      <span>Ask sensitive questions freely</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-mint mt-1.5 mr-2 flex-shrink-0"></div>
                      <span>Discuss challenges without career concerns</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Community rules */}
              <div
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-sm p-6`}
              >
                <h3
                  className={`font-bold ${
                    isDarkMode ? "text-gray-100" : "text-charcoal"
                  } mb-4`}
                >
                  Community Guidelines
                </h3>
                <ul
                  className={`space-y-3 text-sm ${
                    isDarkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  <li className="flex items-start">
                    <div className="text-mint mr-2 flex-shrink-0">1.</div>
                    <p>Be respectful to others, even in disagreement</p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-2 flex-shrink-0">2.</div>
                    <p>No hate speech, harassment, or personal attacks</p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-2 flex-shrink-0">3.</div>
                    <p>
                      Don't share confidential research or proprietary
                      information
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-2 flex-shrink-0">4.</div>
                    <p>
                      Keep it relevant to microbiology and scientific community
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-mint mr-2 flex-shrink-0">5.</div>
                    <p>Have fun and enjoy the community!</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Confirmation Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-xl p-6 max-w-md w-full`}
          >
            <h3
              className={`text-xl font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {reportSuccess ? "Report Submitted" : "Report Post"}
            </h3>

            {reportSuccess ? (
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FaCheck className="text-green-500 text-2xl" />
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } mb-4`}
                >
                  Thank you for your report. We will review this content and
                  take appropriate action.
                </p>
              </div>
            ) : (
              <>
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } mb-4`}
                >
                  Are you sure you want to report this post for inappropriate
                  content?
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } mb-6 text-sm`}
                >
                  Reported content that violates our community guidelines will
                  be removed. Posts with 50+ reports will be automatically
                  removed.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelReport}
                    className={`px-4 py-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={isReporting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReport}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                    disabled={isReporting}
                  >
                    {isReporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Reporting...
                      </>
                    ) : (
                      <>
                        <FaFlag className="mr-2" />
                        Report
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
