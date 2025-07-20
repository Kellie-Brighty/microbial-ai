import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaComment,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { getProduct } from "../../utils/marketplaceUtils";
import { Product } from "../../utils/marketplaceUtils";
import { addToCart, getCart } from "../../utils/cartUtils";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/ui/Notification";
import ProductChatModal from "../../components/marketplace/ProductChatModal";
import AuthModal from "../../components/auth/AuthModal";

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRedirectAction, setAuthRedirectAction] = useState<
    "chat" | "cart" | "buy" | null
  >(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // Check if the current user is the product owner
  const isProductOwner = currentUser && product?.vendorId === currentUser.uid;

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const productData = await getProduct(productId);
        if (productData) {
          setProduct(productData);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // Check if product is already in cart
  useEffect(() => {
    const checkCart = async () => {
      if (!currentUser || !product) {
        setIsInCart(false);
        return;
      }

      try {
        const cart = await getCart(currentUser.uid);
        if (cart) {
          const cartItem = cart.items.find(
            (item) => item.productId === product.id
          );
          if (cartItem) {
            setIsInCart(true);
            setCartQuantity(cartItem.quantity);
          } else {
            setIsInCart(false);
          }
        }
      } catch (error) {
        console.error("Error checking cart:", error);
      }
    };

    checkCart();
  }, [currentUser, product]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value, 10));
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      setAuthRedirectAction("cart");
      setAuthModalOpen(true);
      return;
    }

    if (isProductOwner) {
      showNotification("You cannot purchase your own product", "error");
      return;
    }

    if (isInCart) {
      showNotification(
        `This product is already in your cart (Quantity: ${cartQuantity})`,
        "info"
      );
      return;
    }

    if (!product) return;

    try {
      await addToCart(currentUser.uid, product, quantity);
      setIsInCart(true);
      setCartQuantity(quantity);
      showNotification(
        `Added ${quantity} ${product.name} to your cart`,
        "success"
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification(
        "Failed to add item to cart. Please try again.",
        "error"
      );
    }
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      setAuthRedirectAction("buy");
      setAuthModalOpen(true);
      return;
    }

    if (isProductOwner) {
      showNotification("You cannot purchase your own product", "error");
      return;
    }

    // TODO: Implement actual checkout functionality
    showNotification(
      `Proceeding to checkout with ${quantity} ${product?.name}`,
      "success"
    );
  };

  const handleContactVendor = () => {
    if (!currentUser) {
      setAuthRedirectAction("chat");
      setAuthModalOpen(true);
      return;
    }

    setShowChatModal(true);
  };

  const handleAuthSuccess = (message: string) => {
    showNotification(message, "success");

    // Perform the action that was attempted before authentication
    if (authRedirectAction === "chat") {
      setShowChatModal(true);
    } else if (authRedirectAction === "cart" && product) {
      addToCart(currentUser!.uid, product, quantity)
        .then(() => {
          setIsInCart(true);
          setCartQuantity(quantity);
          showNotification(
            `Added ${quantity} ${product.name} to your cart`,
            "success"
          );
        })
        .catch((error) => {
          console.error("Error adding to cart:", error);
          showNotification(
            "Failed to add item to cart. Please try again.",
            "error"
          );
        });
    } else if (authRedirectAction === "buy") {
      // TODO: Implement checkout functionality
      showNotification(
        `Proceeding to checkout with ${quantity} ${product?.name}`,
        "success"
      );
    }

    // Reset the redirect action
    setAuthRedirectAction(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaInfoCircle className="mx-auto text-red-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold text-charcoal mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The requested product could not be found."}
            </p>
            <Link
              to="/marketplace/products"
              className="bg-mint text-white px-6 py-2 rounded-md hover:bg-purple transition-colors"
            >
              Browse Other Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />

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
        redirectPath={`/marketplace/product/${productId}`}
      />

      {showChatModal && (
        <ProductChatModal
          product={product!}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/marketplace/products"
            className="inline-flex items-center text-mint hover:text-purple transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Products
          </Link>
        </div>

        {!currentUser && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-blue-700">
              You're browsing as a guest. Sign in to add products to your cart
              or chat with vendors.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden h-80">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img
                    src={product.imageUrls[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaShoppingCart className="text-gray-400 text-5xl" />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {product.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden ${
                        index === activeImageIndex
                          ? "border-mint"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-charcoal mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {product.category}
                  </span>
                  <span className="text-gray-500 text-sm">
                    Sold by: {product.vendorName}
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple mb-4">
                  ₦{product.price.toLocaleString()}
                </div>
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`flex items-center ${
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {product.stock > 0 ? (
                        <>
                          <FaCheckCircle className="mr-1" /> In Stock
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="mr-1" /> Out of Stock
                        </>
                      )}
                    </span>
                    {product.stock > 0 && (
                      <span className="text-gray-500 text-sm">
                        ({product.stock} available)
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mb-6">{product.description}</p>
              </div>

              {/* Purchase Options */}
              {product?.stock > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label htmlFor="quantity" className="text-gray-700">
                      Quantity:
                    </label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                      disabled={isProductOwner || isInCart}
                    >
                      {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    {isProductOwner ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <p className="text-yellow-700">
                          This is your product. You cannot purchase your own
                          product.
                        </p>
                      </div>
                    ) : isInCart ? (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-blue-700">
                            This product is already in your cart (Quantity:{" "}
                            {cartQuantity})
                          </p>
                          <Link
                            to="/marketplace/cart"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                          >
                            View Cart
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handleAddToCart}
                          className="bg-mint text-white px-6 py-3 rounded-md hover:bg-purple transition-colors flex-1 flex items-center justify-center"
                        >
                          <FaShoppingCart className="mr-2" /> Add to Cart
                        </button>
                        <button
                          onClick={handleBuyNow}
                          className="bg-purple text-white px-6 py-3 rounded-md hover:bg-mint transition-colors flex-1"
                        >
                          Buy Now
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleContactVendor}
                    className="w-full border border-gray-300 text-charcoal px-6 py-3 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <FaComment className="mr-2" /> Chat with Vendor
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Product Specifications */}
          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div className="border-t border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-charcoal mb-4">
                  Specifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div key={key} className="flex">
                        <div className="w-1/3 font-medium text-gray-700">
                          {key}:
                        </div>
                        <div className="w-2/3 text-gray-600">{value}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
