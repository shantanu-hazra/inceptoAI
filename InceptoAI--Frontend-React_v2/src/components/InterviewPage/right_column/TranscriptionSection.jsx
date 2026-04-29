import React from "react";

const TranscriptionSection = ({
  questionText,
  responseText,
  keyPhrases = [],
}) => {
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
          `<span class="highlight-phrase">${match}</span>`
      );
    });

    return (
      <p
        className="transcription-content"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  return (
    <div className="flat-card">
      <div className="flat-card-header">
        <h2 className="flat-card-title">Live Transcription</h2>
      </div>
      <div className="flat-card-body">
        <div className="transcription-container">
          <div className="transcription-block">
            <p className="transcription-label">Question:</p>
            <p className="transcription-content">{questionText}</p>
          </div>
          <div className="transcription-block">
            <p className="transcription-label">Your Response:</p>
            {highlightKeyPhrases(responseText, keyPhrases)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionSection;
