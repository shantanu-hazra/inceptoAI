import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const ActionButtons = ({
  startRecording,
  stopRecording,
  endInterview,
  isRecording,
}) => {
  const [endButtonClicked, setEndButtonClicked] = useState(false);

  const handleEndInterviewClick = async () => {
    if (!endButtonClicked) {
      setEndButtonClicked(true);
      await endInterview();
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    buttonGroup: {
      display: "flex",
      gap: "16px",
    },
    button: {
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      flex: "1",
      border: "none",
      transition: "background-color 0.2s, transform 0.1s",
    },
    startButton: {
      backgroundColor: isRecording ? "#e0e0e0" : "#4a6cf7",
      color: isRecording ? "#777" : "#fff",
      cursor: isRecording ? "not-allowed" : "pointer",
    },
    stopButton: {
      backgroundColor: isRecording ? "#f44336" : "#e0e0e0",
      color: isRecording ? "#fff" : "#777",
      cursor: isRecording ? "pointer" : "not-allowed",
    },
    endInterviewButton: {
      backgroundColor: "#ff9800",
      color: "#fff",
      width: "100%",
      marginTop: "12px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonGroup}>
        <button
          onClick={startRecording}
          disabled={isRecording}
          style={{ ...styles.button, ...styles.startButton }}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{ ...styles.button, ...styles.stopButton }}
        >
          Stop Recording
        </button>
      </div>
      <button
        onClick={handleEndInterviewClick}
        style={{ ...styles.button, ...styles.endInterviewButton }}
        disabled={endButtonClicked}
      >
        End Interview
      </button>
    </div>
  );
};

export default ActionButtons;
