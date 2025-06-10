import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Volume2,
  Award,
} from "lucide-react";
import Navbar from "../../components/Navbar/NavBar.jsx";
import "../../styles/Result/InterviewDetailPage.css"; // You'll need to create this CSS file
import { getResult } from "../../utils/userPaths.js";

const InterviewDetailPage = () => {
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get(`${getResult}${resultId}`);
        setInterviewData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching interview data:", err);
        setError("Failed to load interview details. Please try again.");
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [resultId]);

  // Handle navigation between questions
  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const goToNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) =>
      Math.min(
        Object.keys(interviewData?.responses || {}).length - 1,
        prevIndex + 1
      )
    );
  };

  // Get current question and response
  const getCurrentQuestionData = () => {
    if (!interviewData || !interviewData.responses) return null;

    const questionNumbers = Object.keys(interviewData.responses);
    const currentQuestionNumber = questionNumbers[currentQuestionIndex];
    return interviewData.responses[currentQuestionNumber];
  };

  const getCurrentAIEvaluation = () => {
    if (
      !interviewData ||
      !interviewData.evaluation ||
      !interviewData.evaluation.ai_evaluation
    )
      return null;

    const emotionalInsight =
      interviewData.evaluation.ai_evaluation.emotional_insights[
        currentQuestionIndex
      ] || "No emotional insight available";

    return {
      score:
        interviewData.evaluation.ai_evaluation.answer_scores[
          currentQuestionIndex
        ] || 0,
      emotionalInsight,
    };
  };

  // Format seconds to minutes:seconds
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate score color based on value
  const getScoreColor = (score) => {
    if (score >= 7) return "text-green-600";
    if (score >= 4) return "text-amber-500";
    return "text-red-500";
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="result-container">
          <div className="spinner"></div>
          <p>Loading interview details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="detail-container">
          <div className="error-message">
            <XCircle size={48} />
            <h2>Error Loading Details</h2>
            <p>{error}</p>
            <button className="primary-button" onClick={() => navigate("/")}>
              Back to Home
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
        <div className="detail-container">
          <div className="error-message">
            <AlertTriangle size={48} />
            <h2>No Interview Data Found</h2>
            <p>We couldn't find interview details for this session.</p>
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

  const currentQuestionData = getCurrentQuestionData();
  const currentAIEvaluation = getCurrentAIEvaluation();
  const totalQuestions = Object.keys(interviewData.responses).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="detail-container">
        <div className="detail-header">
          <button
            className="back-button"
            onClick={() => navigate(`/result/${resultId}`)}
          >
            <ChevronLeft size={20} />
            Back to Summary
          </button>
          <h1 className="detail-title">Detailed Interview Analysis</h1>
          <p className="detail-subtitle">
            Role: {interviewData.role} • Session ID: {resultId}
          </p>
        </div>

        <div className="question-navigation">
          <button
            className="nav-button"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <button
            className="nav-button"
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>

        {currentQuestionData && (
          <div className="question-analysis-card">
            <div className="question-section">
              <h2 className="section-title">
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="question-text">
                {currentQuestionData.question_text}
              </p>
            </div>

            <div className="answer-section">
              <h2 className="section-title">Your Answer</h2>
              <div className="answer-box">
                <p className="answer-text">
                  {currentQuestionData.answer || "No answer provided"}
                </p>
                <div className="answer-metadata">
                  <span className="metadata-item">
                    <Clock size={16} />
                    {formatDuration(
                      currentQuestionData.speech_analysis?.duration || 0
                    )}
                  </span>
                  <span className="metadata-item">
                    <MessageSquare size={16} />
                    {currentQuestionData.speech_analysis?.wordCount || 0} words
                  </span>
                </div>
              </div>
            </div>

            <div className="ai-answer-section">
              <h2 className="section-title">Better Answer</h2>
              <div className="ai-answer-box">
                <p className="answer-text">
                  {interviewData.evaluation.detail_evaluations[
                    currentQuestionIndex
                  ].better_answer || "No better version of the answer provided"}
                </p>
                <div className="answer-metadata">
                  <span className="metadata-item">
                    <Clock size={16} />
                    {formatDuration(
                      currentQuestionData.speech_analysis?.duration || 0
                    )}
                  </span>
                  <span className="metadata-item">
                    <MessageSquare size={16} />
                    {currentQuestionData.speech_analysis?.wordCount || 0} words
                  </span>
                </div>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon blue-icon">
                  <Volume2 size={24} />
                </div>
                <div className="metric-details">
                  <h3 className="metric-title">Speaking Pace</h3>
                  <div className="metric-value">
                    {currentQuestionData.speech_analysis?.wpm || 0} WPM
                  </div>
                  <p className="metric-description">Words per minute</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon green-icon">
                  <MessageSquare size={24} />
                </div>
                <div className="metric-details">
                  <h3 className="metric-title">Clarity</h3>
                  <div className="metric-value">
                    {currentQuestionData.speech_analysis?.clarity || 0}%
                  </div>
                  <p className="metric-description">Speech clarity score</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon purple-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-details">
                  <h3 className="metric-title">Completeness</h3>
                  <div className="metric-value">
                    {currentQuestionData.speech_analysis?.completeness.toFixed(
                      1
                    ) || 0}
                    %
                  </div>
                  <p className="metric-description">Answer thoroughness</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon orange-icon">
                  <Award size={24} />
                </div>
                <div className="metric-details">
                  <h3 className="metric-title">AI Score</h3>
                  <div
                    className={`metric-value ${getScoreColor(
                      currentAIEvaluation?.score || 0
                    )}`}
                  >
                    {currentAIEvaluation?.score || 0}/10
                  </div>
                  <p className="metric-description">Overall answer quality</p>
                </div>
              </div>
            </div>

            <div className="evaluation-section">
              <h2 className="section-title">AI Analysis</h2>
              <div className="evaluation-content">
                <div className="evaluation-block">
                  <h3 className="evaluation-subtitle">Insight on Confidence</h3>
                  <p className="evaluation-text">
                    {currentAIEvaluation?.emotionalInsight}
                  </p>
                </div>

                {currentQuestionIndex >= 0 &&
                  interviewData.evaluation.ai_evaluation
                    .common_improvement_areas && (
                    <div className="evaluation-block">
                      <h3 className="evaluation-subtitle">
                        Areas for Improvement
                      </h3>
                      <ul className="improvement-list">
                        {interviewData.evaluation.ai_evaluation.common_improvement_areas.map(
                          (area, index) => (
                            <li key={index} className="improvement-item">
                              <AlertTriangle
                                size={16}
                                className="improvement-icon"
                              />
                              <span>{area}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {currentQuestionIndex <= totalQuestions - 1 &&
                  interviewData.evaluation.ai_evaluation.missing_keywords && (
                    <div className="evaluation-block">
                      <h3 className="evaluation-subtitle">Missing Keywords</h3>
                      <div className="keywords-container">
                        {interviewData.evaluation.ai_evaluation.missing_keywords.map(
                          (keyword, index) => (
                            <span key={index} className="keyword-badge">
                              {keyword}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button
            className="secondary-button"
            onClick={() => navigate(`/result/${resultId}`)}
          >
            Back to Summary
          </button>
          <button
            className="primary-button"
            onClick={() => navigate("/interview")}
          >
            Try Another Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailPage;
