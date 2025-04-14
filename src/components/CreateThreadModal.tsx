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

  const createNewThread = async () => {
    if (newMessage.trim() === "") return;

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
    getThreadsFromLocalStorage();

    selectThread(newThread.id);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-3 sm:px-4 py-2 border border-lightGray rounded-lg text-charcoal hover:bg-lightGray transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
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
