import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  // FaClipboardList,
  FaCalendarAlt,
} from "react-icons/fa";
import Notification from "../ui/Notification";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  expertId: string;
  isAvailable: boolean;
}

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  clientId: string;
  clientName: string;
  date: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

const ExpertServiceManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"services" | "bookings">(
    "services"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [notification, setNotification] = useState({
    type: "success" as "success" | "error" | "info",
    message: "",
    isVisible: false,
  });

  // Sample service categories for microbiology experts
  // const serviceCategories = [
  //   "Consultation",
  //   "Lab Setup",
  //   "Method Development",
  //   "Quality Control",
  //   "Data Analysis",
  //   "Training",
  //   "Research Support",
  //   "Other",
  // ];

  // Sample services data - in a real app, this would come from Firestore
  useEffect(() => {
    if (currentUser) {
      // Simulate loading services from database
      setTimeout(() => {
        setServices([
          {
            id: "1",
            title: "Microbiology Lab Setup Consultation",
            description:
              "Expert guidance on setting up a new microbiology laboratory, including equipment recommendations and workflow design.",
            price: 150,
            duration: 60,
            category: "Lab Setup",
            expertId: currentUser.uid,
            isAvailable: true,
          },
          {
            id: "2",
            title: "Microbial Identification Training",
            description:
              "Hands-on training for identifying common microbial species using microscopy and culture techniques.",
            price: 200,
            duration: 120,
            category: "Training",
            expertId: currentUser.uid,
            isAvailable: true,
          },
          {
            id: "3",
            title: "Research Methodology Review",
            description:
              "Critical review of microbiology research methodologies with recommendations for improvement.",
            price: 100,
            duration: 45,
            category: "Research Support",
            expertId: currentUser.uid,
            isAvailable: false,
          },
        ]);

        // Sample bookings
        setBookings([
          {
            id: "b1",
            serviceId: "1",
            serviceName: "Microbiology Lab Setup Consultation",
            clientId: "client123",
            clientName: "Lagos University",
            date: new Date(Date.now() + 86400000), // tomorrow
            status: "confirmed",
          },
          {
            id: "b2",
            serviceId: "2",
            serviceName: "Microbial Identification Training",
            clientId: "client456",
            clientName: "Nigerian Institute of Medical Research",
            date: new Date(Date.now() + 172800000), // day after tomorrow
            status: "pending",
          },
        ]);

        setLoading(false);
      }, 1000);
    }
  }, [currentUser]);

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

  const handleAddService = () => {
    // In a real app, this would add the service to Firestore
    handleNotification("Service added successfully!");
    setShowAddModal(false);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleUpdateService = () => {
    // In a real app, this would update the service in Firestore
    handleNotification("Service updated successfully!");
    setShowEditModal(false);
  };

  const handleDeleteService = (serviceId: string) => {
    // In a real app, this would delete the service from Firestore
    setServices(services.filter((s) => s.id !== serviceId));
    handleNotification("Service deleted successfully!");
  };

  const handleToggleAvailability = (serviceId: string) => {
    // In a real app, this would update the service in Firestore
    setServices(
      services.map((service) =>
        service.id === serviceId
          ? { ...service, isAvailable: !service.isAvailable }
          : service
      )
    );
    handleNotification("Service availability updated!");
  };

  const handleUpdateBookingStatus = (
    bookingId: string,
    status: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    // In a real app, this would update the booking in Firestore
    setBookings(
      bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );
    handleNotification(`Booking ${status}!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
      </div>
    );
  }

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
            className={`py-3 px-6 ${
              activeTab === "services"
                ? "border-b-2 border-purple text-purple font-medium"
                : "text-gray-500 hover:text-purple"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>
          <button
            className={`py-3 px-6 ${
              activeTab === "bookings"
                ? "border-b-2 border-purple text-purple font-medium"
                : "text-gray-500 hover:text-purple"
            }`}
            onClick={() => setActiveTab("bookings")}
          >
            Bookings
          </button>
        </div>
      </div>

      {activeTab === "services" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-charcoal">
              Your Services
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple text-white px-4 py-2 rounded-md hover:bg-mint transition-colors flex items-center"
              >
                <FaPlus className="mr-2" /> Add New Service
              </button>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-charcoal mb-2">
                No Services Available
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't added any services yet. Add your first service to
                start receiving bookings.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-purple text-white px-4 py-2 rounded-md hover:bg-mint transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" /> Add Your First Service
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {service.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Duration: {service.duration} minutes
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{service.price.toLocaleString()}/hour
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailability(service.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            service.isAvailable
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {service.isAvailable ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-purple hover:text-mint transition-colors mr-4"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
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
          )}
        </>
      )}

      {activeTab === "bookings" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-charcoal">
              Your Bookings
            </h2>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FaCalendarAlt className="mx-auto text-gray-400 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-charcoal mb-2">
                No Bookings Yet
              </h3>
              <p className="text-gray-600">
                You don't have any client bookings yet.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.serviceName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : booking.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.id,
                                  "confirmed"
                                )
                              }
                              className="text-green-600 hover:text-green-800 transition-colors mr-3"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.id,
                                  "cancelled"
                                )
                              }
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleUpdateBookingStatus(booking.id, "completed")
                            }
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Service Modal - in a real app, this would be a more detailed form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-bold text-charcoal">
                Add New Service
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

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                This is a placeholder for the service form. In a real
                application, you would have fields for service title,
                description, price, duration, category, etc.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  className="px-4 py-2 bg-purple text-white rounded-md hover:bg-mint transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-bold text-charcoal">Edit Service</h3>
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

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                This is a placeholder for editing {selectedService.title}. In a
                real application, you would have pre-filled fields for all
                service details.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateService}
                  className="px-4 py-2 bg-purple text-white rounded-md hover:bg-mint transition-colors"
                >
                  Update Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertServiceManagement;
