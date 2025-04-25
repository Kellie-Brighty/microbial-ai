import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { addCredits } from "./creditsSystem";

/**
 * Interface for user data with credits
 */
export interface UserWithCredits {
  uid: string;
  displayName: string;
  email: string;
  credits: number;
  photoURL?: string;
  createdAt?: string;
  lastLogin?: string;
}

/**
 * Get users with their credit information
 * @param limitCount Number of users to return
 * @param startAfterDoc Starting point for pagination
 * @param searchTerm Optional search term to filter users
 * @returns Promise with users data and the last document for pagination
 */
export const getUsers = async (
  limitCount = 20,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>,
  searchTerm?: string
): Promise<{
  users: UserWithCredits[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  try {
    let usersQuery;
    const usersRef = collection(db, "users");

    if (searchTerm && searchTerm.trim() !== "") {
      // Case insensitive search is limited in Firestore, this is a simple approach
      // For better search, use Firestore indexes or a search service
      const term = searchTerm.toLowerCase();
      usersQuery = query(
        usersRef,
        where("displayNameLower", ">=", term),
        where("displayNameLower", "<=", term + "\uf8ff"),
        orderBy("displayNameLower"),
        limit(limitCount)
      );
    } else {
      if (startAfterDoc) {
        usersQuery = query(
          usersRef,
          orderBy("displayName"),
          startAfter(startAfterDoc),
          limit(limitCount)
        );
      } else {
        usersQuery = query(usersRef, orderBy("displayName"), limit(limitCount));
      }
    }

    const usersSnapshot = await getDocs(usersQuery);
    const lastDoc =
      usersSnapshot.docs.length > 0
        ? usersSnapshot.docs[usersSnapshot.docs.length - 1]
        : null;

    const users = usersSnapshot.docs.map((doc) => {
      const userData = doc.data();
      return {
        uid: doc.id,
        displayName: userData.displayName || "Unknown User",
        email: userData.email || "No email",
        credits: userData.credits || 0,
        photoURL: userData.photoURL || undefined,
        createdAt: userData.createdAt
          ? new Date(userData.createdAt.toDate()).toISOString()
          : undefined,
        lastLogin: userData.lastLogin
          ? new Date(userData.lastLogin.toDate()).toISOString()
          : undefined,
      };
    });

    return { users, lastDoc };
  } catch (error) {
    console.error("Error getting users:", error);
    return { users: [], lastDoc: null };
  }
};

/**
 * Send credits to a single user
 * @param userId The user ID to send credits to
 * @param amount Amount of credits to send
 * @param reason Reason for sending credits
 * @returns Promise resolving to boolean indicating success
 */
export const sendCreditsToUser = async (
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> => {
  try {
    const success = await addCredits(
      userId,
      amount,
      "admin_gift",
      reason || "Credits gifted by admin"
    );

    return success;
  } catch (error) {
    console.error("Error sending credits to user:", error);
    return false;
  }
};

/**
 * Send credits to multiple users
 * @param userIds Array of user IDs to send credits to
 * @param amount Amount of credits to send to each user
 * @param reason Reason for sending credits
 * @returns Promise resolving to object with success and failure counts
 */
export const sendCreditsToBulkUsers = async (
  userIds: string[],
  amount: number,
  reason: string
): Promise<{ successful: number; failed: number }> => {
  let successful = 0;
  let failed = 0;

  if (!userIds || userIds.length === 0 || amount <= 0) {
    return { successful, failed };
  }

  try {
    // Process in batches to avoid overloading Firestore
    const batchSize = 20;
    const totalBatches = Math.ceil(userIds.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, userIds.length);
      const batch = userIds.slice(start, end);

      // Process each user in the batch
      const results = await Promise.all(
        batch.map((userId) =>
          addCredits(
            userId,
            amount,
            "admin_bulk_gift",
            reason || "Bulk credits gifted by admin"
          )
        )
      );

      // Count successes and failures
      results.forEach((result) => {
        if (result) successful++;
        else failed++;
      });
    }

    return { successful, failed };
  } catch (error) {
    console.error("Error sending bulk credits:", error);
    return { successful, failed };
  }
};
