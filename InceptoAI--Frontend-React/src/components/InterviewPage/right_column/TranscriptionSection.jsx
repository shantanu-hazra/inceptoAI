import React from "react";

const TranscriptionSection = ({
  questionText,
  responseText,
  keyPhrases = [],
}) => {
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
    cardBody: {
      padding: "20px",
    },
    transcriptionContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    transcriptionBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    transcriptionLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#666",
      margin: "0",
    },
    transcriptionText: {
      fontSize: "15px",
      lineHeight: "1.6",
      color: "#333",
      margin: "0",
      backgroundColor: "#f9f9f9",
      padding: "12px",
      borderRadius: "8px",
      whiteSpace: "pre-wrap",
    },
    highlight: {
      backgroundColor: "#fffacd",
      padding: "0 2px",
    },
    keyPhrasesLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#666",
      margin: "0 0 8px 0",
    },
    keyPhrases: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    keyPhrase: {
      backgroundColor: "#f0f7ff",
      color: "#4a6cf7",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "500",
    },
  };

  // Function to highlight key phrases in the response text
  const highlightKeyPhrases = (text, phrases) => {
    if (!phrases || phrases.length === 0) return text;

    let highlightedText = text;

    phrases.forEach((phrase) => {
      // Create a regex that matches the phrase with word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${phrase}\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        (match) =>
          `<span style="background-color: #fffacd; padding: 0 2px;">${match}</span>`
      );
    });

    return (
      <p
        style={styles.transcriptionText}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Live Transcription</h2>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.transcriptionContainer}>
          <div style={styles.transcriptionBlock}>
            <p style={styles.transcriptionLabel}>Question:</p>
            <p style={styles.transcriptionText}>{questionText}</p>
          </div>
          <div style={styles.transcriptionBlock}>
            <p style={styles.transcriptionLabel}>Your Response:</p>
            {highlightKeyPhrases(responseText, keyPhrases)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionSection;
