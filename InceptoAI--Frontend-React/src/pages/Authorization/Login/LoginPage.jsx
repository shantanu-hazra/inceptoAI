import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext/AuthProvider";
import { loginPath } from "../../../utils/userPaths.js";
import { validatePassword, validateEmail } from "../../../utils/validations.js";

import "../../../styles/Authorization/AuthPages.css";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = location.state?.from?.pathname || "/";
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Check for redirect state when component mounts
  useEffect(() => {
    if (location.state?.from) {
      const fromPath = location.state.from.pathname || location.state.from;

      // Make sure fromPath is a string before calling includes
      if (typeof fromPath === "string") {
        // Customize message based on the path they were redirected from
        if (fromPath.includes("interview")) {
          setRedirectMessage("Please log in to access the interview page");
        } else {
          setRedirectMessage("Please log in to continue");
        }
      } else {
        // Default message if fromPath is not a string
        setRedirectMessage("Please log in to continue");
      }
    }
  }, [location]);

  const validateForm = () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
      general: "",
    });

    return !emailError && !passwordError;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else if (name === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const response = await axios.post(loginPath, formData);
      console.log(response);

      if (!response.data || !response.data.id) {
        throw new Error("Invalid response from server");
      }

      // Handle the returnTo path properly
      const returnTo =
        location.state?.from?.pathname ||
        (typeof location.state?.from === "string" ? location.state.from : "/");

      // Set authenticated state first
      await login(response.data.id);

      // Then navigate with a slight delay to ensure state is updated
      setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 100);
    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.status === 401) {
        setErrors((prev) => ({
          ...prev,
          general: "Invalid email or password",
        }));
      } else if (err.request) {
        setErrors((prev) => ({
          ...prev,
          general: "Unable to connect. Please check your internet.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "An unexpected error occurred. Please try again.",
        }));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="brand">Incepto AI</h1>
        <h2 className="welcome-text">Welcome back</h2>

        {/* Display redirect message if present */}
        {redirectMessage && (
          <div className="redirect-message">{redirectMessage}</div>
        )}

        <p className="subtext"></p>

        <form onSubmit={handleSubmit} className="signup-form">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isLoading}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <div className="field-error">
                <p>{errors.email}</p>
              </div>
            )}
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isLoading}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <div className="field-error">
                <p>{errors.password}</p>
              </div>
            )}
          </div>

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">or</div>

        <button type="button" className="google-button">
          Sign in with Google
        </button>

        <p className="login-prompt">
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")}>Sign up</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
