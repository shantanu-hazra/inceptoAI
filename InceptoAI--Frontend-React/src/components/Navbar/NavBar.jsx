import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthProvider.jsx";
import "./NavBar.css";

const Navbar = () => {
  const { userId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to determine if link is active
  const isActive = (path) => location.pathname === path;

  const handleAuth = (act) => {
    if (act === "logout") {
      logout();
      navigate("/");
    }
  };

  const handleLogin = () => {
    navigate("/login", { state: { from: window.location.pathname } });
  };

  const handleSignup = () => {
    navigate("/signup", { state: { from: window.location.pathname } });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="nav-item">
            <Link className="logo-text" to="/">
              InceptoAI
            </Link>
          </div>
          <div className="nav-item">
            <Link
              to="/interview"
              className={`nav-link ${isActive("/interview") ? "active" : ""}`}
            >
              New Interview
            </Link>
          </div>
        </div>
        <div className="navbar-right">
          {userId === null ? (
            <>
              <div className="nav-item">
                <button onClick={handleLogin} className="auth-button">
                  Login
                </button>
              </div>
              <div className="nav-item">
                <button onClick={handleSignup} className="auth-button">
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="nav-item">
                <button
                  onClick={() => handleAuth("logout")}
                  className="auth-button"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
