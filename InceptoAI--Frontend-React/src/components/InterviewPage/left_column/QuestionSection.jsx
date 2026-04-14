import React from "react";

const QuestionSection = ({ currentQuestion, totalQuestions, questionText }) => {
  return (
    <div className="flat-card">
      <div className="flat-card-header">
        <h2 className="flat-card-title">Current Question</h2>
        <span className="question-badge">
          Question {currentQuestion}/{totalQuestions}
        </span>
      </div>
      <div className="flat-card-body">
        <p className="question-text">{questionText}</p>
      </div>
    </div>
  );
};

export default QuestionSection;
