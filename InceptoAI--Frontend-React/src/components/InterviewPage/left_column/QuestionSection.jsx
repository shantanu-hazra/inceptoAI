import React from "react";

const QuestionSection = ({ currentQuestion, totalQuestions, questionText }) => {
  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    cardBody: {
      padding: "20px",
    },
    questionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      margin: "0",
    },
    questionBadge: {
      backgroundColor: "#e9f0ff",
      color: "#4a6cf7",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "500",
    },
    questionText: {
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#444",
      margin: "0",
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardBody}>
        <div style={styles.questionHeader}>
          <h2 style={styles.cardTitle}>Current Question</h2>
          <span style={styles.questionBadge}>
            Question {currentQuestion}/{totalQuestions}
          </span>
        </div>
        <p style={styles.questionText}>{questionText}</p>
      </div>
    </div>
  );
};

export default QuestionSection;
