import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxOpen,
  FaUpload,
  FaComment,
} from "react-icons/fa";
import Notification from "../ui/Notification";
import {
  Product,
  getVendorProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../../utils/marketplaceUtils";
import { getUserProfile } from "../../utils/firebase";
import VendorChatManagement from "./VendorChatManagement";

const VendorProductManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "chats">("products");

  // Form states
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [vendorName, setVendorName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample product categories for microbiology lab equipment
  const productCategories = [
    "Microscopes",
    "Culture Media",
    "Glassware",
    "Safety Equipment",
    "Sterilization Equipment",
    "Incubators",
    "Centrifuges",
    "PCR Equipment",
    "Consumables",
    "Other",
  ];

  useEffect(() => {
    if (currentUser) {
      loadProducts();
      loadVendorName();
    }
  }, [currentUser]);

  const loadVendorName = async () => {
    if (!currentUser) return;

    try {
      const userProfile = await getUserProfile(currentUser.uid);
      if (userProfile) {
        setVendorName(userProfile.displayName || "Unknown Vendor");
      }
    } catch (error) {
      console.error("Error loading vendor name:", error);
    }
  };

  const loadProducts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const loadedProducts = await getVendorProducts(currentUser.uid);
      setProducts(loadedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      handleNotification("Failed to load products. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNotification = (
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

  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory("");
    setProductStock("");
    setProductImages([]);
    setImagePreviewUrls([]);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      handleNotification("You must be logged in to add products", "error");
      return;
    }

    // Validate form
    if (
      !productName ||
      !productDescription ||
      !productPrice ||
      !productCategory ||
      !productStock
    ) {
      handleNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images first
      const imageUrls: string[] = [];

      for (const image of productImages) {
        const imageUrl = await uploadProductImage(image, currentUser.uid);
        imageUrls.push(imageUrl);
      }

      // Create product
      const newProduct: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice),
        category: productCategory,
        stock: parseInt(productStock),
        imageUrls: imageUrls,
        vendorId: currentUser.uid,
        vendorName: vendorName,
        isAvailable: true,
      };

      await createProduct(newProduct);

      // Refresh product list
      await loadProducts();

      // Reset form and close modal
      resetForm();
      setShowAddModal(false);

      handleNotification("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      handleNotification("Failed to add product. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);

    // Populate form fields
    setProductName(product.name);
    setProductDescription(product.description);
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setProductStock(product.stock.toString());
    setImagePreviewUrls(product.imageUrls || []);

    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !selectedProduct) {
      handleNotification("Error updating product", "error");
      return;
    }

    // Validate form
    if (
      !productName ||
      !productDescription ||
      !productPrice ||
      !productCategory ||
      !productStock
    ) {
      handleNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle image uploads for new images
      const existingImageUrls = selectedProduct.imageUrls || [];
      let updatedImageUrls = [...existingImageUrls];

      if (productImages.length > 0) {
        for (const image of productImages) {
          const imageUrl = await uploadProductImage(image, currentUser.uid);
          updatedImageUrls.push(imageUrl);
        }
      }

      // Update product
      const updatedProduct: Partial<Product> = {
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice),
        category: productCategory,
        stock: parseInt(productStock),
        imageUrls: updatedImageUrls,
      };

      await updateProduct(selectedProduct.id!, updatedProduct);

      // Refresh product list
      await loadProducts();

      // Reset form and close modal
      resetForm();
      setShowEditModal(false);

      handleNotification("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      handleNotification(
        "Failed to update product. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProduct(productId);

      // Refresh product list
      await loadProducts();

      handleNotification("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      handleNotification(
        "Failed to delete product. Please try again.",
        "error"
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFiles.push(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrls.push(reader.result as string);
        if (newPreviewUrls.length === files.length) {
          setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        }
      };
      reader.readAsDataURL(file);
    }

    setProductImages((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveImage = (index: number) => {
    // For new images
    if (index < productImages.length) {
      setProductImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }
    // For existing images in edit mode
    else if (selectedProduct && selectedProduct.imageUrls) {
      const adjustedIndex = index - productImages.length;
      const updatedImageUrls = [...selectedProduct.imageUrls];
      updatedImageUrls.splice(adjustedIndex, 1);

      setSelectedProduct({
        ...selectedProduct,
        imageUrls: updatedImageUrls,
      });

      setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
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

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === "products"
                ? "border-b-2 border-mint text-mint"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            <FaBoxOpen className="inline mr-2" /> Products
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === "chats"
                ? "border-b-2 border-mint text-mint"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <FaComment className="inline mr-2" /> Customer Chats
          </button>
        </div>
      </div>

      {activeTab === "products" ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-charcoal">
              Your Products
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-mint text-white px-4 py-2 rounded-md hover:bg-purple transition-colors flex items-center"
            >
              <FaPlus className="mr-2" /> Add Product
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaBoxOpen className="mx-auto text-gray-300 text-5xl mb-4" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                No Products Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't added any products to your store yet. Start selling
                by adding your first product.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-mint text-white px-6 py-2 rounded-md hover:bg-purple transition-colors inline-flex items-center"
              >
                <FaPlus className="mr-2" /> Add Your First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="h-48 bg-gray-200 relative">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBoxOpen className="text-gray-400 text-5xl" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                        title="Edit Product"
                      >
                        <FaEdit className="text-mint" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                        title="Delete Product"
                      >
                        <FaTrash className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-charcoal mb-1">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple font-bold">
                        ₦{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full inline-block mb-2">
                      {product.category}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b px-6 py-4">
                  <h3 className="text-xl font-bold text-charcoal">
                    Add New Product
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productStock}
                        onChange={(e) => setProductStock(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      >
                        <option value="">Select a category</option>
                        {productCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Images
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                        >
                          <FaUpload className="mr-2" />
                          Upload Images
                        </button>
                      </div>

                      {imagePreviewUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="h-24 w-full object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {showEditModal && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b px-6 py-4">
                  <h3 className="text-xl font-bold text-charcoal">
                    Edit Product
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateProduct} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productStock}
                        onChange={(e) => setProductStock(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-mint focus:border-mint"
                        required
                      >
                        <option value="">Select a category</option>
                        {productCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Images
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint"
                        >
                          <FaUpload className="mr-2" />
                          Upload Images
                        </button>
                      </div>

                      {imagePreviewUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="h-24 w-full object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-mint text-white rounded-md hover:bg-purple transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Updating..." : "Update Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <VendorChatManagement />
      )}
    </div>
  );
};

export default VendorProductManagement;
