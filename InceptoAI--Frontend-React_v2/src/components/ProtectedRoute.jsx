import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext/AuthProvider";

// This is a wrapper component for protected routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Now isAuthenticated is a boolean state, not a function
  if (!isAuthenticated) {
    // Redirect to login page and pass the location they attempted to visit
    return <Navigate to="/login" state={{ from: location }} />;
  }
  return children;
};

export default ProtectedRoute;
