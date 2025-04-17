import React, { useState, useEffect, useRef } from "react";
import { Message } from "../App";
import { createAssistant } from "../openai_folder/createAssistant";
import { createThread } from "../openai_folder/createThread";
import { createRun } from "../openai_folder/createRun";
import { performRun } from "../openai_folder/performRun";
import { useTyping } from "../context/context";
import { IoSend } from "react-icons/io5";
import { FaMicrochip } from "react-icons/fa6";
import { UserPersonalizationData } from "../utils/userPersonalization";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../utils/firebase";

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
  const [selectedFile, _] = useState<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localUserPersonalization, setLocalUserPersonalization] =
    useState<UserPersonalizationData>(userPersonalization);

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

  // Function to refresh user data programmatically
  const refreshUserDataNow = async () => {
    if (currentUser) {
      try {
        console.log("Manually refreshing user data before sending message...");
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
    if (input.trim() === "" && !selectedFile) return;

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
      if (selectedFile) {
        console.log("Processing selected file...");
        // result = await storyWriterTool.handler({ file: selectedFile });
      } else {
        const run = await createRun(client, thread, assistant.id);
        result = await performRun(client, thread, run);
      }

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

  // Use local user personalization for UI elements
  const displayData = currentUser
    ? localUserPersonalization
    : userPersonalization;

  return (
    <div className="bg-offWhite p-3 sm:p-4 border-t border-lightGray">
      <div className="flex items-center bg-white rounded-full shadow-sm overflow-hidden border border-lightGray hover:border-mint transition-colors">
        <div className="flex-1 flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 p-3 outline-none text-charcoal placeholder-gray-400 resize-none overflow-hidden min-h-[40px] max-h-[100px]"
            placeholder={
              displayData.isAuthenticated
                ? `Ask about microbiology, ${
                    displayData.displayName || "User"
                  }...`
                : "Ask about microbiology..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          {isTyping && (
            <div className="flex items-center pr-3">
              <div className="flex items-center space-x-2 bg-mint bg-opacity-10 px-3 py-1.5 rounded-full">
                <FaMicrochip className="text-mint" size={14} />
                <span className="text-mint text-sm font-medium">
                  Microbial AI is thinking...
                </span>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse delay-150"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          className={`p-3 text-white rounded-full transition-colors ${
            input.trim().length > 0
              ? "bg-mint hover:bg-purple"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          onClick={handleSend}
          disabled={!input.trim().length || isTyping}
          aria-label="Send message"
        >
          <IoSend size={18} />
        </button>
      </div>
      <div className="text-xs text-gray-400 text-center mt-2 px-2">
        <span className="hidden sm:inline">
          {displayData.isAuthenticated
            ? `Personalized responses based on your ${
                displayData.expertiseLevel || "intermediate"
              } expertise level and interests: ${
                displayData.interests?.join(", ") || "microbiology"
              }`
            : "Microbial AI is designed to assist with advanced microbiology research and education"}
        </span>
        <span className="sm:hidden">Type your question about microbiology</span>
      </div>
    </div>
  );
};

export default MessageInput;
