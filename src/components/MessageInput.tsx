import React, { useState, useEffect, useRef } from "react";
import { Message } from "../App";
import { createAssistant } from "../utils/assistantUtils";
import { createThread } from "../openai_folder/createThread";
import { createRun } from "../openai_folder/createRun";
import { performRun } from "../openai_folder/performRun";
import { useTyping } from "../context/context";

import { UserPersonalizationData } from "../utils/userPersonalization";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../utils/userProfile";
// Import credit system utilities
import {
  hasEnoughCredits,
  deductCredits,
  getUserCredits,
  CREDIT_COSTS,
} from "../utils/creditsSystem";
// Import the new CreditWarningModal
import CreditWarningModal from "./ui/CreditWarningModal";

interface MessageInputProps {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  threadId: string | undefined;
  client: any; // Adjust the type as necessary
  userPersonalization: UserPersonalizationData;
  addUserContextToMessages: (
    messages: any[],
    userPersonalization: UserPersonalizationData
  ) => any[];
}

// Types for user personalization
export interface UserPersonalization {
  interests: string[];
  displayName: string;
  expertiseLevel: string;
  isAuthenticated: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  setMessages,
  input,
  setInput,
  threadId,
  client,
  userPersonalization,
}) => {
  const { setTyping, isTyping } = useTyping();
  const { currentUser } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localUserPersonalization, setLocalUserPersonalization] =
    useState<UserPersonalizationData>(userPersonalization);
  // Add state for user credits
  const [credits, setCredits] = useState<number | null>(null);
  // Change this to track if the modal should be shown
  const [showCreditWarningModal, setShowCreditWarningModal] =
    useState<boolean>(false);

  // Refresh user personalization data on component mount and when currentUser or threadId changes
  useEffect(() => {
    const refreshUserData = async () => {
      if (currentUser) {
        try {
          console.log("Refreshing user personalization data...");
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            // Build personalized context string
            let personalizedContext = `This conversation is with ${
              profile.displayName || "a user"
            }. `;

            // Add expertise level if available
            if (profile.expertiseLevel) {
              personalizedContext += `Their expertise level in microbiology is ${profile.expertiseLevel}. `;
            } else {
              personalizedContext += `Their expertise level in microbiology is not specified. `;
            }

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

            setLocalUserPersonalization({
              isAuthenticated: true,
              userId: currentUser.uid,
              displayName: profile.displayName,
              email: profile.email,
              expertiseLevel: profile.expertiseLevel || "intermediate",
              interests: profile.interests || [],
              preferredTopics: profile.preferredTopics || [],
              personalizedContext,
            });

            console.log("User personalization updated with latest data");
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      } else {
        setLocalUserPersonalization({
          isAuthenticated: false,
          personalizedContext: "",
        });
      }
    };

    refreshUserData();
  }, [currentUser, threadId]);

  // Update to refresh user credits when component mounts or user changes
  useEffect(() => {
    const loadUserCredits = async () => {
      if (currentUser) {
        try {
          const userCredits = await getUserCredits(currentUser.uid);
          setCredits(userCredits);
          console.log("User credits loaded:", userCredits);
        } catch (error) {
          console.error("Error loading user credits:", error);
        }
      } else {
        setCredits(null);
      }
    };

    loadUserCredits();
  }, [currentUser]);

  // Function to refresh user data programmatically
  const refreshUserDataNow = async () => {
    if (currentUser) {
      try {
        console.log("Manually refreshing user data before sending message...");
        const profile = await getUserProfile(currentUser.uid);

        // Also refresh credit information
        const userCredits = await getUserCredits(currentUser.uid);
        setCredits(userCredits);

        if (profile) {
          // Build personalized context string
          let personalizedContext = `This conversation is with ${
            profile.displayName || "a user"
          }. `;

          // Add expertise level if available
          if (profile.expertiseLevel) {
            personalizedContext += `Their expertise level in microbiology is ${profile.expertiseLevel}. `;
          } else {
            personalizedContext += `Their expertise level in microbiology is not specified. `;
          }

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

          setLocalUserPersonalization({
            isAuthenticated: true,
            userId: currentUser.uid,
            displayName: profile.displayName,
            email: profile.email,
            expertiseLevel: profile.expertiseLevel || "intermediate",
            interests: profile.interests || [],
            preferredTopics: profile.preferredTopics || [],
            personalizedContext,
          });

          return {
            isAuthenticated: true,
            userId: currentUser.uid,
            displayName: profile.displayName,
            email: profile.email,
            expertiseLevel: profile.expertiseLevel || "intermediate",
            interests: profile.interests || [],
            preferredTopics: profile.preferredTopics || [],
            personalizedContext,
          };
        }
      } catch (error) {
        console.error("Error manually refreshing user data:", error);
      }
    }
    return currentUser ? localUserPersonalization : userPersonalization;
  };

  // Auto-resize textarea to fit content while typing
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "0";
      const scrollHeight = inputRef.current.scrollHeight;
      // Limit max height to prevent it from taking too much space
      inputRef.current.style.height = `${Math.min(scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    // Check if user has enough credits for sending a message (if authenticated)
    if (currentUser) {
      const hasSufficientCredits = await hasEnoughCredits(
        currentUser.uid,
        "CHAT_MESSAGE"
      );

      if (!hasSufficientCredits) {
        // Show credit warning modal instead of just the message
        setShowCreditWarningModal(true);
        return;
      }

      // Reset warning state if it was previously shown
      setShowCreditWarningModal(false);
    }

    // Check if the input appears to be a personal question when user is not authenticated
    const personalQuestionPatterns = [
      /\bmy\s+(name|age|location|background|profile|interests|preferences|info|information)\b/i,
      /\bwho\s+(am\s+i|i\s+am)\b/i,
      /\babout\s+me\b/i,
      /\b(tell|know)\s+.*\s+me\b/i,
      /\bmy\s+.*\s+(likes?|interests?|preferences?|background|history|profile)\b/i,
      /\bdo\s+you\s+(know|remember)\s+me\b/i,
      /\b(what|how)\s+.*\s+i\s+(like|prefer|interested\s+in)\b/i,
    ];

    const isPersonalQuestion = personalQuestionPatterns.some((pattern) =>
      pattern.test(input)
    );

    // Get fresh user data before sending message
    const personalizedData = await refreshUserDataNow();

    // Add sign-in prompt if it's a personal question and user is not authenticated
    if (isPersonalQuestion && !personalizedData.isAuthenticated) {
      const userMessage: Message = {
        id: `user-message-${Date.now()}`,
        object: "thread.message",
        created_at: Math.floor(Date.now() / 1000),
        thread_id: threadId || "",
        role: "user",
        content: [
          {
            type: "text",
            text: {
              value: input,
              annotations: [],
            },
          },
        ],
        assistant_id: "",
        run_id: "",
        attachments: [],
        metadata: {},
      };

      // Add user message to the messages array
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Reset the textarea height after sending
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      // Create sign-in prompt message
      const signInPromptMessage: Message = {
        id: `assistant-message-${Date.now()}`,
        object: "thread.message",
        created_at: Math.floor(Date.now() / 1000),
        thread_id: threadId || "",
        role: "assistant",
        content: [
          {
            type: "text",
            text: {
              value:
                "I notice you're asking about personal information. To provide personalized responses, I'll need to know more about you. Please sign in so I can access your profile information and tailor my responses to your interests and background.",
              annotations: [],
            },
          },
        ],
        assistant_id: "Microbial",
        run_id: "",
        attachments: [],
        metadata: {},
      };

      setMessages((prev) => [...prev, signInPromptMessage]);
      return;
    }

    const userMessage: Message = {
      id: `user-message-${Date.now()}`,
      object: "thread.message",
      created_at: Math.floor(Date.now() / 1000),
      thread_id: threadId || "",
      role: "user",
      content: [
        {
          type: "text",
          text: {
            value: input.trim(),
            annotations: [],
          },
        },
      ],
      assistant_id: "",
      run_id: "",
      attachments: [],
      metadata: {},
    };

    // Add user message to the messages array
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Reset the textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    console.log(
      "Generating response with user context:",
      personalizedData.isAuthenticated
        ? `Authenticated user: ${personalizedData.displayName || "Unknown"}`
        : "Unauthenticated user"
    );

    // Create assistant with user personalization data
    const assistant = await createAssistant(client, personalizedData);

    try {
      // Always create a system message with personalization context if authenticated
      let systemMessage = null;
      if (
        personalizedData.isAuthenticated &&
        personalizedData.personalizedContext
      ) {
        systemMessage = {
          role: "system",
          content: `You are Microbial AI, a specialized microbiology research assistant with expertise specifically in microbiology, not general biology. ${personalizedData.personalizedContext}

IMPORTANT GUIDELINES:
1. ALWAYS provide sophisticated, detailed, and technically accurate responses about microbiology topics.
2. Focus EXCLUSIVELY on microbiology - if a query relates to general biology but not microbiology, redirect the conversation toward its microbiology aspects.
3. Adapt your technical level to the user's expertise - if their profile indicates they are a beginner, explain complex concepts in simpler terms while still maintaining scientific accuracy.
4. For mycology and other microbiology subfields, emphasize their relationship to microbiology specifically. Never describe mycology as a "branch of biology" but rather as a "branch of microbiology focusing on fungi".
5. Include relevant microbiology-specific terminology, methodologies, and recent research when appropriate.
6. You have direct access to the user's profile information and preferences. When the user asks about their profile, interests, or preferences, use the profile data provided above.
7. If the user mentions updating their profile, respond as if you have just fetched their latest profile data.
8. CRITICAL: When discussing any topic that overlaps with other sciences (like biochemistry, genetics, cellular processes), ONLY discuss them in the context of microbiology. Never reference general biology or other sciences as separate fields.
9. For educational questions, ONLY answer from the perspective of a microbiology curriculum, not general biology or other sciences.
10. When explaining concepts, always frame them as "in microbiology" rather than "in biology" or other disciplines.
11. HIGHEST PRIORITY: Always provide factually accurate scientific information. Never compromise on accuracy - simply present the correct information within microbiology's framework.
12. When asked about a topic that traditionally spans multiple disciplines (like biochemistry), don't deflect or avoid answering - provide factually correct information but frame it entirely within microbiology's context.

If the user references specific interests that aren't in the profile data provided, gracefully acknowledge you don't see those specific items in their current profile.`,
        };
        console.log("Adding personalized system message to thread");
      } else {
        // Default system message for unauthenticated users
        systemMessage = {
          role: "system",
          content:
            "You are Microbial AI, a specialized microbiology research assistant with expertise specifically in microbiology, not general biology. You don't have access to user profile information because the user is not signed in. IMPORTANT: Always provide sophisticated, detailed responses about microbiology topics. Focus EXCLUSIVELY on microbiology - if a query relates to general biology but not microbiology, redirect the conversation toward its microbiology aspects. For mycology and other microbiology subfields, ALWAYS describe them as branches of microbiology (e.g., 'Mycology is the branch of microbiology that focuses on fungi'), never as branches of general biology. Include relevant microbiology-specific terminology, methodologies, and recent research when appropriate. CRITICAL: When discussing any topic that overlaps with other sciences (like biochemistry, genetics, cellular processes), ONLY discuss them in the context of microbiology. Never reference biology or other sciences as separate fields. For educational questions, ONLY answer from the perspective of a microbiology curriculum. HIGHEST PRIORITY: Always provide factually accurate scientific information. When asked about a topic that traditionally spans multiple disciplines, don't deflect or avoid answering - provide factually correct information but frame it entirely within microbiology's context. If they ask about their profile data, suggest they sign in to enable personalized interactions.",
        };
      }

      // Create the thread with personalized context
      const thread = await createThread(client, input, threadId, systemMessage);

      setTyping(true);

      let result: any; // Use any type for now to handle OpenAI API response
      const run = await createRun(client, thread, assistant.id);
      result = await performRun(client, thread, run);

      if (result) {
        setTyping(false);

        // Extract text from the assistant's response
        let responseText = "No response text available";

        // Safely check for content using optional chaining
        if (
          result?.content &&
          Array.isArray(result.content) &&
          result.content.length > 0
        ) {
          const textContent = result.content.find(
            (item: any) => item?.type === "text"
          );
          if (textContent?.text?.value) {
            responseText = textContent.text.value;
          }
        } else if (result?.text?.value) {
          // Fallback for older API response format
          responseText = result.text.value;
        }

        // Don't continue if we have an empty or default response
        if (
          responseText === "No response text available" ||
          responseText.trim() === ""
        ) {
          console.error("Invalid or empty response received from OpenAI");
          setTyping(false);
          return;
        }

        if (personalizedData.isAuthenticated && personalizedData.displayName) {
          // Check if response doesn't already contain the user's name
          if (!responseText.includes(personalizedData.displayName)) {
            // Occasionally add a personalized greeting - increase probability to 50%
            const shouldPersonalize = Math.random() > 0.5;
            if (shouldPersonalize) {
              // Prioritize microbiology subfields from user's preferred topics
              let preferredMicrobiologyTopic = "microbiology";
              if (
                personalizedData.preferredTopics &&
                personalizedData.preferredTopics.length > 0
              ) {
                const microbiologySubfields = [
                  "bacteriology",
                  "mycology",
                  "virology",
                  "parasitology",
                  "immunology",
                  "microbial genetics",
                  "microbial ecology",
                  "microbial physiology",
                  "microbial biotechnology",
                  "environmental microbiology",
                  "food microbiology",
                  "industrial microbiology",
                  "medical microbiology",
                  "pharmaceutical microbiology",
                  "veterinary microbiology",
                  "agricultural microbiology",
                  "microbial genomics",
                  "proteomics",
                ];

                // Find the first matching microbiology subfield in user's preferred topics
                const matchingSubfield = personalizedData.preferredTopics.find(
                  (topic: string) =>
                    microbiologySubfields.some((subfield) =>
                      topic.toLowerCase().includes(subfield.toLowerCase())
                    )
                );

                if (matchingSubfield) {
                  preferredMicrobiologyTopic = matchingSubfield;
                }
              }

              const personalizations = [
                `${personalizedData.displayName}, `,
                `As you're interested in ${preferredMicrobiologyTopic}, `,
                `Given your ${
                  personalizedData.expertiseLevel || "intermediate"
                } expertise in microbiology, `,
                `Considering your interest in ${preferredMicrobiologyTopic}, `,
              ];
              const randomPersonalization =
                personalizations[
                  Math.floor(Math.random() * personalizations.length)
                ];

              // Find a good spot to insert personalization
              if (responseText.includes(". ")) {
                const sentences = responseText.split(". ");
                if (sentences.length > 1) {
                  // Insert after the first sentence
                  sentences[1] =
                    randomPersonalization +
                    sentences[1].charAt(0).toLowerCase() +
                    sentences[1].slice(1);
                  responseText = sentences.join(". ");
                }
              }

              console.log("Added personalization to response");
            }
          }
        }

        // Deduct credits for the successful AI response (only for authenticated users)
        if (currentUser) {
          const deductionSuccess = await deductCredits(
            currentUser.uid,
            "CHAT_MESSAGE",
            `Chat with AI on ${new Date().toLocaleDateString()}`
          );

          if (deductionSuccess) {
            // Update local credit state
            const updatedCredits = await getUserCredits(currentUser.uid);
            setCredits(updatedCredits);
          } else {
            console.error("Failed to deduct credits for chat message");
          }
        }

        // Create an assistant message
        const assistantMessage: Message = {
          id: `assistant-message-${Date.now()}`,
          object: "thread.message",
          created_at: Math.floor(Date.now() / 1000),
          thread_id: typeof thread === "string" ? thread : thread.id || "",
          role: "assistant",
          content: [
            {
              type: "text",
              text: {
                value: responseText,
                annotations: [],
              },
            },
          ],
          assistant_id: "assistant-id",
          run_id: "run-id",
          attachments: [],
          metadata: {},
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } else {
        // Create an error message if no result
        const errorMessage: Message = {
          id: `error-message-${Date.now()}`,
          object: "thread.message",
          created_at: Math.floor(Date.now() / 1000),
          thread_id: typeof thread === "string" ? thread : thread.id || "",
          role: "assistant",
          content: [
            {
              type: "text",
              text: {
                value:
                  "I'm sorry, I couldn't generate a response at this time. Please try again later.",
                annotations: [],
              },
            },
          ],
          assistant_id: "assistant-id",
          run_id: "run-id",
          attachments: [],
          metadata: {},
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      setTyping(false);

      // Add error message to the messages array
      const errorMessage: Message = {
        id: `error-message-${Date.now()}`,
        object: "thread.message",
        created_at: Math.floor(Date.now() / 1000),
        thread_id: threadId || "",
        role: "assistant",
        content: [
          {
            type: "text",
            text: {
              value: "Sorry, I encountered an error. Please try again.",
              annotations: [],
            },
          },
        ],
        assistant_id: "assistant-id",
        run_id: "run-id",
        attachments: [],
        metadata: {},
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // Handle Enter key to send, but allow Shift+Enter for new lines
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Compute display data for the input placeholder
  const displayData = {
    isAuthenticated: currentUser !== null,
    displayName: localUserPersonalization.displayName || "",
    expertiseLevel: localUserPersonalization.expertiseLevel || "intermediate",
    interests: localUserPersonalization.interests || [],
  };

  return (
    <div className="p-2 md:p-3">
      {/* Credit Warning Modal */}
      <CreditWarningModal
        isOpen={showCreditWarningModal}
        onClose={() => setShowCreditWarningModal(false)}
        creditCost={CREDIT_COSTS.CHAT_MESSAGE}
        currentCredits={credits}
        actionType="CHAT_MESSAGE"
      />

      <div className="flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-charcoal rounded-full px-4 py-3 shadow-sm hover:shadow-md transition-shadow focus-within:border-mint focus-within:shadow-[0_0_0_1px_rgba(80,219,180,0.1),0_0_0_4px_rgba(80,219,180,0.1)] dark:focus-within:shadow-[0_0_0_1px_rgba(80,219,180,0.2),0_0_0_4px_rgba(80,219,180,0.2)]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none resize-none overflow-hidden min-h-[24px] max-h-32 text-sm dark:text-white focus:ring-0 focus:outline-none"
          placeholder={`Ask about microbiology${
            displayData.isAuthenticated
              ? `, ${displayData.displayName.split(" ")[0]}`
              : ""
          }...`}
          rows={1}
        />
        <div className="flex-shrink-0 ml-2 h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <button
          onClick={handleSend}
          disabled={isTyping || input.trim() === ""}
          className={`flex-shrink-0 ml-2 p-2.5 rounded-full transition-colors ${
            isTyping || input.trim() === ""
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-mint hover:bg-purple text-white transition-colors shadow-sm"
          }`}
          title="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {/* Credits display for authenticated users */}
      {currentUser && credits !== null && (
        <div
          className={`text-xs ${
            credits < CREDIT_COSTS.CHAT_MESSAGE * 5
              ? "text-amber-500 font-semibold"
              : "text-gray-500"
          } mt-1 flex items-center justify-center`}
        >
          <span className="inline-flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
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
            Credits: {credits}{" "}
            {credits < CREDIT_COSTS.CHAT_MESSAGE * 5 && " (Low)"}
          </span>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center mt-2 px-2">
        <span className="hidden sm:inline">
          {displayData.isAuthenticated ? (
            <span className="flex items-center justify-center space-x-1">
              <span className="h-1.5 w-1.5 bg-mint rounded-full"></span>
              <span>{`Personalized for your ${
                displayData.expertiseLevel || "intermediate"
              } expertise in ${
                displayData.interests?.join(", ") || "microbiology"
              }`}</span>
            </span>
          ) : (
            "Microbial AI is designed to assist with advanced microbiology research and education"
          )}
        </span>
        <span className="sm:hidden">Type your question about microbiology</span>
      </div>
    </div>
  );
};

export default MessageInput;
