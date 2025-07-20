import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaInfoCircle,
  FaSignInAlt,
} from "react-icons/fa";
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  CartItem,
} from "../../utils/cartUtils";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/ui/Notification";
import AuthModal from "../../components/auth/AuthModal";

const CartPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  useEffect(() => {
    // Load cart data if user is authenticated
    if (currentUser) {
      loadCart();
    } else {
      // If not authenticated, just stop loading
      setLoading(false);
    }
  }, [currentUser]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const cart = await getCart(currentUser!.uid);
      if (cart) {
        setCartItems(cart.items);
        setTotalAmount(cart.totalAmount);
      } else {
        setCartItems([]);
        setTotalAmount(0);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      showNotification("Failed to load your cart", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await updateCartItemQuantity(currentUser.uid, itemId, newQuantity);

      // Update local state
      const updatedItems = cartItems.map((item) => {
        if (item.id === itemId) {
          const quantityDiff = newQuantity - item.quantity;
          setTotalAmount((prev) => prev + item.price * quantityDiff);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error updating quantity:", error);
      showNotification("Failed to update quantity", "error");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await removeFromCart(currentUser.uid, itemId);

      // Update local state
      const itemToRemove = cartItems.find((item) => item.id === itemId);
      if (itemToRemove) {
        setTotalAmount(
          (prev) => prev - itemToRemove.price * itemToRemove.quantity
        );
      }

      setCartItems(cartItems.filter((item) => item.id !== itemId));
      showNotification("Item removed from cart", "success");
    } catch (error) {
      console.error("Error removing item:", error);
      showNotification("Failed to remove item", "error");
    }
  };

  const handleClearCart = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (cartItems.length === 0) return;

    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart(currentUser.uid);
        setCartItems([]);
        setTotalAmount(0);
        showNotification("Cart cleared", "success");
      } catch (error) {
        console.error("Error clearing cart:", error);
        showNotification("Failed to clear cart", "error");
      }
    }
  };

  const handleCheckout = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    // TODO: Implement checkout functionality
    navigate("/marketplace/checkout");
  };

  const handleAuthSuccess = (message: string) => {
    showNotification(message, "success");

    // Load cart after successful authentication
    if (currentUser) {
      loadCart();
    }
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({
      message,
      type,
      isVisible: true,
    });

    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {notification.isVisible && (
        <Notification
          isVisible={notification.isVisible}
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification((prev) => ({ ...prev, isVisible: false }))
          }
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        redirectPath="/marketplace/cart"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/marketplace/products"
            className="inline-flex items-center text-mint hover:text-purple transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Continue Shopping
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-charcoal mb-6 flex items-center">
              <FaShoppingCart className="mr-3" /> Your Shopping Cart
            </h1>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
              </div>
            ) : !currentUser ? (
              <div className="text-center py-12">
                <FaSignInAlt className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-charcoal mb-2">
                  Sign In to View Your Cart
                </h2>
                <p className="text-gray-600 mb-6">
                  You need to be signed in to view and manage your shopping cart
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-mint text-white px-6 py-2 rounded-md hover:bg-purple transition-colors inline-block"
                >
                  Sign In Now
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-12">
                <FaInfoCircle className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-charcoal mb-2">
                  Your Cart is Empty
                </h2>
                <p className="text-gray-600 mb-6">
                  Browse our marketplace to find laboratory equipment and
                  supplies
                </p>
                <Link
                  to="/marketplace/products"
                  className="bg-mint text-white px-6 py-2 rounded-md hover:bg-purple transition-colors inline-block"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              // ... rest of the cart display code remains the same
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="h-12 w-12 rounded-md mr-4 object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                                  <FaShoppingCart className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <Link
                                  to={`/marketplace/product/${item.productId}`}
                                  className="text-charcoal font-medium hover:text-mint"
                                >
                                  {item.productName}
                                </Link>
                                <div className="text-sm text-gray-500">
                                  Sold by: {item.vendorName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₦{item.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <FaMinus className="text-gray-600" />
                              </button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <FaPlus className="text-gray-600" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={handleClearCart}
                      className="text-gray-500 hover:text-red-500 transition-colors flex items-center"
                      disabled={cartItems.length === 0}
                    >
                      <FaTrash className="mr-2" /> Clear Cart
                    </button>
                    <div className="text-right">
                      <div className="text-gray-600 mb-1">Subtotal:</div>
                      <div className="text-2xl font-bold text-charcoal">
                        ₦{totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCheckout}
                      className="bg-mint text-white px-8 py-3 rounded-md hover:bg-purple transition-colors flex items-center"
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
