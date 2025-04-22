import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CommunityModeration from "../pages/admin/CommunityModeration";
import ModerationPage from "../pages/admin/ModerationPage";
import AdminAuth from "../pages/admin/AdminAuth";
import ActivityDashboard from "../pages/admin/ActivityDashboard";

// Admin routes with simple authentication check
const AdminRoutes: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is authenticated through localStorage
    const adminAuthenticated =
      localStorage.getItem("adminAuthenticated") === "true";
    setIsAdmin(adminAuthenticated);
  }, []);

  if (!isAdmin) {
    return <AdminAuth />;
  }

  return (
    <Routes>
      <Route path="/activity" element={<ActivityDashboard />} />
      <Route path="/moderation" element={<ModerationPage />} />
      <Route path="/communities" element={<CommunityModeration />} />
      <Route path="*" element={<Navigate to="/admin/activity" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
