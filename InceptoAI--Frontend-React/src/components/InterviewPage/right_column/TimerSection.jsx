import React from "react";

const TimerSection = ({ timer }) => {
  return (
    <div className="timer-box">
      <div className="timer-label">Interview Duration</div>
      <div className="timer-display">
        {timer}
      </div>
    </div>
  );
};

export default TimerSection;
