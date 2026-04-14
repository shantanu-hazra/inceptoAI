import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Changed to use state for isAuthenticated instead of a function
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update isAuthenticated whenever userId changes
  useEffect(() => {
    setIsAuthenticated(!!userId);
  }, [userId]);

  const login = (id) => {
    setUserId(id);
  };

  const signup = (id) => {
    setUserId(id);
  };

  const logout = () => {
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, signup, userId, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
