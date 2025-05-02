import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import ThreadSidebar from "./components/ThreadSidebar";
// import ActiveTokensSidebar from "./components/ActiveTokensSidebar"
import AgenNicky from "./assets/microbial-profile.png";
import { TypingProvider, useTyping } from "./context/context";
import TypingIndicator from "./components/TypingIndidcator";
import MessageInput from "./components/MessageInput";
import ReactMarkdown from "react-markdown";
import CreateThreadModal from "./components/CreateThreadModal";
import VisionAnalysisModal from "./components/VisionAnalysisModal";
import {
  FaBars,
  FaSignInAlt,
  FaCog,
  FaMicrochip,
  FaFlask,
  FaEnvelope,
} from "react-icons/fa";
import { GiDna1 } from "react-icons/gi";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/auth/AuthModal";
import UserProfileButton from "./components/auth/UserProfileButton";
import SettingsPage from "./components/auth/SettingsPage";
import {
  getUserPersonalizationData,
  addUserContextToMessages,
  UserPersonalizationData,
} from "./utils/userPersonalization";
import { applyThemeSettings } from "./utils/themeUtils";
import Notification, { NotificationType } from "./components/ui/Notification";
import {
  recordVisit,
  recordUserActivity,
  ActivityType,
} from "./utils/activityTracking";
import { VerificationGuard } from "./components/auth";

export interface MessageContent {
  text: {
    annotations: Array<any>;
    value: string;
  };
  type: "text";
}

export interface Message {
  assistant_id: string;
  attachments: Array<any>;
  content: MessageContent[];
  created_at: number;
  id: string;
  metadata: Record<string, any>;
  object: "thread.message";
  role: "user" | "assistant";
  run_id: string;
  thread_id: string;
}

// Create a separate component for chat content
const ChatContent: React.FC<{
  messages: Message[];
  threadLoading: boolean;
  setCreatThreadModal: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  threadId: string | undefined;
  client: any;
  userPersonalization: UserPersonalizationData;
  addUserContextToMessages: (
    messages: any[],
    userPersonalization: UserPersonalizationData
  ) => any[];
  currentUser: any;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  messages,
  threadLoading,
  setCreatThreadModal,
  setMessages,
  input,
  setInput,
  threadId,
  client,
  userPersonalization,
  addUserContextToMessages,
  currentUser,
  setAuthModalOpen,
  setSettingsOpen,
}) => {
  const { isTyping } = useTyping();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Sort messages by creation time (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => a.created_at - b.created_at
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative shadow-md bg-white">
      {/* Chat Header - Fixed at the top */}
      <div
        className={`flex items-center w-full border-b border-lightGray p-4 bg-offWhite shadow-sm flex-shrink-0`}
      >
        <div className="pl-8 md:pl-0 flex items-center space-x-3 flex-1">
          <div className="relative">
            <img
              src={AgenNicky}
              alt="Microbial Avatar"
              className="w-[40px] h-[40px] rounded-full border-2 border-mint"
            />
            <div className="absolute -bottom-1 -right-1 text-mint animate-pulse">
              <GiDna1 size={16} />
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-[20px] font-bold text-charcoal flex items-center">
              Microbial
              <span className="ml-2 bg-mint text-white text-xs px-2 py-0.5 rounded-full">
                AI
              </span>
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Your microbiology research assistant
            </p>
          </div>
        </div>

        <div className="flex-1 flex justify-center space-x-2 items-center">
          {/* User Authentication Buttons */}
          {currentUser ? (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="bg-offWhite p-2 rounded-full text-purple hover:bg-lightGray transition-colors"
                title="Settings"
              >
                <FaCog size={18} />
              </button>
              <UserProfileButton onOpenSettings={() => setSettingsOpen(true)} />
            </>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-mint text-white px-3 py-1 rounded-full hover:bg-purple transition-colors flex items-center space-x-1"
            >
              <FaSignInAlt size={14} />
              <span className="text-sm">Sign In</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-end space-x-2 items-center">
          <div className="bg-offWhite p-2 rounded-full text-mint hover:bg-lightGray transition-colors">
            <FaMicrochip size={18} />
          </div>
          <div className="bg-offWhite p-2 rounded-full text-purple hover:bg-lightGray transition-colors">
            <FaFlask size={18} />
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto w-full p-3 md:p-4">
        {threadLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-offWhite rounded-2xl p-6 shadow-sm max-w-md flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={AgenNicky}
                  alt="Microbial Avatar"
                  className="w-[50px] h-[50px] rounded-full border-2 border-mint mb-2"
                />
                <div className="absolute -bottom-1 -right-1 text-mint animate-pulse">
                  <GiDna1 size={20} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                Microbial
                <span className="ml-2 bg-mint text-white text-xs px-2 py-0.5 rounded-full">
                  AI
                </span>
              </h3>
              <div className="relative mt-2">
                <div className="w-16 h-16 rounded-full absolute animate-cell-division border-4 border-mint opacity-75"></div>
                <div className="w-16 h-16 rounded-full animate-spin border-4 border-t-purple border-b-mint"></div>
              </div>
              <p className="mt-4 text-gray-600 text-center">
                Loading your conversation...
              </p>
              <div className="mt-4 flex space-x-2 justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse delay-150"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {sortedMessages.length === 0 && (
              <div className="text-center py-4 md:py-12 flex-1 flex items-center justify-center">
                <div className="bg-offWhite rounded-2xl p-4 sm:p-8 shadow-sm max-w-[90%] md:max-w-md mx-auto overflow-hidden">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-mint rounded-full text-white">
                      <GiDna1 size={30} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">
                    Welcome to Microbial AI
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Your personal microbiology research assistant. Start a new
                    thread to begin exploring the microscopic world.
                  </p>
                  <button
                    onClick={() => setCreatThreadModal(true)}
                    className="bg-mint text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-purple transition-colors text-sm sm:text-base"
                  >
                    Start a New Chat
                  </button>

                  {/* User personalization info */}
                  {userPersonalization.isAuthenticated && (
                    <div className="mt-4 text-left p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">
                          Welcome back,{" "}
                          {userPersonalization.displayName || "User"}!
                        </span>
                        {userPersonalization.interests &&
                          userPersonalization.interests.length > 0 && (
                            <span className="block mt-1 text-xs text-gray-500">
                              The AI will personalize responses based on your
                              interests and preferences.
                            </span>
                          )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3 pb-2">
              {sortedMessages
                .filter(
                  (message) =>
                    !(
                      message.role === "user" &&
                      message.content &&
                      message.content.length > 0 &&
                      message.content[0].text.value
                        .toString()
                        .startsWith("[SYSTEM GUIDANCE:")
                    )
                )
                .map((message) => {
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "assistant"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 mr-2">
                          <div className="relative">
                            <img
                              src={AgenNicky}
                              alt="Microbial AI"
                              className="w-8 h-8 rounded-full border-2 border-mint"
                            />
                            <div className="absolute -bottom-1 -right-1 text-mint">
                              <GiDna1 size={12} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[80%] md:max-w-[70%] overflow-hidden ${
                          message.role === "assistant"
                            ? "bg-offWhite text-charcoal mr-auto"
                            : "bg-mint text-white ml-auto"
                        }`}
                      >
                        {/* Display attached images if they exist */}
                        {message.metadata?.hasImage &&
                          message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mb-2">
                              <img
                                src={
                                  message.metadata.imageUrl ||
                                  "https://via.placeholder.com/150?text=Image"
                                }
                                alt={
                                  message.attachments[0].name ||
                                  "Attached image"
                                }
                                className="rounded-lg max-w-full h-auto max-h-60 object-contain mb-2"
                              />
                            </div>
                          )}

                        {message.content &&
                        message.content.length > 0 &&
                        message.content[0].text.value ? (
                          <ReactMarkdown className="prose prose-sm max-w-full break-words overflow-hidden">
                            {message.content[0].text.value}
                          </ReactMarkdown>
                        ) : (
                          <TypingIndicator />
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center">
                            {currentUser?.photoURL ? (
                              <img
                                src={currentUser.photoURL}
                                alt="User"
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="font-semibold">
                                {currentUser?.displayName?.[0]?.toUpperCase() ||
                                  "U"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {isTyping && <TypingIndicator />}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at the bottom */}
      {threadId && (
        <div className="flex-shrink-0 border-t border-lightGray">
          <MessageInput
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            threadId={threadId}
            client={client}
            userPersonalization={userPersonalization}
            addUserContextToMessages={addUserContextToMessages}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const [threadLoading, setThreadLoading] = useState(false);
  const [_, setNewMessage] = useState("");
  const [createThreadModal, setCreatThreadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);

  // Auth states
  const { currentUser, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [_profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userPersonalization, setUserPersonalization] =
    useState<UserPersonalizationData>({
      isAuthenticated: false,
      personalizedContext: "",
    });

  // Notification state
  const [notification, setNotification] = useState({
    type: "success" as NotificationType,
    message: "",
    isVisible: false,
  });

  // Scroll to top on mount
  useEffect(() => {
    // Scroll to top on initial load
    window.scrollTo(0, 0);

    // For mobile Safari and other mobile browsers
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    // Also handle any #root element scrolling
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.scrollTop = 0;
    }
  }, []);

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

  // Apply saved theme settings on app initialization
  useEffect(() => {
    // Apply theme from localStorage or default to dimmed mode
    applyThemeSettings();

    // Set theme based on user preference if not set already
    if (!localStorage.getItem("themeMode")) {
      const prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      localStorage.setItem("themeMode", prefersDarkMode ? "dark" : "dimmed");
      document.documentElement.classList.add(
        prefersDarkMode ? "dark-mode" : "dimmed-mode"
      );
    }
  }, []);

  // Record user visits for analytics
  useEffect(() => {
    const recordUserVisit = async () => {
      if (currentUser) {
        await recordVisit(currentUser.uid);
        await recordUserActivity(
          currentUser.uid,
          currentUser.displayName || "User",
          ActivityType.LOGIN,
          { sessionId: Date.now().toString() }
        );

        // For testing, add a second activity with plain string
        await recordUserActivity(
          currentUser.uid,
          currentUser.displayName || "User",
          "Login Test",
          { sessionId: Date.now().toString() + "-test" }
        );
      } else {
        await recordVisit(); // Anonymous visit
      }
    };

    recordUserVisit();
  }, [currentUser]);

  // Load user personalization data when user auth state changes
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;

    const loadUserPersonalization = async () => {
      if (currentUser) {
        try {
          const personalizationData = await getUserPersonalizationData(
            currentUser.uid
          );
          setUserPersonalization(personalizationData);
        } catch (error) {
          console.error("Error loading user personalization:", error);
          setUserPersonalization({
            isAuthenticated: true,
            personalizedContext: "",
          });
        }
      } else {
        setUserPersonalization({
          isAuthenticated: false,
          personalizedContext: "",
        });
      }
    };

    loadUserPersonalization();
  }, [currentUser, authLoading]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        sidebarOpen &&
        !target.closest(".sidebar-container") &&
        window.innerWidth < 768
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Show loading indicator while auth state is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full absolute animate-cell-division border-4 border-mint opacity-75"></div>
            <div className="w-12 h-12 rounded-full animate-spin border-4 border-t-purple border-b-mint"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TypingProvider>
      {createThreadModal && (
        <CreateThreadModal
          isOpen={createThreadModal}
          setIsOpen={setCreatThreadModal}
          setThreadLoading={setThreadLoading}
          setThreadId={setThreadId}
          setnewMessage={setNewMessage}
          setMessages={setMessages}
        />
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(message) => showNotification("success", message)}
        />
      )}

      {/* Settings Page */}
      {settingsOpen && (
        <SettingsPage
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* Vision Analysis Modal */}
      {visionModalOpen && (
        <VisionAnalysisModal
          isOpen={visionModalOpen}
          onClose={() => setVisionModalOpen(false)}
          client={client}
        />
      )}

      <div className="min-h-screen h-screen flex flex-col lg:flex-row dark:text-white overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-mint rounded-full text-white shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars size={20} />
        </button>

        {/* Vision Analysis Button - Fixed position */}
        <VerificationGuard
          fallback={
            currentUser ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="fixed top-4 right-4 md:right-24 z-50 bg-gradient-to-r from-mint to-purple text-white p-2 rounded-full hover:opacity-90 transition-all shadow-md flex items-center space-x-1 opacity-70"
                title="Email verification required for Image Analysis"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M6 18h8" />
                  <path d="M3 22h18" />
                  <path d="M14 22a7 7 0 1 0 0-14h-1" />
                  <path d="M9 14h2" />
                  <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2" />
                  <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                </svg>
                <span className="text-xs hidden md:block">Verify Email</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="fixed top-4 right-4 md:right-24 z-50 bg-gradient-to-r from-mint to-purple text-white p-2 rounded-full hover:opacity-90 transition-all shadow-md flex items-center space-x-1"
                title="Sign in to use Image Analysis"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M6 18h8" />
                  <path d="M3 22h18" />
                  <path d="M14 22a7 7 0 1 0 0-14h-1" />
                  <path d="M9 14h2" />
                  <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2" />
                  <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                </svg>
                <span className="text-xs hidden md:block">Sign in</span>
              </button>
            )
          }
        >
          <button
            onClick={() => setVisionModalOpen(true)}
            className="fixed top-4 right-4 md:right-24 z-50 bg-gradient-to-r from-mint to-purple text-white p-2 rounded-full hover:opacity-90 transition-all shadow-md flex items-center space-x-1"
            title="Try Image Analysis"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 18h8" />
              <path d="M3 22h18" />
              <path d="M14 22a7 7 0 1 0 0-14h-1" />
              <path d="M9 14h2" />
              <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2" />
              <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
            </svg>
            <span className="text-xs hidden md:block">Image Analysis</span>
          </button>
        </VerificationGuard>

        {/* Left Sidebar for Threads */}
        <div
          className={`sidebar-container ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } transition-transform duration-300 ease-in-out fixed top-0 left-0 h-full z-40 md:translate-x-0 md:h-screen md:sticky md:top-0 md:flex-shrink-0 md:w-72`}
        >
          <ThreadSidebar
            onCreateThread={() =>
              currentUser ? setCreatThreadModal(true) : setAuthModalOpen(true)
            }
            client={client}
            setMessages={setMessages}
            setThreadId={setThreadId}
            setThreadLoading={setThreadLoading}
            closeSidebar={() => setSidebarOpen(false)}
          />
        </div>

        {/* Backdrop overlay for mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-40 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Chat Section - Make it flex-1 and overflow-hidden to contain the chat content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {currentUser ? (
            <VerificationGuard
              fallback={
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 shadow-md max-w-lg text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-yellow-100 rounded-full text-yellow-700">
                        <FaEnvelope size={30} />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-yellow-800 mb-3">
                      Email Verification Required
                    </h2>
                    <p className="text-yellow-700 mb-4">
                      To protect our users and maintain quality, you need to
                      verify your email address before you can chat with
                      Microbial AI or use our image analysis tools.
                    </p>
                    <p className="text-yellow-600 text-sm mb-6">
                      A verification link has been sent to:{" "}
                      <strong>{currentUser.email}</strong>
                    </p>
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Verify Email Now
                    </button>
                  </div>
                </div>
              }
            >
              <ChatContent
                messages={messages}
                threadLoading={threadLoading}
                setCreatThreadModal={setCreatThreadModal}
                setMessages={setMessages}
                input={input}
                setInput={setInput}
                threadId={threadId}
                client={client}
                userPersonalization={userPersonalization}
                addUserContextToMessages={addUserContextToMessages}
                currentUser={currentUser}
                setProfileOpen={setProfileOpen}
                setAuthModalOpen={setAuthModalOpen}
                setSettingsOpen={setSettingsOpen}
              />
            </VerificationGuard>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
              <div className="bg-offWhite rounded-2xl p-8 shadow-sm max-w-md text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-mint rounded-full text-white">
                    <GiDna1 size={36} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-charcoal mb-3">
                  Sign in to access Microbial AI
                </h2>
                <p className="text-gray-600 mb-6">
                  Please sign in to chat with Microbial AI and use the image
                  analysis features.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-mint text-white px-6 py-3 rounded-full hover:bg-purple transition-colors flex items-center justify-center mx-auto space-x-2"
                >
                  <FaSignInAlt size={16} />
                  <span>Sign In Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TypingProvider>
  );
}
