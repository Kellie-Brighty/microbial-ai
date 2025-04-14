import React, { useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-50"
      : type === "error"
      ? "bg-red-50"
      : "bg-blue-50";

  const borderColor =
    type === "success"
      ? "border-green-400"
      : type === "error"
      ? "border-red-400"
      : "border-blue-400";

  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
      ? "text-red-800"
      : "text-blue-800";

  const Icon =
    type === "success"
      ? FaCheckCircle
      : type === "error"
      ? FaTimesCircle
      : FaCheckCircle;

  const iconColor =
    type === "success"
      ? "text-green-500"
      : type === "error"
      ? "text-red-500"
      : "text-blue-500";

  return (
    <div className="fixed top-20 right-4 z-[100] max-w-md animate-fade-in">
      <div
        className={`${bgColor} ${borderColor} ${textColor} border rounded-md p-4 shadow-md flex items-start`}
      >
        <div className={`${iconColor} mr-3 flex-shrink-0 pt-0.5`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 mr-2">{message}</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
