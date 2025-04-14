import { getUserProfile } from "./firebase";

/**
 * Prepares user personalization data for the AI chat context
 * @param userId - The authenticated user ID
 * @returns An object containing user personalization data
 */
export const getUserPersonalizationData = async (
  userId: string | null
): Promise<UserPersonalizationData> => {
  if (!userId) {
    return {
      isAuthenticated: false,
      personalizedContext: "",
    };
  }

  try {
    // Get user profile from Firestore
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      return {
        isAuthenticated: true,
        personalizedContext: `User is authenticated but no profile data is available.`,
      };
    }

    // Build personalized context string
    let personalizedContext = `This conversation is with ${
      userProfile.displayName || "a user"
    }. `;

    // Add interests if available
    if (userProfile.interests && userProfile.interests.length > 0) {
      personalizedContext += `Their interests include: ${userProfile.interests.join(
        ", "
      )}. `;
    }

    // Add preferred topics if available
    if (userProfile.preferredTopics && userProfile.preferredTopics.length > 0) {
      personalizedContext += `Their preferred microbiology topics include: ${userProfile.preferredTopics.join(
        ", "
      )}. `;
    }

    // Add interaction history if available
    if (userProfile.lastLogin) {
      const lastLogin = new Date(userProfile.lastLogin);
      personalizedContext += `Their last interaction was on ${lastLogin.toLocaleDateString()}. `;
    }

    // Add personal notes or additional context
    if (userProfile.notes) {
      personalizedContext += `Additional context: ${userProfile.notes}`;
    }

    return {
      isAuthenticated: true,
      userId,
      displayName: userProfile.displayName,
      email: userProfile.email,
      interests: userProfile.interests || [],
      preferredTopics: userProfile.preferredTopics || [],
      expertiseLevel: userProfile.expertiseLevel,
      personalizedContext,
    };
  } catch (error) {
    console.error("Error getting user personalization data:", error);
    return {
      isAuthenticated: true,
      personalizedContext: `User is authenticated but there was an error retrieving their profile.`,
    };
  }
};

/**
 * Updates the OpenAI message payload with user context information
 * @param messages - The messages to be sent to OpenAI
 * @param userPersonalization - User personalization data
 * @returns The updated messages array with user context
 */
export const addUserContextToMessages = (
  messages: any[],
  userPersonalization: UserPersonalizationData
): any[] => {
  if (
    !userPersonalization.isAuthenticated ||
    !userPersonalization.personalizedContext
  ) {
    return messages;
  }

  // Create a system message with user context if it doesn't exist
  const hasSystemMessage = messages.some((msg) => msg.role === "system");

  if (!hasSystemMessage) {
    return [
      {
        role: "system",
        content: `You are Microbial AI, a helpful microbiology research assistant. ${userPersonalization.personalizedContext}`,
      },
      ...messages,
    ];
  }

  // Update existing system message with user context
  return messages.map((msg) => {
    if (msg.role === "system") {
      return {
        ...msg,
        content: `${msg.content} ${userPersonalization.personalizedContext}`,
      };
    }
    return msg;
  });
};

/**
 * Interface for user personalization data
 */
export interface UserPersonalizationData {
  isAuthenticated: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
  interests?: string[];
  preferredTopics?: string[];
  expertiseLevel?: string;
  personalizedContext: string;
}
