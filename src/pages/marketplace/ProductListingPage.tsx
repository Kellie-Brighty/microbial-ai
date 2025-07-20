import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaFilter, FaShoppingCart } from "react-icons/fa";
import { getAvailableProducts } from "../../utils/marketplaceUtils";
import { Product } from "../../utils/marketplaceUtils";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

const ProductListingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sample product categories for microbiology lab equipment
  const productCategories = [
    "All Categories",
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
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const category =
          selectedCategory === "All Categories" || !selectedCategory
            ? undefined
            : selectedCategory;
        const loadedProducts = await getAvailableProducts(category);

        // Filter by search query if present
        const filteredProducts = searchQuery
          ? loadedProducts.filter(
              (product) =>
                product.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                product.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            )
          : loadedProducts;

        setProducts(filteredProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === "All Categories" ? null : category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-r from-mint to-purple py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Lab Equipment & Supplies
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Browse high-quality laboratory equipment and supplies from
              verified vendors
            </p>

            {!currentUser && (
              <div className="bg-white bg-opacity-20 text-white p-3 rounded-lg mb-6 inline-block">
                <p>
                  You can browse all products freely. Sign in to make purchases
                  or contact vendors.
                </p>
              </div>
            )}

            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full py-3 px-5 pr-12 rounded-full border-none focus:ring-2 focus:ring-mint"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <FaSearch className="absolute right-5 top-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Categories sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                <FaFilter className="mr-2" /> Categories
              </h3>
              <ul className="space-y-2">
                {productCategories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        (category === "All Categories" && !selectedCategory) ||
                        selectedCategory === category
                          ? "bg-mint text-white font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? "No products match your search criteria. Try a different search term."
                    : selectedCategory
                    ? `No products available in the ${selectedCategory} category.`
                    : "There are currently no products available in the marketplace."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 overflow-hidden">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FaShoppingCart className="text-gray-400 text-4xl" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-charcoal">
                          {product.name}
                        </h3>
                        <span className="text-mint font-bold">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {product.category}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock > 0
                            ? `${product.stock} in stock`
                            : "Out of stock"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <Link
                          to={`/marketplace/product/${product.id}`}
                          className="block w-full bg-mint text-white text-center py-2 rounded-md hover:bg-purple transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListingPage;
