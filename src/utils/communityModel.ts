import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
} from "firebase/firestore";

import { uploadImageToImgbb } from "./imageUpload";

// Types
export interface AnonymousMember {
  userId: string;
  communityId: string;
  anonymousId: string;
  joinedAt: Timestamp;
}

export interface CommunityPost {
  id?: string;
  communityId: string;
  anonymousId: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
  likes: number;
  likedBy: string[];
  commentCount: number;
  reports: string[];
  reportCount: number;
}

export interface PostComment {
  id?: string;
  postId: string;
  anonymousId: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
  likedBy: string[];
  replyCount: number;
}

export interface CommentReply {
  id?: string;
  commentId: string;
  anonymousId: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
  likedBy: string[];
}

// Community membership functions
export const joinCommunityAnonymously = async (
  userId: string,
  communityId: string
): Promise<string> => {
  try {
    // Check if user is already a member
    const memberQuery = query(
      collection(db, "anonymousMembers"),
      where("userId", "==", userId),
      where("communityId", "==", communityId)
    );

    const memberSnapshot = await getDocs(memberQuery);

    if (!memberSnapshot.empty) {
      // User is already a member, return their anonymous ID
      return memberSnapshot.docs[0].data().anonymousId;
    }

    // Generate a random anonymous ID
    const randomId = Math.random().toString(36).substring(2, 15);
    const anonymousId = `anon_${randomId}`;

    // Create new anonymous member record
    const memberData: AnonymousMember = {
      userId,
      communityId,
      anonymousId,
      joinedAt: serverTimestamp() as Timestamp,
    };

    await addDoc(collection(db, "anonymousMembers"), memberData);

    return anonymousId;
  } catch (error) {
    console.error("Error joining community anonymously:", error);
    throw error;
  }
};

export const leaveCommunity = async (
  userId: string,
  communityId: string
): Promise<boolean> => {
  try {
    const memberQuery = query(
      collection(db, "anonymousMembers"),
      where("userId", "==", userId),
      where("communityId", "==", communityId)
    );

    const memberSnapshot = await getDocs(memberQuery);

    if (memberSnapshot.empty) {
      return false; // User is not a member
    }

    // Delete the membership
    await deleteDoc(memberSnapshot.docs[0].ref);

    return true;
  } catch (error) {
    console.error("Error leaving community:", error);
    throw error;
  }
};

export const getAnonymousId = async (
  userId: string,
  communityId: string
): Promise<string | null> => {
  try {
    const memberQuery = query(
      collection(db, "anonymousMembers"),
      where("userId", "==", userId),
      where("communityId", "==", communityId)
    );

    const memberSnapshot = await getDocs(memberQuery);

    if (memberSnapshot.empty) {
      return null; // User is not a member
    }

    return memberSnapshot.docs[0].data().anonymousId;
  } catch (error) {
    console.error("Error getting anonymous ID:", error);
    throw error;
  }
};

// Post functions
export const createPost = async (
  anonymousId: string,
  communityId: string,
  content: string,
  image?: File
): Promise<string> => {
  try {
    let imageUrl = undefined;

    // Upload image if provided
    if (image) {
      // Use imgbb instead of Firebase Storage
      imageUrl = await uploadImageToImgbb(image);
    }

    // Create post
    const postData: Omit<CommunityPost, "id"> = {
      communityId,
      anonymousId,
      content,
      imageUrl,
      createdAt: serverTimestamp() as Timestamp,
      likes: 0,
      likedBy: [],
      commentCount: 0,
      reports: [],
      reportCount: 0,
    };

    const postRef = await addDoc(collection(db, "communityPosts"), postData);

    return postRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

export const getPosts = async (
  communityId: string,
  lastPostId?: string,
  itemsPerPage = 10
): Promise<CommunityPost[]> => {
  try {
    let postsQuery;

    if (lastPostId) {
      await getDoc(doc(db, "communityPosts", lastPostId));
      postsQuery = query(
        collection(db, "communityPosts"),
        where("communityId", "==", communityId),
        orderBy("createdAt", "desc"),
        limit(itemsPerPage)
      );
    } else {
      postsQuery = query(
        collection(db, "communityPosts"),
        where("communityId", "==", communityId),
        orderBy("createdAt", "desc"),
        limit(itemsPerPage)
      );
    }

    const postsSnapshot = await getDocs(postsQuery);

    return postsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as CommunityPost)
    );
  } catch (error) {
    console.error("Error getting posts:", error);
    throw error;
  }
};

export const likePost = async (
  postId: string,
  anonymousId: string
): Promise<void> => {
  try {
    const postRef = doc(db, "communityPosts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      throw new Error("Post not found");
    }

    const post = postSnapshot.data() as CommunityPost;

    // Check if user already liked the post
    if (post.likedBy.includes(anonymousId)) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(anonymousId),
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(anonymousId),
      });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
};

// Comment functions
export const addComment = async (
  postId: string,
  anonymousId: string,
  content: string
): Promise<string> => {
  try {
    // Create comment
    const commentData: Omit<PostComment, "id"> = {
      postId,
      anonymousId,
      content,
      createdAt: serverTimestamp() as Timestamp,
      likes: 0,
      likedBy: [],
      replyCount: 0,
    };

    const commentRef = await addDoc(
      collection(db, "postComments"),
      commentData
    );

    // Update post comment count
    const postRef = doc(db, "communityPosts", postId);
    await updateDoc(postRef, {
      commentCount: increment(1),
    });

    return commentRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getComments = async (postId: string): Promise<PostComment[]> => {
  try {
    const commentsQuery = query(
      collection(db, "postComments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    const commentsSnapshot = await getDocs(commentsQuery);

    return commentsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as PostComment)
    );
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

export const likeComment = async (
  commentId: string,
  anonymousId: string
): Promise<void> => {
  try {
    const commentRef = doc(db, "postComments", commentId);
    const commentSnapshot = await getDoc(commentRef);

    if (!commentSnapshot.exists()) {
      throw new Error("Comment not found");
    }

    const comment = commentSnapshot.data() as PostComment;

    // Check if user already liked the comment
    if (comment.likedBy.includes(anonymousId)) {
      // Unlike
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: arrayRemove(anonymousId),
      });
    } else {
      // Like
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(anonymousId),
      });
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
};

// Reply functions
export const addReply = async (
  commentId: string,
  anonymousId: string,
  content: string
): Promise<string> => {
  try {
    // Create reply
    const replyData: Omit<CommentReply, "id"> = {
      commentId,
      anonymousId,
      content,
      createdAt: serverTimestamp() as Timestamp,
      likes: 0,
      likedBy: [],
    };

    const replyRef = await addDoc(collection(db, "commentReplies"), replyData);

    // Update comment reply count
    const commentRef = doc(db, "postComments", commentId);
    await updateDoc(commentRef, {
      replyCount: increment(1),
    });

    return replyRef.id;
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
};

export const getReplies = async (
  commentId: string
): Promise<CommentReply[]> => {
  try {
    const repliesQuery = query(
      collection(db, "commentReplies"),
      where("commentId", "==", commentId),
      orderBy("createdAt", "asc")
    );

    const repliesSnapshot = await getDocs(repliesQuery);

    return repliesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as CommentReply)
    );
  } catch (error) {
    console.error("Error getting replies:", error);
    throw error;
  }
};

export const likeReply = async (
  replyId: string,
  anonymousId: string
): Promise<void> => {
  try {
    const replyRef = doc(db, "commentReplies", replyId);
    const replySnapshot = await getDoc(replyRef);

    if (!replySnapshot.exists()) {
      throw new Error("Reply not found");
    }

    const reply = replySnapshot.data() as CommentReply;

    // Check if user already liked the reply
    if (reply.likedBy.includes(anonymousId)) {
      // Unlike
      await updateDoc(replyRef, {
        likes: increment(-1),
        likedBy: arrayRemove(anonymousId),
      });
    } else {
      // Like
      await updateDoc(replyRef, {
        likes: increment(1),
        likedBy: arrayUnion(anonymousId),
      });
    }
  } catch (error) {
    console.error("Error liking reply:", error);
    throw error;
  }
};

// Report a post
export const reportPost = async (
  postId: string,
  anonymousId: string
): Promise<void> => {
  try {
    const postRef = doc(db, "communityPosts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    if (postData.reports && postData.reports.includes(anonymousId)) {
      // User already reported this post
      return;
    }

    // Update the post with the new report
    await updateDoc(postRef, {
      reports: arrayUnion(anonymousId),
      reportCount: increment(1),
    });

    // Check if post should be auto-deleted (50+ reports)
    const updatedPostSnap = await getDoc(postRef);
    if (updatedPostSnap.exists()) {
      const updatedData = updatedPostSnap.data();
      if (updatedData.reportCount >= 50) {
        await deleteDoc(postRef);
      }
    }
  } catch (error) {
    console.error("Error reporting post:", error);
    throw error;
  }
};

// Get reported posts for admin review
export const getReportedPosts = async (
  minReportCount = 1,
  limitCount = 50
): Promise<CommunityPost[]> => {
  try {
    const postsQuery = query(
      collection(db, "communityPosts"),
      where("reportCount", ">=", minReportCount),
      orderBy("reportCount", "desc"),
      limit(limitCount)
    );

    const postsSnapshot = await getDocs(postsQuery);
    const posts: CommunityPost[] = [];

    postsSnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as CommunityPost);
    });

    return posts;
  } catch (error) {
    console.error("Error getting reported posts:", error);
    throw error;
  }
};

// Delete a post (for admin use)
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, "communityPosts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};
