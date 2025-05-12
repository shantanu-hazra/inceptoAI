import React, { useState } from "react";
import InterviewPage from "../src/pages/Interview/InterviewPage.jsx";
import LoginPage from "../src/pages/Authorization/Login/LoginPage.jsx";
import SignupPage from "../src/pages/Authorization/Signup/SignupPage.jsx";
import ResultPage from "../src/pages/Result/ResultPage.jsx";
import HomePage from "../src/pages/Homepage/Homepage.jsx";
import { AuthProvider } from "../src/contexts/AuthContext/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import InterviewDetailPage from "./pages/Result/DetailedResult.jsx";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

function App() {
  const AppRoutes = () => {
    const location = useLocation();
    return (
      <>
        <Routes>
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-details/:resultId"
            element={<InterviewDetailPage />}
          />
        </Routes>
      </>
    );
  };

  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <div className="parent-container">
            <AppRoutes /> {/* Use the custom component to handle routes */}
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
