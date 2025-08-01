import React from "react";
import { ExternalLink, BarChart2, Award, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/Homepage/Homepage.css";

const InterviewResultsTable = ({
  userId,
  interviewResults = [],
  loading = false,
  error = null,
  fetchInterviewResults,
}) => {
  const navigate = useNavigate();

  // Format time duration to minutes:seconds
  function formatDuration(durationSeconds) {
    if (!durationSeconds) return "N/A";
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Get status badge based on completion status
  function getStatusBadge(status) {
    switch (status) {
      case "completed":
        return <span className="status-badge completed">Completed</span>;
      case "in-progress":
        return <span className="status-badge in-progress">In Progress</span>;
      case "abandoned":
        return <span className="status-badge abandoned">Abandoned</span>;
      default:
        return <span className="status-badge completed">Completed</span>;
    }
  }

  function handleViewResult(resultId) {
    // Use resultId for viewing specific results
    navigate(`/result/${resultId}`);
  }

  function handleStart() {
    navigate("/interview");
  }

  return (
    <div className="results-section">
      <div className="results-header">
        <h2 className="results-title">Your Interview Results</h2>
        {userId && interviewResults.length > 0 && (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">
                <Award size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{interviewResults.length}</span>
                <span className="stat-label">Interviews</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <BarChart2 size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {interviewResults.length > 0
                    ? Math.ceil(
                        interviewResults.reduce(
                          (sum, result) => sum + (result.overall_Score || 0),
                          0
                        ) / interviewResults.length
                      ) + "%"
                    : "N/A"}
                </span>
                <span className="stat-label">Avg. Score</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {interviewResults.length > 0
                    ? formatDuration(
                        Math.ceil(
                          interviewResults.reduce(
                            (sum, result) => sum + (result.duration || 0),
                            0
                          ) / interviewResults.length
                        )
                      )
                    : "N/A"}
                </span>
                <span className="stat-label">Avg. Time</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading interview results...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-text">Error: {error}</p>
          {userId && (
            <button onClick={fetchInterviewResults} className="retry-button">
              Retry
            </button>
          )}
        </div>
      ) : userId && interviewResults.length > 0 ? (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th className="date-column">Date</th>
                <th>Topic</th>
                <th className="status-column">Status</th>
                <th className="score-column">Score</th>
                <th className="duration-column">Duration</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {interviewResults.map((result, index) => (
                <tr key={result._id || result.id || index}>
                  <td>
                    {result.date
                      ? new Date(result.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td className="topic-cell">
                    {result.topic || "General Interview"}
                  </td>
                  <td>{getStatusBadge(result.status || "completed")}</td>
                  <td className="score-cell">
                    {result.overall_score ? (
                      <div className="score-pill">
                        <div
                          className="score-bar"
                          style={{
                            width: `${result.overall_score}%`,
                          }}
                        ></div>
                        <span className="score-text">
                          {result.overall_score}%
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    {formatDuration(result.interview_duration_seconds || 0)}
                  </td>
                  <td>
                    <button
                      className="view-result-btn"
                      onClick={() => handleViewResult(result._id || result.id)}
                    >
                      <ExternalLink size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <BarChart2 size={48} />
          </div>
          <p className="no-results">
            {userId
              ? "No interview results yet."
              : "Sign in to track your progress"}
          </p>
          <p className="empty-message">
            {userId
              ? "Complete your first interview to see your results here!"
              : "Create an account to save your interview results and track your improvement"}
          </p>
          <button className="hero-button" onClick={handleStart}>
            Start Interview
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewResultsTable;
