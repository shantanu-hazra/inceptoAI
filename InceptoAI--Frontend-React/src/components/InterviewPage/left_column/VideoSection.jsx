import React, { useEffect, useRef } from "react";

const VideoSection = ({ isRecording, videoRef }) => {
  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      marginBottom: "20px",
    },
    cardHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid #eaeaea",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      margin: "0",
    },
    recordingStatus: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    recordingIndicator: {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: isRecording ? "#f44336" : "#aaa",
      animation: isRecording ? "pulse 1.5s infinite" : "none",
    },
    recordingText: {
      fontSize: "14px",
      color: isRecording ? "#f44336" : "#aaa",
      fontWeight: "500",
    },
    videoContainer: {
      width: "100%",
      height: "100%",
      position: "relative",
    },
    videoFeed: {
      width: "100%",
      height: "auto",
      display: "block",
      objectFit: "cover",
    },
    "@keyframes pulse": {
      "0%": { opacity: 1 },
      "50%": { opacity: 0.5 },
      "100%": { opacity: 1 },
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Video Preview</h2>
        <div style={styles.recordingStatus}>
          <div style={styles.recordingIndicator} />
          <span style={styles.recordingText}>
            {isRecording ? "Recording" : "Not Recording"}
          </span>
        </div>
      </div>
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={styles.videoFeed}
        />
      </div>
    </div>
  );
};

export default VideoSection;
