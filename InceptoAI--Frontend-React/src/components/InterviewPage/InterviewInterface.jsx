// InterviewInterface.jsx
import React, { useEffect, useState } from "react";
import VideoSection from "./left_column/VideoSection";
import QuestionSection from "./left_column/QuestionSection";
import TranscriptionSection from "./right_column/TranscriptionSection";
import TimerSection from "./right_column/TimerSection";
import ActionButtons from "./right_column/ActionButtons";

const InterviewInterface = ({
  currentQuestion,
  totalQuestions,
  transcript,
  keyPhrases,
  isRecording,
  timer,
  startRecording,
  stopRecording,
  endInterview, // Add the new prop for ending interview
  videoRef,
  canvasRef,
}) => {
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    leftColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    rightColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    hiddenCanvas: {
      display: "none",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftColumn}>
        <VideoSection isRecording={isRecording} videoRef={videoRef} />
        <QuestionSection
          currentQuestion={currentQuestion?.number || 1}
          totalQuestions={totalQuestions || 3}
          questionText={currentQuestion?.text || "Loading..."}
        />
        {/* Hidden canvas used for video processing */}
        <canvas ref={canvasRef} style={styles.hiddenCanvas} />
      </div>

      <div style={styles.rightColumn}>
        <TranscriptionSection
          questionText={currentQuestion?.text || ""}
          responseText={transcript}
          keyPhrases={keyPhrases}
        />

        <TimerSection timer={timer} />

        <ActionButtons
          startRecording={startRecording}
          stopRecording={stopRecording}
          endInterview={endInterview} // Pass the endInterview function
          isRecording={isRecording}
        />
      </div>
    </div>
  );
};

export default InterviewInterface;
