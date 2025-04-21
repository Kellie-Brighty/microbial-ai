// import moment from "moment"
import React, { useState } from "react";
import { GoSidebarCollapse } from "react-icons/go";
import { IoCreateOutline } from "react-icons/io5";
import { useTyping } from "../context/context";
import { GiMicroscope, GiDna1 } from "react-icons/gi";
import { FaFlask } from "react-icons/fa";
import { getThreadImageMessages, getImageData } from "../utils/imageStorage";
import { Message } from "../App";

// Thread type definition

interface ThreadSidebarProps {
  onCreateThread: React.Dispatch<React.SetStateAction<boolean>>;
  setThreadLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setThreadId: React.Dispatch<React.SetStateAction<string | undefined>>;
  client: any;
  setMessages: React.Dispatch<React.SetStateAction<any>>;
  closeSidebar?: () => void; // Optional prop for mobile
}

const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  onCreateThread,
  setThreadLoading,
  setThreadId,
  client,
  setMessages,
  closeSidebar,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { threads, setSelectedThread, selectedThread } = useTyping();

  const selectThread = async (threadId: string) => {
    // Handle mobile sidebar close
    if (window.innerWidth < 768 && closeSidebar) {
      closeSidebar();
    }

    setThreadLoading(true);
    setThreadId(threadId);
    setSelectedThread(threadId);
    const threadMessages = await client.beta.threads.messages.list(threadId);

    // Get messages data
    let messages = threadMessages.data.map((message: any) => ({
      ...message,
      assistant_id: message.assistant_id || "",
    }));

    // Restore image data for messages in this thread
    try {
      const imageMessageIds = await getThreadImageMessages(threadId);

      if (imageMessageIds.length > 0) {
        console.log(
          `Found ${imageMessageIds.length} image messages to restore`
        );

        // For each image message, retrieve the image data
        for (const messageId of imageMessageIds) {
          const imageData = await getImageData(messageId);

          if (imageData) {
            // Find and update the message with image data
            messages = messages.map((msg: Message) =>
              msg.id === messageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      hasImage: true,
                      imageUrl: imageData,
                    },
                  }
                : msg
            );
          }
        }
      }
    } catch (error) {
      console.error("Error restoring image data:", error);
    }

    setThreadLoading(false);
    setMessages(messages);
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCreateThread = () => {
    onCreateThread(true);
    if (window.innerWidth < 768 && closeSidebar) {
      closeSidebar();
    }
  };

  // Render the sidebar
  return (
    <div
      className={`${
        isCollapsed ? "w-[60px] md:w-[80px]" : "w-[260px]"
      } bg-white h-full flex 
      flex-col shadow-md transition-all duration-300 border-r border-lightGray overflow-hidden`}
    >
      {/* Logo and brand */}
      <div className="bg-mint text-white p-3 flex items-center justify-center flex-shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <GiDna1 size={24} />
            <span className="font-bold">Microbial AI</span>
          </div>
        ) : (
          <GiDna1 size={24} />
        )}
      </div>

      {/* Top icons: Toggle and Create Thread */}
      <div className="flex justify-between items-center p-3 border-b border-lightGray flex-shrink-0">
        {/* Toggle Sidebar Icon */}
        <button
          onClick={toggleSidebar}
          title="Toggle Sidebar"
          className={`p-2 rounded-full hover:bg-lightGray transition-colors ${
            isCollapsed ? "mx-auto" : ""
          }`}
        >
          <GoSidebarCollapse size={22} className="text-charcoal" />
        </button>

        {/* Create New Thread Icon */}
        {!isCollapsed && (
          <button
            onClick={handleCreateThread}
            title="Create New Chat"
            className="flex items-center space-x-2 bg-mint text-white px-3 py-1 rounded-full hover:bg-purple transition-colors"
          >
            <IoCreateOutline size={18} />
            <span className="text-sm">New Chat</span>
          </button>
        )}
      </div>

      {/* Thread List - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-2 overscroll-contain">
        {!isCollapsed ? (
          <>
            {threads.length > 0 ? (
              threads
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread.id)}
                    className={`p-3 mb-2 cursor-pointer rounded-lg hover:bg-lightGray transition-colors ${
                      selectedThread === thread.id
                        ? "bg-lightGray border-l-4 border-mint"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1 rounded-full ${
                          selectedThread === thread.id
                            ? "bg-mint text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <FaFlask size={14} />
                      </div>
                      <p className="font-medium text-charcoal text-sm truncate">
                        Thread {thread.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-gray-500 mt-4">
                <div className="mb-2 flex justify-center">
                  <GiMicroscope size={24} />
                </div>
                <p className="text-sm">No threads yet</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4 mt-4">
            {threads.length > 0 &&
              threads
                .slice(0, 3)
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread.id)}
                    className={`p-2 cursor-pointer rounded-full ${
                      selectedThread === thread.id
                        ? "bg-mint text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    title={`Thread ${thread.id.substring(0, 8)}`}
                  >
                    <FaFlask size={16} />
                  </div>
                ))}
            <button
              onClick={handleCreateThread}
              className="p-2 rounded-full bg-mint text-white hover:bg-purple transition-colors"
              title="Create New Chat"
            >
              <IoCreateOutline size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadSidebar;
