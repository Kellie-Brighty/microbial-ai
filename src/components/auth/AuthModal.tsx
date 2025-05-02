import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import Login from "./Login";
import SignUp from "./SignUp";
import EmailVerification from "./EmailVerification";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  redirectPath?: string;
  initialView?: "login" | "signup" | "verification";
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  redirectPath,
  initialView = "login",
}) => {
  const [currentView, setCurrentView] = useState<
    "login" | "signup" | "verification"
  >(initialView);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
    }
  }, [isOpen, initialView]);

  const toggleForm = () => {
    setCurrentView(currentView === "login" ? "signup" : "login");
  };

  const switchToVerification = () => {
    setCurrentView("verification");
  };

  const handleSuccess = (
    message: string,
    setSubmitting?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    // If setSubmitting is provided, call it with false
    if (setSubmitting) {
      setSubmitting(false);
    }

    onSuccess(message);

    // If it's a verification success, don't close the modal yet
    if (!message.includes("verification") && !message.includes("verify")) {
      onClose();

      if (redirectPath) {
        navigate(redirectPath);
      }
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "login":
        return (
          <Login
            onToggleForm={toggleForm}
            onClose={onClose}
            onSuccess={handleSuccess}
            onSwitchToVerification={switchToVerification}
          />
        );
      case "signup":
        return (
          <SignUp
            onToggleForm={toggleForm}
            onClose={onClose}
            onSuccess={handleSuccess}
          />
        );
      case "verification":
        return <EmailVerification onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <Dialog.Panel className="bg-white relative rounded-xl shadow-2xl w-full max-w-lg mx-auto animate-fadeIn overflow-hidden">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <IoClose size={24} />
          </button>

          {renderView()}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AuthModal;
