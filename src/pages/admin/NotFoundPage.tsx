import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-purple mb-2 flex items-center">
          <FiAlertTriangle className="mr-2" /> Page Not Found
        </h1>
        <p className="text-gray-600">
          The page you're looking for doesn't exist in the admin area
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-20 h-20 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="text-purple text-3xl" />
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-4">
          404 - Not Found
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          The page you were looking for doesn't exist or you may not have
          permission to view it.
        </p>
        <Link
          to="/admin/activity"
          className="px-5 py-2 bg-purple text-white rounded-lg hover:bg-opacity-90 transition-colors inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
