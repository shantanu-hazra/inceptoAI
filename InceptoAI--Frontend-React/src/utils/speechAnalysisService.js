// src/utils/speechAnalysisService.js

/**
 * Service for handling speech analysis functionality
 */
const speechAnalysisService = {
  /**
   * Analyze speech from transcript
   * @param {string} transcript - The speech transcript
   * @param {number} questionNumber - Current question number
   * @param {number} duration - Duration of speech in seconds
   * @returns {Object} Analysis results
   */
  analyzeSpeech(transcript, questionNumber, duration) {
    // Calculate words per minute
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = duration / 60;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

    // Analyze filler words
    const fillerWords = [
      "um",
      "uh",
      "like",
      "you know",
      "sort of",
      "kind of",
      "so",
      "actually",
      "basically",
    ];
    const fillerCount = {};
    const lowerTranscript = transcript.toLowerCase();

    fillerWords.forEach((filler) => {
      // Use regex to find whole word matches only
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        fillerCount[filler] = matches.length;
      }
    });

    // Calculate clarity score (simplified algorithm)
    // A higher score means clearer speech
    const fillerWordsCount = Object.values(fillerCount).reduce(
      (a, b) => a + b,
      0
    );
    const fillerRatio = wordCount > 0 ? fillerWordsCount / wordCount : 0;
    const clarity = Math.max(
      0,
      Math.min(100, 100 - fillerRatio * 100 - (wpm > 180 ? (wpm - 180) / 2 : 0))
    );

    // Calculate answer completeness (simplified)
    // Higher is more complete - this would normally involve more complex NLP
    const minWords = 30; // Minimum words for a "complete" answer
    const maxWords = 200; // Beyond this is potentially too verbose
    let completeness = 0;

    if (wordCount >= minWords && wordCount <= maxWords) {
      completeness = 100;
    } else if (wordCount < minWords) {
      completeness = (wordCount / minWords) * 100;
    } else {
      completeness = Math.max(0, 100 - (wordCount - maxWords) / 10);
    }

    return {
      wpm,
      fillerCount,
      clarity,
      completeness,
      timestamp: new Date().toISOString(),
      wordCount,
      duration,
    };
  },

  /**
   * Calculate summary statistics from all speech analysis results
   * @param {Object} speechAnalysisResults - All speech analysis results
   * @returns {Object} Summary statistics
   */
  calculateSpeechSummary(speechAnalysisResults) {
    const {
      words_per_minute,
      filler_words,
      clarity_score,
      answer_completeness,
    } = speechAnalysisResults;

    if (!words_per_minute.length) return null;

    // Calculate average WPM
    const avgWpm = Math.round(
      words_per_minute.reduce((sum, item) => sum + item.wpm, 0) /
        words_per_minute.length
    );

    // Count total filler words
    let totalFillers = 0;
    Object.values(filler_words).forEach((items) => {
      items.forEach((item) => {
        totalFillers += item.count;
      });
    });

    // Calculate average clarity score
    const avgClarity = Math.round(
      clarity_score.reduce((sum, item) => sum + item.score, 0) /
        clarity_score.length
    );

    // Calculate average answer completeness
    const avgCompleteness = Math.round(
      answer_completeness.reduce((sum, item) => sum + item.score, 0) /
        answer_completeness.length
    );

    return {
      avgWpm,
      totalFillers,
      avgClarity,
      avgCompleteness,
      totalQuestions: words_per_minute.length,
    };
  },
};

export default speechAnalysisService;
