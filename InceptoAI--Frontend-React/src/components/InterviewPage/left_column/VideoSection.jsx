import React, { useEffect, useRef } from "react";

const VideoSection = ({ isRecording, videoRef }) => {
  return (
    <div className="flat-card">
      <div className="flat-card-header">
        <h2 className="flat-card-title">Video Preview</h2>
        <div className="recording-status">
          <div className={`recording-indicator ${isRecording ? 'active' : ''}`} />
          <span className={`recording-text ${isRecording ? 'active' : ''}`}>
            {isRecording ? "Recording" : "Not Recording"}
          </span>
        </div>
      </div>
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
      </div>
    </div>
  );
};

export default VideoSection;
