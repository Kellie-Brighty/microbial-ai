import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../utils/marketplaceUtils";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { getUserProfile } from "../../utils/firebase";

interface ProductChatModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  timestamp: any;
  productId: string;
}

const ProductChatModal: React.FC<ProductChatModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load user's name
  useEffect(() => {
    const loadUserName = async () => {
      if (!currentUser) return;

      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          setUserName(userProfile.displayName || "Anonymous User");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadUserName();
  }, [currentUser]);

  // Load and listen to messages
  useEffect(() => {
    if (!currentUser || !product.id || !isOpen) return;

    setLoading(true);

    // Create a query for messages between the current user and the vendor about this product
    const messagesQuery = query(
      collection(db, "productChats"),
      where("productId", "==", product.id),
      where("participants", "array-contains", currentUser.uid),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatMessages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          recipientId: data.recipientId,
          message: data.message,
          timestamp: data.timestamp,
          productId: data.productId,
        });
      });

      setMessages(chatMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, product.id, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !message.trim() || !product.id) return;

    setSending(true);

    try {
      // Add message to Firestore
      await addDoc(collection(db, "productChats"), {
        senderId: currentUser.uid,
        senderName: userName,
        recipientId: product.vendorId,
        message: message.trim(),
        timestamp: serverTimestamp(),
        productId: product.id,
        participants: [currentUser.uid, product.vendorId],
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">
              Chat about {product.name}
            </h3>
            <p className="text-sm text-gray-500">with {product.vendorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-4 h-96 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <FaSpinner className="animate-spin text-mint text-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">
                Start the conversation with {product.vendorName}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
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
  );
};

export default ProductChatModal;
