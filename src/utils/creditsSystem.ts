import {
  doc,
  updateDoc,
  getDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import { getFirestore } from "firebase/firestore";

// Credit costs for different features
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  IMAGE_ANALYSIS: 5,
  CONFERENCE_HOSTING: 20,
};

// Default credits for new users
export const DEFAULT_NEW_USER_CREDITS = 20;

/**
 * Initialize credits for a new user
 * @param userId The user ID
 * @returns Promise that resolves when credits are initialized
 */
export const initializeUserCredits = async (userId: string): Promise<void> => {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    // Only initialize if this field doesn't exist yet
    if (userDoc.exists() && userDoc.data().credits === undefined) {
      await updateDoc(userRef, {
        credits: DEFAULT_NEW_USER_CREDITS,
        creditHistory: [
          {
            amount: DEFAULT_NEW_USER_CREDITS,
            type: "welcome_bonus",
            description: "Welcome bonus credits",
            timestamp: new Date().toISOString(),
          },
        ],
      });
      console.log(
        `Initialized ${DEFAULT_NEW_USER_CREDITS} credits for new user: ${userId}`
      );
    }
  } catch (error) {
    console.error("Error initializing user credits:", error);
  }
};

/**
 * Check if user has enough credits for an action
 * @param userId The user ID
 * @param actionType The type of action (from CREDIT_COSTS)
 * @returns Promise that resolves to boolean indicating if user has enough credits
 */
export const hasEnoughCredits = async (
  userId: string,
  actionType: keyof typeof CREDIT_COSTS
): Promise<boolean> => {
  if (!userId) return false;

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    const userCredits = userData.credits || 0;
    const requiredCredits = CREDIT_COSTS[actionType];

    return userCredits >= requiredCredits;
  } catch (error) {
    console.error("Error checking user credits:", error);
    return false;
  }
};

/**
 * Deduct credits from a user for an action
 * @param userId The user ID
 * @param actionType The type of action (from CREDIT_COSTS)
 * @param description Optional description of the action
 * @returns Promise that resolves to boolean indicating if deduction was successful
 */
export const deductCredits = async (
  userId: string,
  actionType: keyof typeof CREDIT_COSTS,
  description: string = ""
): Promise<boolean> => {
  if (!userId) return false;

  try {
    // First check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, actionType);
    if (!hasCredits) return false;

    const creditsToDeduct = CREDIT_COSTS[actionType];
    const userRef = doc(db, "users", userId);

    // Update credits and add to history
    await updateDoc(userRef, {
      credits: increment(-creditsToDeduct),
      creditHistory: arrayUnion({
        amount: -creditsToDeduct,
        type: actionType.toLowerCase(),
        description:
          description ||
          `Used for ${actionType.toLowerCase().replace("_", " ")}`,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log(
      `Deducted ${creditsToDeduct} credits from user ${userId} for ${actionType}`
    );
    return true;
  } catch (error) {
    console.error("Error deducting user credits:", error);
    return false;
  }
};

/**
 * Add credits to a user account
 * @param userId The user ID
 * @param amount The amount of credits to add
 * @param source The source of the credits (purchase, reward, etc.)
 * @param description Optional description
 * @returns Promise that resolves when credits are added
 */
export const addCredits = async (
  userId: string,
  amount: number,
  source: string,
  description: string = ""
): Promise<boolean> => {
  if (!userId || amount <= 0) return false;

  try {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      credits: increment(amount),
      creditHistory: arrayUnion({
        amount: amount,
        type: source,
        description: description || `Added from ${source}`,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log(`Added ${amount} credits to user ${userId} from ${source}`);
    return true;
  } catch (error) {
    console.error("Error adding user credits:", error);
    return false;
  }
};

/**
 * Get current credit balance for a user
 * @param userId The user ID
 * @returns Promise that resolves to the user's credit balance
 */
export const getUserCredits = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    return userData.credits || 0;
  } catch (error) {
    console.error("Error getting user credits:", error);
    return 0;
  }
};

/**
 * Get credit history for a user
 * @param userId The user ID
 * @returns Promise that resolves to the user's credit history
 */
export const getCreditHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return [];

    const userData = userDoc.data();
    return userData.creditHistory || [];
  } catch (error) {
    console.error("Error getting credit history:", error);
    return [];
  }
};

// Function to check if a purchase is currently in progress
export const isPurchaseInProgress = (userId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);

    getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          resolve(userData.purchaseInProgress === true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.error("Error checking purchase status:", error);
        reject(error);
      });
  });
};

// Function to set purchase in progress status
export const setPurchaseInProgress = (
  userId: string,
  status: boolean
): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);

  return updateDoc(userRef, {
    purchaseInProgress: status,
  });
};
