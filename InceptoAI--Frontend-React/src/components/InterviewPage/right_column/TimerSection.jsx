import React from "react";

const TimerSection = ({ timer }) => {
  const styles = {
    timerBox: {
      backgroundColor: "#f8f9fc",
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      border: "1px solid #eaeaea",
    },
    timerLabel: {
      fontSize: "16px",
      fontWeight: "500",
      color: "#555",
    },
    timerDisplay: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#333",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
  };

  return (
    <div style={styles.timerBox}>
      <div style={styles.timerLabel}>Interview Duration</div>
      <div style={styles.timerDisplay}>
        {/* If you're using lucide-react, you could add the Clock icon here */}
        {timer}
      </div>
    </div>
  );
};

export default TimerSection;
