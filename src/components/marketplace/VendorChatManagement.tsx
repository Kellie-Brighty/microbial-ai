import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaComment,
  FaSearch,
  FaSpinner,
  FaPaperPlane,
  FaTimes,
  FaBox,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { getProduct } from "../../utils/marketplaceUtils";
import { getUserProfile } from "../../utils/firebase";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  timestamp: any;
  productId: string;
}

interface ChatThread {
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  messages: ChatMessage[];
}

const VendorChatManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorName, setVendorName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const loadVendorName = async () => {
      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          setVendorName(userProfile.displayName || "Anonymous Vendor");
        }
      } catch (error) {
        console.error("Error loading vendor profile:", error);
      }
    };

    loadVendorName();
    setupChatThreadsListener();

    return () => {
      // Cleanup will be handled by setupChatThreadsListener
    };
  }, [currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedThread?.messages]);

  const setupChatThreadsListener = async () => {
    if (!currentUser) return;

    setLoading(true);

    try {
      // Set up real-time listener for all chats where the vendor is a participant
      const chatsQuery = query(
        collection(db, "productChats"),
        where("participants", "array-contains", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(100) // Limit to recent messages for performance
      );

      // Store all active listeners for cleanup
      const listeners: (() => void)[] = [];

      const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
        // Group messages by customer and product
        const threadMap = new Map<string, ChatThread>();

        // Process all messages to identify unique threads
        for (const doc of snapshot.docs) {
          const data = doc.data() as ChatMessage & { participants: string[] };
          data.id = doc.id;

          // Get product details
          const product = await getProduct(data.productId);

          // Skip if product doesn't belong to this vendor
          if (product && product.vendorId !== currentUser.uid) continue;

          // The customer is either the sender (if not the vendor) or the recipient (if vendor is the sender)
          const customerId =
            data.senderId === currentUser.uid
              ? data.recipientId
              : data.senderId;
          const threadKey = `${customerId}-${data.productId}`;

          if (!threadMap.has(threadKey)) {
            // Get customer details
            let customerName =
              data.senderId === currentUser.uid ? "Customer" : data.senderName;
            try {
              const customerProfile = await getUserProfile(customerId);
              if (customerProfile && customerProfile.displayName) {
                customerName = customerProfile.displayName;
              }
            } catch (err) {
              console.error("Error getting customer profile:", err);
            }

            // Create new thread
            threadMap.set(threadKey, {
              customerId: customerId,
              customerName: customerName,
              productId: data.productId,
              productName: product?.name || "Unknown Product",
              lastMessage: data.message,
              lastMessageTime: data.timestamp,
              unreadCount: 0,
              messages: [],
            });
          }

          // Update last message if this is newer
          const thread = threadMap.get(threadKey)!;
          if (
            !thread.lastMessageTime ||
            (data.timestamp &&
              thread.lastMessageTime.seconds < data.timestamp.seconds)
          ) {
            thread.lastMessage = data.message;
            thread.lastMessageTime = data.timestamp;
          }
        }

        // Set up individual listeners for each thread's messages
        for (const [threadKey, _thread] of threadMap.entries()) {
          const [customerId, productId] = threadKey.split("-");

          // Create a query for this specific thread's messages
          const threadQuery = query(
            collection(db, "productChats"),
            where("productId", "==", productId),
            orderBy("timestamp", "asc")
          );

          const threadUnsubscribe = onSnapshot(
            threadQuery,
            (messagesSnapshot) => {
              const messages: ChatMessage[] = [];

              messagesSnapshot.docs.forEach((doc) => {
                const msgData = doc.data() as ChatMessage;

                // Include messages where:
                // 1. The vendor is the sender AND the customer is the recipient, OR
                // 2. The customer is the sender AND the vendor is the recipient
                if (
                  (msgData.senderId === currentUser.uid &&
                    msgData.recipientId === customerId) ||
                  (msgData.senderId === customerId &&
                    msgData.recipientId === currentUser.uid)
                ) {
                  if (msgData.productId === productId) {
                    messages.push({
                      id: doc.id,
                      senderId: msgData.senderId,
                      senderName: msgData.senderName,
                      recipientId: msgData.recipientId,
                      message: msgData.message,
                      timestamp: msgData.timestamp,
                      productId: msgData.productId,
                    });
                  }
                }
              });

              // Sort messages by timestamp
              messages.sort((a, b) => {
                const aTime = a.timestamp?.seconds || 0;
                const bTime = b.timestamp?.seconds || 0;
                return aTime - bTime;
              });

              // Update the thread with real-time messages
              setChatThreads((prevThreads) => {
                return prevThreads.map((prevThread) => {
                  if (
                    prevThread.customerId === customerId &&
                    prevThread.productId === productId
                  ) {
                    return { ...prevThread, messages };
                  }
                  return prevThread;
                });
              });

              // Also update the selected thread if this is the one being viewed
              setSelectedThread((prevSelected) => {
                if (
                  prevSelected &&
                  prevSelected.customerId === customerId &&
                  prevSelected.productId === productId
                ) {
                  return { ...prevSelected, messages };
                }
                return prevSelected;
              });
            }
          );

          listeners.push(threadUnsubscribe);
        }

        // Convert map to array and sort by last message time
        const threads = Array.from(threadMap.values()).sort((a, b) => {
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
        });

        setChatThreads(threads);

        // Update selected thread if it exists in the new threads
        if (selectedThread) {
          const updatedSelectedThread = threads.find(
            (t) =>
              t.customerId === selectedThread.customerId &&
              t.productId === selectedThread.productId
          );
          if (updatedSelectedThread) {
            setSelectedThread(updatedSelectedThread);
          }
        }

        setLoading(false);
      });

      listeners.push(unsubscribe);

      // Return a cleanup function that unsubscribes from all listeners
      return () => {
        listeners.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      console.error("Error setting up chat threads listener:", error);
      setLoading(false);
    }
  };

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
    setMessage("");

    // Scroll to bottom after a small delay to ensure the DOM has updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleCloseModal = () => {
    setSelectedThread(null);
    setMessage("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !selectedThread || !message.trim()) return;

    setSending(true);

    try {
      // Add message to Firestore
      await addDoc(collection(db, "productChats"), {
        senderId: currentUser.uid,
        senderName: vendorName,
        recipientId: selectedThread.customerId,
        message: message.trim(),
        timestamp: serverTimestamp(),
        productId: selectedThread.productId,
        participants: [currentUser.uid, selectedThread.customerId],
      });

      // Clear the message input (the real-time listener will update the UI)
      setMessage("");

      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const now = new Date();
      const messageDate = timestamp.toDate ? timestamp.toDate() : new Date();
      const diffInMs = now.getTime() - messageDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return messageDate.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };

  const filteredThreads = chatThreads.filter(
    (thread) =>
      thread.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.messages.some((msg) =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-mint/10 to-purple/10">
        <h2 className="text-xl font-semibold text-charcoal">Customer Chats</h2>
        <p className="text-gray-600">
          Manage conversations with customers about your products
        </p>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Chat list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse flex flex-col items-center">
              <FaSpinner className="animate-spin text-mint text-2xl mb-2" />
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
              <FaComment className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 mb-1">No chats found</p>
            <p className="text-sm text-gray-400">
              {searchTerm
                ? "Try a different search term"
                : "When customers message you about your products, they'll appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredThreads.map((thread) => (
              <div
                key={`${thread.customerId}-${thread.productId}`}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSelectThread(thread)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-white font-medium">
                    {thread.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-charcoal truncate">
                        {thread.customerName}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {getTimeAgo(thread.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FaBox className="mr-1 text-mint text-xs" />
                      <span className="truncate">{thread.productName}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <div>
                <h3 className="text-lg font-semibold text-charcoal">
                  Chat about {selectedThread.productName}
                </h3>
                <p className="text-sm text-gray-500">
                  with {selectedThread.customerName}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-4 h-96 overflow-y-auto bg-gray-50">
              {selectedThread.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-500 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-400">
                    Start the conversation with {selectedThread.customerName}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === currentUser?.uid
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                          msg.senderId === currentUser?.uid
                            ? "bg-mint text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="text-xs mb-1">
                          {msg.senderId === currentUser?.uid
                            ? "You"
                            : msg.senderName}
                        </div>
                        <div>{msg.message}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {msg.timestamp?.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-mint text-white px-4 py-2 rounded-md hover:bg-purple transition-colors disabled:opacity-50"
                  disabled={!message.trim() || sending}
                >
                  {sending ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorChatManagement;
