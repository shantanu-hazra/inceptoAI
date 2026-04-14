import React, { useEffect, useState } from "react";
import { CalendarDays, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthProvider";
import Navbar from "../../components/Navbar/NavBar.jsx";
import InterviewResultsTable from "../../components/Homepage/InterviewResultsTable.jsx";
import "../../styles/Homepage/Homepage.css";
import axios from "axios";
import { getAllResult, getResult } from "../../utils/userPaths.js";

const HomePage = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [interviewResults, setInterviewResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch results if user is logged in
    if (userId) {
      fetchInterviewResults();
    }
  }, [userId]);

  const fetchInterviewResults = async () => {
    setLoading(true);
    try {
      // Use userId from context instead of hardcoded value
      const response = await axios.get(`${getAllResult}${userId}`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch interview results");
      }

      // Ensure we're correctly accessing the interview results in the response
      // Check the structure and make sure we're extracting the array correctly
      const results = response.data.interviewResults || response.data || [];

      setInterviewResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Error fetching interview results:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function handleStart() {
    navigate("/interview");
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="home-container">
        <div className="hero-section">
          <h1 className="hero-title">Your AI powered interview analyser</h1>
          <p className="hero-subtitle">
            Get instant insights on your speaking clarity, confidence, body
            language, and technical fluency. Train smart for your next big
            opportunity.
          </p>
          <button className="hero-button" onClick={handleStart}>
            Start Interview
          </button>
        </div>

        <div className="card-stack">
          <div className="feature-banner">
            <div className="icon-wrapper blue-icon">
              <CalendarDays size={32} />
            </div>
            <div className="banner-text">
              <h3 className="feature-title">Practice Sessions</h3>
              <p className="feature-description">
                Schedule mock interviews with AI to simulate real-world
                scenarios. Ideal for brushing up technical, behavioral, and HR
                questions.
              </p>
            </div>
          </div>

          <div className="feature-banner">
            <div className="icon-wrapper green-icon">
              <BookOpen size={32} />
            </div>
            <div className="banner-text">
              <h3 className="feature-title">Topics</h3>
              <p className="feature-description">
                Explore structured topics like DSA, System Design, DBMS, OS and
                more.
              </p>
            </div>
          </div>

          <div className="feature-banner">
            <div className="icon-wrapper blue-icon">
              <User size={32} />
            </div>
            <div className="banner-text">
              <h3 className="feature-title">Mock Interviews</h3>
              <p className="feature-description">
                Experience interactive AI interviews. Get real-time feedback on
                your performance.
              </p>
            </div>
          </div>

          {/* Include the Interview Results Table component */}
          <InterviewResultsTable
            userId={userId}
            interviewResults={interviewResults}
            loading={loading}
            error={error}
            fetchInterviewResults={fetchInterviewResults}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
