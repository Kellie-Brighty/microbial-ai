import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import Login from "./Login";
import SignUp from "./SignUp";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  redirectPath?: string;
  initialView?: "login" | "signup";
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  redirectPath,
  initialView = "login",
}) => {
  const [isLogin, setIsLogin] = useState(initialView === "login");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialView === "login");
    }
  }, [isOpen, initialView]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSignInSuccess = (
    message: string,
    setSubmitting?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    // If setSubmitting is provided, call it with false
    if (setSubmitting) {
      setSubmitting(false);
    }

    onSuccess(message);
    onClose();

    if (redirectPath) {
      navigate(redirectPath);
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

          {isLogin ? (
            <Login
              onToggleForm={toggleForm}
              onClose={onClose}
              onSuccess={handleSignInSuccess}
            />
          ) : (
            <SignUp
              onToggleForm={toggleForm}
              onClose={onClose}
              onSuccess={handleSignInSuccess}
            />
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AuthModal;
