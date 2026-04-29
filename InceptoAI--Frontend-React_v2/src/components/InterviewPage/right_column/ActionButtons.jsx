import React from "react";
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

  return (
    <div className="action-buttons-container">
      <div className="button-row">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="flat-button btn-start"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="flat-button btn-stop"
        >
          Stop Recording
        </button>
      </div>
      <button
        onClick={handleEndInterviewClick}
        className="flat-button btn-end"
        disabled={endButtonClicked}
      >
        End Interview
      </button>
    </div>
  );
};

export default ActionButtons;
