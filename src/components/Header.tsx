import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaComments,
  FaSignOutAlt,
  FaUsers,
  FaStore,
  FaShoppingCart,
  FaBook,
} from "react-icons/fa";
// import { MdLiveTv } from "react-icons/md";
import { GiDna1 } from "react-icons/gi";
import { useAuth } from "../context/AuthContext";
import { signOut, auth } from "../utils/firebase";
import { getCart } from "../utils/cartUtils";

// SignOut Confirmation Modal component
interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative z-10">
        <h3 className="text-xl font-semibold text-charcoal mb-4">
          Sign Out Confirmation
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to sign out? You'll need to sign in again to
          access your account.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors flex items-center"
          >
            <FaSignOutAlt className="mr-2" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  onAuthModalOpen?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAuthModalOpen = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Load cart item count
  useEffect(() => {
    const loadCartCount = async () => {
      if (currentUser) {
        try {
          const cart = await getCart(currentUser.uid);
          if (cart) {
            const count = cart.items.reduce(
              (total, item) => total + item.quantity,
              0
            );
            setCartItemCount(count);
          } else {
            setCartItemCount(0);
          }
        } catch (error) {
          console.error("Error loading cart count:", error);
          setCartItemCount(0);
        }
      } else {
        setCartItemCount(0);
      }
    };

    loadCartCount();

    // Set up an interval to refresh the cart count every minute
    const intervalId = setInterval(loadCartCount, 60000);

    return () => clearInterval(intervalId);
  }, [currentUser, location.pathname]);

  // Check if route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handle click outside of profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const openSignOutModal = () => {
    setProfileDropdownOpen(false); // Close dropdown when opening modal
    setSignOutModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
      setSignOutModalOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-teal-600 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
          <GiDna1 className="text-2xl" />
          <span>MicrobialAI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden space-x-1 md:flex">
          <Link
            to="/"
            className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
              isActive("/") ? "bg-teal-700 font-medium" : ""
            }`}
          >
            <span className="flex items-center">
              <FaHome className="mr-1" /> Home
            </span>
          </Link>
          <Link
            to="/communities"
            className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
              location.pathname.includes("/communities")
                ? "bg-teal-700 font-medium"
                : ""
            }`}
          >
            <span className="flex items-center">
              <FaUsers className="mr-1" /> Whizpar
            </span>
          </Link>
          <Link
            to="/marketplace"
            className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
              location.pathname.includes("/marketplace")
                ? "bg-teal-700 font-medium"
                : ""
            }`}
          >
            <span className="flex items-center">
              <FaStore className="mr-1" /> Marketplace
            </span>
          </Link>
          <Link
            to="/articles"
            className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
              location.pathname.includes("/articles")
                ? "bg-teal-700 font-medium"
                : ""
            }`}
          >
            <span className="flex items-center">
              <FaBook className="mr-1" /> Articles
            </span>
          </Link>
          <Link
            to="/chat"
            className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
              location.pathname.includes("/chat")
                ? "bg-teal-700 font-medium"
                : ""
            }`}
          >
            <span className="flex items-center">
              <FaComments className="mr-1" /> Chat
            </span>
          </Link>
        </nav>

        {/* User Actions (Desktop) */}
        <div className="hidden items-center space-x-2 md:flex">
          {currentUser && (
            <Link
              to="/marketplace/cart"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                location.pathname.includes("/marketplace/cart")
                  ? "bg-teal-700 font-medium"
                  : ""
              } relative`}
            >
              <span className="flex items-center">
                <FaShoppingCart className="mr-1" /> Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </span>
            </Link>
          )}

          {currentUser ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center rounded-full border-2 border-white bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
              >
                {currentUser.displayName ||
                  currentUser.email?.split("@")[0] ||
                  "User"}
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={openSignOutModal}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAuthModalOpen}
              className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-teal-700 hover:bg-gray-100"
            >
              <FaSignInAlt className="mr-1" /> Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded p-2 text-white hover:bg-teal-700 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-teal-800 pb-4 md:hidden">
          <nav className="flex flex-col space-y-1 px-2 pt-2">
            <Link
              to="/"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                isActive("/") ? "bg-teal-700 font-medium" : ""
              }`}
            >
              <span className="flex items-center">
                <FaHome className="mr-2" /> Home
              </span>
            </Link>
            <Link
              to="/communities"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                location.pathname.includes("/communities")
                  ? "bg-teal-700 font-medium"
                  : ""
              }`}
            >
              <span className="flex items-center">
                <FaUsers className="mr-2" /> Whizpar
              </span>
            </Link>
            <Link
              to="/marketplace"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                location.pathname.includes("/marketplace")
                  ? "bg-teal-700 font-medium"
                  : ""
              }`}
            >
              <span className="flex items-center">
                <FaStore className="mr-2" /> Marketplace
              </span>
            </Link>
            <Link
              to="/articles"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                location.pathname.includes("/articles")
                  ? "bg-teal-700 font-medium"
                  : ""
              }`}
            >
              <span className="flex items-center">
                <FaBook className="mr-2" /> Articles
              </span>
            </Link>
            <Link
              to="/chat"
              className={`rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                location.pathname.includes("/chat")
                  ? "bg-teal-700 font-medium"
                  : ""
              }`}
            >
              <span className="flex items-center">
                <FaComments className="mr-2" /> Chat
              </span>
            </Link>

            <div className="border-t border-teal-700 pt-2 mt-2">
              {currentUser && (
                <Link
                  to="/marketplace/cart"
                  className={`block rounded px-3 py-2 transition-colors hover:bg-teal-700 ${
                    location.pathname.includes("/marketplace/cart")
                      ? "bg-teal-700 font-medium"
                      : ""
                  } relative`}
                >
                  <span className="flex items-center">
                    <FaShoppingCart className="mr-2" /> Cart
                    {cartItemCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block rounded px-3 py-2 text-white hover:bg-teal-700"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={openSignOutModal}
                    className="block w-full rounded px-3 py-2 text-left text-white hover:bg-teal-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={onAuthModalOpen}
                  className="flex w-full items-center justify-center rounded bg-white px-3 py-2 text-teal-700 hover:bg-gray-100"
                >
                  <FaSignInAlt className="mr-1" /> Sign In
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </header>
  );
};

export default Header;
