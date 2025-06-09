import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  Activity,
  MessageSquare,
  List,
  FileText,
  Download,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/NavBar.jsx";
import "../../styles/Result/ResultPage.css";
import { getResult } from "../../utils/userPaths.js";

const InterviewResultPage = () => {
  const navigate = useNavigate();
  const { resultId } = useParams(); // Using resultId from URL
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultFilePath, setResultFilePath] = useState("");

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get(`${getResult}${resultId}`);
        setInterviewData(response.data);

        // Get file path information
        if (response.data.file_path) {
          setResultFilePath(response.data.url);
        } else {
          // Fallback path construction based on session ID
          setResultFilePath(
            `/storage/interviews/${response.data.session_id}.json`
          );
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching interview data:", err);
        setError("Failed to load interview results. Please try again.");
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [resultId]); // Changed dependency from sessionId to resultId

  // Format seconds to minutes:seconds
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  function handleTryAgain() {
    navigate("/interview");
  }

  function handleViewDetails() {
    // Navigate to detailed results page
    navigate(`/interview-details/${resultId}`);
  }

  function handleDownloadResults() {
    // If you want to implement a direct download
    window.open(
      `/api/interviews/download/${interviewData?.session_id || resultId}`,
      "_blank"
    );
  }

  // Prepare chart data when interview data is available
  const prepareScoreData = () => {
    if (!interviewData) return [];

    return [
      {
        name: "Overall Score",
        score: interviewData.evaluation.overall_score * 10,
        fill: "#FF5252",
      },
      {
        name: "Answer Quality",
        score: interviewData.evaluation.answer_quality.overall_quality,
        fill: "#FFC107",
      },
      {
        name: "Completeness",
        score:
          interviewData.evaluation.ai_evaluation.average_completeness * 100,
        fill: "#2196F3",
      },
      {
        name: "Relevance",
        score: interviewData.evaluation.ai_evaluation.average_relevance * 100,
        fill: "#4CAF50",
      },
      {
        name: "Structure",
        score: interviewData.evaluation.ai_evaluation.average_structure * 100,
        fill: "#9C27B0",
      },
    ];
  };

  // Calculate average WPM from responses
  const calculateAverageWPM = () => {
    if (!interviewData || !interviewData.responses) return 0;

    const responses = Object.values(interviewData.responses);
    const totalWPM = responses.reduce((acc, response) => {
      return acc + (response.speech_analysis?.wpm || 0);
    }, 0);

    return (totalWPM / responses.length).toFixed(1);
  };

  // Calculate average clarity from responses
  const calculateAverageClarity = () => {
    if (!interviewData || !interviewData.responses) return 0;

    const responses = Object.values(interviewData.responses);
    const totalClarity = responses.reduce((acc, response) => {
      return acc + (response.speech_analysis?.clarity || 0);
    }, 0);

    return (totalClarity / responses.length).toFixed(0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="result-container">
          <div className="spinner"></div>
          <p>Loading interview results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="result-container">
          <div className="error-message">
            <XCircle size={48} />
            <h2>Error Loading Results</h2>
            <p>{error}</p>
            <button
              className="primary-button"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!interviewData) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="result-container">
          <div className="error-message">
            <AlertTriangle size={48} />
            <h2>No Results Found</h2>
            <p>We couldn't find interview results for this session.</p>
            <button
              className="primary-button"
              onClick={() => navigate("/interview")}
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoreData = prepareScoreData();
  const averageWPM = calculateAverageWPM();
  const averageClarity = calculateAverageClarity();

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="result-container">
        <div className="result-hero">
          <h1 className="result-title">Your Interview Results</h1>
          <p className="result-subtitle">
            Role: {interviewData.role} •{" "}
            {formatDuration(
              interviewData.evaluation.interview_duration_seconds
            )}{" "}
            interview duration
          </p>
        </div>

        <div className="result-content">
          {/* File location information */}
          {/* <div className="file-location-banner">
            <div className="file-icon">
              <FileText size={24} />
            </div>
            <div className="file-details">
              <h3>Result File Location</h3>
              <p className="file-path">{resultFilePath}</p>
            </div>
            <button className="download-button" onClick={handleDownloadResults}>
              <Download size={20} />
              <span>Download</span>
            </button>
          </div> */}

          <div className="score-overview">
            <div className="score-card main-score">
              <div className="score-value">
                {interviewData.evaluation.overall_score.toFixed(1)}/10
              </div>
              <div className="score-label">Overall Performance</div>
            </div>

            <div className="score-chart">
              <h3 className="chart-title">Performance Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={scoreData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" name="Score (0-100)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon blue-icon">
                <Clock size={32} />
              </div>
              <div className="metric-details">
                <h3 className="metric-title">Speaking Pace</h3>
                <div className="metric-value">{averageWPM} WPM</div>
                <p className="metric-description">Words per minute</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon green-icon">
                <MessageSquare size={32} />
              </div>
              <div className="metric-details">
                <h3 className="metric-title">Clarity</h3>
                <div className="metric-value">{averageClarity}%</div>
                <p className="metric-description">Speech clarity score</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon purple-icon">
                <Activity size={32} />
              </div>
              <div className="metric-details">
                <h3 className="metric-title">Answer Quality</h3>
                <div className="metric-value">
                  {interviewData.evaluation.answer_quality.overall_quality.toFixed(
                    1
                  )}
                  %
                </div>
                <p className="metric-description">
                  Content quality and relevance
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon orange-icon">
                <Award size={32} />
              </div>
              <div className="metric-details">
                <h3 className="metric-title">Average Response</h3>
                <div className="metric-value">
                  {interviewData.evaluation.answer_quality.average_words.toFixed(
                    1
                  )}{" "}
                  words
                </div>
                <p className="metric-description">Words per answer</p>
              </div>
            </div>
          </div>

          <div className="improvement-section">
            <div className="section-header">
              <List size={24} />
              <h3>Areas for Improvement</h3>
            </div>
            <ul className="improvement-list">
              {interviewData.evaluation.ai_evaluation.common_improvement_areas.map(
                (area, index) => (
                  <li key={index} className="improvement-item">
                    <AlertTriangle size={20} className="improvement-icon" />
                    <span>{area}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="action-buttons">
            <button className="secondary-button" onClick={handleTryAgain}>
              Try Another Interview
            </button>
            <button className="primary-button" onClick={handleViewDetails}>
              View Detailed Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResultPage;
