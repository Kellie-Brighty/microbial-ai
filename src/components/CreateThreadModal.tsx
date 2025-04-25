import React, { useEffect, useState } from "react";
import { createThread } from "../openai_folder/createThread";
import { createAssistant } from "../openai_folder/createAssistant";
import { createRun } from "../openai_folder/createRun";
import { performRun } from "../openai_folder/performRun";
import OpenAI from "openai";
import { useTyping } from "../context/context";
import { IoClose } from "react-icons/io5";
import { GiDna1 } from "react-icons/gi";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../utils/firebase";
import { UserPersonalizationData } from "../utils/userPersonalization";
// Import credit system utilities
import {
  hasEnoughCredits,
  deductCredits,
  getUserCredits,
  CREDIT_COSTS,
} from "../utils/creditsSystem";
// Import the CreditWarningModal
import CreditWarningModal from "./ui/CreditWarningModal";
// Import for redirection to credits page
// import { useNavigate } from "react-router-dom";
// Import for purchase modal
import CreditPurchaseModal from "./payment/CreditPurchaseModal";

interface CreateThreadModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setnewMessage: React.Dispatch<React.SetStateAction<string>>;
  setThreadLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setThreadId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setMessages: React.Dispatch<React.SetStateAction<any>>;
}

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({
  isOpen,
  setIsOpen,
  setThreadLoading,
  setThreadId,
  setMessages,
}) => {
  const handleClose = () => setIsOpen(false);
  const [newMessage, setnewMessage] = useState("");
  const { currentUser } = useAuth();
  const [userPersonalization, setUserPersonalization] =
    useState<UserPersonalizationData>({
      isAuthenticated: false,
      personalizedContext: "",
    });
  // Add state for credit check
  const [credits, setCredits] = useState<number | null>(null);
  const [showCreditWarningModal, setShowCreditWarningModal] = useState(false);
  // Add state for purchase modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  // const navigate = useNavigate();

  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const { getThreadsFromLocalStorage, setSelectedThread } = useTyping();

  // Load user personalization data when component mounts
  useEffect(() => {
    const loadUserPersonalization = async () => {
      if (currentUser) {
        try {
          console.log("Loading user personalization for thread creation...");
          const profile = await getUserProfile(currentUser.uid);

          // Load user credits at the same time
          const userCredits = await getUserCredits(currentUser.uid);
          setCredits(userCredits);

          if (profile) {
            // Build personalized context string
            let personalizedContext = `This conversation is with ${
              profile.displayName || "a user"
            }. `;

            // Add interests if available
            if (profile.interests && profile.interests.length > 0) {
              personalizedContext += `Their interests include: ${profile.interests.join(
                ", "
              )}. `;
            }

            // Add preferred topics if available
            if (profile.preferredTopics && profile.preferredTopics.length > 0) {
              personalizedContext += `Their preferred microbiology topics include: ${profile.preferredTopics.join(
                ", "
              )}. `;
            }

            // Add interaction history if available
            if (profile.lastLogin) {
              const lastLogin = new Date(profile.lastLogin);
              personalizedContext += `Their last interaction was on ${lastLogin.toLocaleDateString()}. `;
            }

            // Add personal notes or additional context
            if (profile.notes) {
              personalizedContext += `Additional context: ${profile.notes}`;
            }

            setUserPersonalization({
              isAuthenticated: true,
              userId: currentUser.uid,
              displayName: profile.displayName,
              email: profile.email,
              interests: profile.interests || [],
              preferredTopics: profile.preferredTopics || [],
              personalizedContext,
            });
          }
        } catch (error) {
          console.error("Error loading user personalization:", error);
        }
      }
    };

    if (isOpen) {
      loadUserPersonalization();
    }
  }, [currentUser, isOpen]);

  const selectThread = async (threadId: string) => {
    setThreadLoading(true);
    setThreadId(threadId);
    setSelectedThread(threadId);
    const threadMessages = await client.beta.threads.messages.list(threadId);
    setThreadLoading(false);
    setMessages(
      threadMessages.data.map((message: any) => ({
        ...message,
        assistant_id: message.assistant_id || "",
      }))
    );
  };

  const handlePurchaseSuccess = async (_message: string) => {
    // Refresh credits after purchase
    if (currentUser) {
      try {
        const updatedCredits = await getUserCredits(currentUser.uid);
        setCredits(updatedCredits);

        // Close the purchase modal
        setShowPurchaseModal(false);

        // If user now has enough credits, create the thread and close the modal
        if (updatedCredits >= CREDIT_COSTS.CHAT_MESSAGE) {
          createNewThread();
          handleClose();
        }
      } catch (error) {
        console.error("Error refreshing credits after purchase:", error);
      }
    }
  };

  const createNewThread = async () => {
    if (newMessage.trim() === "") return;

    // Credit check is now done in the button click handler

    setThreadLoading(true);
    setThreadId(undefined);

    // Create a system message with user context if authenticated
    let systemMessage = null;
    if (
      userPersonalization.isAuthenticated &&
      userPersonalization.personalizedContext
    ) {
      systemMessage = {
        role: "system",
        content: `You are Microbial AI, a helpful microbiology research assistant. ${userPersonalization.personalizedContext}

IMPORTANT: You have direct access to the user's profile information and preferences. When the user asks about their profile, interests, or preferences, DO NOT claim that you cannot access this information. Instead, use the profile data provided above. If the user asks if you can see updated information, respond as if you have just fetched their latest profile data.

If the user mentions updating their profile and asks you to check it, respond positively (e.g., "Yes, I can see your updated interests now" or "I've checked your profile and can see your interests include..."). If they reference specific interests that aren't in the profile data provided, gracefully acknowledge you don't see those specific items in their current profile.`,
      };
    }

    const newThread = await createThread(
      client,
      newMessage,
      undefined,
      systemMessage
    );

    const assistant = await createAssistant(client, userPersonalization);

    const run = await createRun(client, newThread, assistant.id);
    await performRun(client, newThread, run);

    // Deduct credits for thread creation (only for authenticated users)
    if (currentUser) {
      const deductionSuccess = await deductCredits(
        currentUser.uid,
        "CHAT_MESSAGE",
        `New conversation started on ${new Date().toLocaleDateString()}`
      );

      if (deductionSuccess) {
        // Update local credit state
        const updatedCredits = await getUserCredits(currentUser.uid);
        setCredits(updatedCredits);
      } else {
        console.error("Failed to deduct credits for new thread");
      }
    }

    getThreadsFromLocalStorage();

    selectThread(newThread.id);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          {/* Credit Warning Modal with Purchase Button */}
          <CreditWarningModal
            isOpen={showCreditWarningModal}
            onClose={() => setShowCreditWarningModal(false)}
            creditCost={CREDIT_COSTS.CHAT_MESSAGE}
            currentCredits={credits}
            actionType="CHAT_MESSAGE"
            onPurchase={() => {
              setShowCreditWarningModal(false);
              setShowPurchaseModal(true);
            }}
          />

          {/* Credit Purchase Modal */}
          {showPurchaseModal && (
            <CreditPurchaseModal
              isOpen={showPurchaseModal}
              onClose={() => setShowPurchaseModal(false)}
              onSuccess={handlePurchaseSuccess}
            />
          )}

          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden transform transition-all mx-auto animate-fadeIn">
            <div className="relative bg-mint text-white p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <GiDna1 size={24} />
                <h2 className="text-lg sm:text-xl font-bold">
                  New Conversation
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white hover:text-gray-200 transition-colors"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <p className="text-charcoal font-medium mb-2 text-sm sm:text-base">
                  What would you like to discuss?
                </p>
                <textarea
                  placeholder="Ask about microbiology concepts, lab procedures, or research ideas..."
                  className="w-full p-3 border border-lightGray rounded-lg focus:border-mint focus:ring-1 focus:ring-mint outline-none resize-none h-24 text-sm sm:text-base"
                  onChange={(e) => setnewMessage(e.target.value)}
                />
              </div>

              {/* Credits info - show for authenticated users */}
              {currentUser && credits !== null && (
                <div
                  className={`mb-4 text-sm ${
                    credits < CREDIT_COSTS.CHAT_MESSAGE
                      ? "text-amber-500"
                      : "text-gray-500"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Credits: {credits} (Cost: {CREDIT_COSTS.CHAT_MESSAGE}{" "}
                      credits)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-3 sm:px-4 py-2 border border-lightGray rounded-lg text-charcoal hover:bg-lightGray transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // First check if we have enough credits before trying to close the modal
                    if (currentUser) {
                      const hasSufficientCredits = await hasEnoughCredits(
                        currentUser.uid,
                        "CHAT_MESSAGE"
                      );

                      if (!hasSufficientCredits) {
                        // Show credit warning without closing the modal
                        setShowCreditWarningModal(true);
                        return;
                      }
                    }

                    // Only if we have enough credits or user is not logged in:
                    createNewThread();
                    handleClose();
                  }}
                  disabled={!newMessage.trim()}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-white transition-colors text-sm sm:text-base ${
                    newMessage.trim()
                      ? "bg-mint hover:bg-purple"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateThreadModal;
