import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaFilter, FaUserMd, FaClock } from "react-icons/fa";
import { getAvailableServices } from "../../utils/marketplaceUtils";
import { Service } from "../../utils/marketplaceUtils";
import Header from "../../components/Header";
// import { useAuth } from "../../context/AuthContext";

const ServiceListingPage: React.FC = () => {
  // const { currentUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sample service categories for microbiology experts
  const serviceCategories = [
    "All Categories",
    "Consultation",
    "Lab Setup",
    "Method Development",
    "Quality Control",
    "Data Analysis",
    "Training",
    "Research Support",
    "Other",
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const category =
          selectedCategory === "All Categories" || !selectedCategory
            ? undefined
            : selectedCategory;
        const loadedServices = await getAvailableServices(category);

        // Filter by search query if present
        const filteredServices = searchQuery
          ? loadedServices.filter(
              (service) =>
                service.title
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                service.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            )
          : loadedServices;

        setServices(filteredServices);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === "All Categories" ? null : category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr${hours > 1 ? "s" : ""}`;
    }

    return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-r from-purple to-mint py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Expert Microbiology Services
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Connect with verified microbiology experts for specialized
              services
            </p>

            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full py-3 px-5 pr-12 rounded-full border-none focus:ring-2 focus:ring-purple"
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
                {serviceCategories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        (category === "All Categories" && !selectedCategory) ||
                        selectedCategory === category
                          ? "bg-purple text-white font-medium"
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

          {/* Service grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-lg font-medium text-charcoal mb-2">
                  No Services Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? "No services match your search criteria. Try a different search term."
                    : selectedCategory
                    ? `No services available in the ${selectedCategory} category.`
                    : "There are currently no expert services available in the marketplace."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex">
                      <div className="w-1/3 bg-purple bg-opacity-10 flex items-center justify-center p-4">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.title}
                            className="w-full h-auto object-cover rounded-md"
                          />
                        ) : (
                          <FaUserMd className="text-purple text-5xl" />
                        )}
                      </div>
                      <div className="w-2/3 p-5">
                        <h3 className="text-lg font-semibold text-charcoal mb-2">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-purple font-bold">
                            ₦{service.price.toLocaleString()}
                          </span>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaClock className="mr-1" />
                            {formatDuration(service.duration)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {service.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            by {service.expertName}
                          </span>
                        </div>
                        <div className="mt-4">
                          <Link
                            to={`/marketplace/service/${service.id}`}
                            className="block w-full bg-purple text-white text-center py-2 rounded-md hover:bg-mint transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
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

export default ServiceListingPage;
