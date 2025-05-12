import { io } from "socket.io-client";

// Constants
const SOCKET_SERVER_URL = `${import.meta.env.VITE_REACT_APP_SOCKET_SERVER_URL}`;
const FILLER_WORDS_LIST = [
  "um",
  "uh",
  "like",
  "you know",
  "so",
  "actually",
  "basically",
  "literally",
];

class InterviewAnalysisService {
  constructor() {
    this.socket = null;
    this.connectionStatus = "disconnected";
    this.baseUrl = import.meta.env.VITE_REACT_APP_SOCKET_SERVER_URL;
    this.lastError = null;
    this.callbacks = {
      onStatusChange: () => {},
      onError: () => {},
      onVideoAnalysisComplete: () => {},
      onSpeechAnalysisSaved: () => {},
    };
  }

  // Initialize the socket connection
  connect(callbacks = {}) {
    // Update callbacks with any provided functions
    this.callbacks = { ...this.callbacks, ...callbacks };

    // Connect to the WebSocket server
    this.socket = io(SOCKET_SERVER_URL);

    this.socket.on("connect", () => {
      this.sessionId = this.socket.id;
      this.connectionStatus = "connected";
      this.callbacks.onStatusChange(this.connectionStatus);
    });

    this.socket.on("disconnect", () => {
      this.connectionStatus = "disconnected";
      this.callbacks.onStatusChange(this.connectionStatus);
    });

    this.socket.on("connect_error", (error) => {
      this.connectionStatus = "error";
      this.lastError = `Connection error: ${error.message}`;
      this.callbacks.onError(this.lastError);
      console.error("Connection error:", error);
    });

    return this;
  }

  // Disconnect from the socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get current connection status
  getStatus() {
    return {
      status: this.connectionStatus,
      error: this.lastError,
    };
  }

  // Reset session ID
  resetSession() {
    this.sessionId = `session_${Date.now()}`;
    return this.sessionId;
  }

  // Get session ID
  getSessionId() {
    return this.sessionId;
  }

  // Send a video frame to the server for analysis
  sendVideoFrame(frameDataUrl, questionNumber, frameId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "frame",
        {
          frameId,
          frame: frameDataUrl,
          questionNumber,
          sessionId: this.sessionId,
        },
        (response) => {
          if (response && response.status === "success") {
            resolve(response);
          } else if (response && response.status === "error") {
            console.error("Error sending frame:", response.message);
            reject(new Error(response.message));
          } else {
            reject(new Error("Unknown error sending frame"));
          }
        }
      );
    });
  }

  // Stop video capture and get analysis results
  stopVideoCapture(questionNumber, transcript) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "stop_capture",
        {
          sessionId: this.sessionId,
          questionNumber,
          transcript,
        },
        (response) => {
          if (response && response.status === "success") {
            this.callbacks.onVideoAnalysisComplete(response.average_results);
            resolve(response.average_results);
          } else if (response && response.status === "error") {
            console.error("Error saving video analysis:", response.message);
            reject(new Error(response.message));
          } else {
            reject(new Error("Unknown error stopping capture"));
          }
        }
      );
    });
  }

  // Send speech analysis to server
  sendSpeechAnalysis(questionNumber, transcript, speechAnalysisResults) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.socket || !this.socket.connected) {
          reject(new Error("Socket not connected"));
          return;
        }

        const dataToSave = {
          session_id: this.sessionId,
          question_number: questionNumber,
          timestamp: new Date().toISOString(),
          transcript: transcript,
          analysis: {
            wpm: speechAnalysisResults.words_per_minute.find(
              (item) => item.question === questionNumber
            )?.wpm,
            clarity_score: speechAnalysisResults.clarity_score.find(
              (item) => item.question === questionNumber
            )?.score,
            completeness_score: speechAnalysisResults.answer_completeness.find(
              (item) => item.question === questionNumber
            )?.score,
            filler_words: Object.fromEntries(
              Object.entries(speechAnalysisResults.filler_words).map(
                ([word, items]) => {
                  const item = items.find((i) => i.question === questionNumber);
                  return [word, item ? item.count : 0];
                }
              )
            ),
          },
        };

        this.socket.emit("speech_analysis", dataToSave, (response) => {
          if (response && response.status === "success") {
            this.callbacks.onSpeechAnalysisSaved(
              "Speech analysis saved successfully"
            );
            resolve(response);
          } else if (response && response.status === "error") {
            const errorMsg = `Error saving speech analysis: ${response.message}`;
            this.callbacks.onSpeechAnalysisSaved(errorMsg);
            reject(new Error(errorMsg));
          } else {
            reject(new Error("Unknown error saving speech analysis"));
          }
        });
      } catch (error) {
        console.error("Error sending speech analysis to server:", error);
        reject(error);
      }
    });
  }

  // Send question-answer data to server along with analysis
  sendQuestionAnswerData(data) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.socket || !this.socket.connected) {
          reject(new Error("Socket not connected"));
          return;
        }

        const dataToSend = {
          session_id: this.sessionId,
          question_number: data.questionNumber,
          question_text: data.questionText,
          answer: data.answer,
          timestamp: new Date().toISOString(),
          speech_analysis: data.speechAnalysis,
          video_analysis: data.videoAnalysis,
        };

        this.socket.emit("question_answer_data", dataToSend, (response) => {
          if (response && response.status === "success") {
            this.callbacks.onSpeechAnalysisSaved(
              "Question-answer data saved successfully"
            );
            resolve(response);
          } else if (response && response.status === "error") {
            const errorMsg = `Error saving question-answer data: ${response.message}`;
            this.callbacks.onSpeechAnalysisSaved(errorMsg);
            reject(new Error(errorMsg));
          } else {
            reject(new Error("Unknown error saving question-answer data"));
          }
        });
      } catch (error) {
        console.error("Error sending question-answer data to server:", error);
        reject(error);
      }
    });
  }

  // Process speech transcript and generate analysis
  analyzeSpeech(transcript, questionNumber, duration) {
    // Process transcript for analysis
    const words = transcript.trim().split(/\s+/);
    const wordCount = words.length;

    // Calculate words per minute
    const wpm = Math.round((wordCount / duration) * 60);

    // Count filler words
    const fillerCount = {};
    let totalFillers = 0;

    FILLER_WORDS_LIST.forEach((filler) => {
      // Count occurrences (case insensitive)
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const count = (transcript.match(regex) || []).length;

      if (count > 0) {
        fillerCount[filler] = count;
        totalFillers += count;
      }
    });

    // Calculate clarity score
    const clarity = Math.max(
      0,
      100 - (totalFillers / Math.max(1, wordCount)) * 100
    );

    // Calculate completeness score
    const completeness = Math.min(100, (wordCount / 50) * 100);

    // Get timestamp
    const timestamp = new Date().toISOString();

    return {
      wpm,
      fillerCount,
      clarity,
      completeness,
      timestamp,
      wordCount,
      totalFillers,
    };
  }

  // Calculate speech summary statistics
  calculateSpeechSummary(speechAnalysisResults) {
    if (!speechAnalysisResults.words_per_minute.length) return null;

    // Average WPM
    const avgWpm =
      speechAnalysisResults.words_per_minute.reduce(
        (sum, item) => sum + item.wpm,
        0
      ) / speechAnalysisResults.words_per_minute.length;

    // Total filler words
    let totalFillers = 0;
    Object.values(speechAnalysisResults.filler_words).forEach((fillerArray) => {
      totalFillers += fillerArray.reduce((sum, item) => sum + item.count, 0);
    });

    // Average clarity
    const avgClarity =
      speechAnalysisResults.clarity_score.reduce(
        (sum, item) => sum + item.score,
        0
      ) / speechAnalysisResults.clarity_score.length;

    // Average completeness
    const avgCompleteness =
      speechAnalysisResults.answer_completeness.reduce(
        (sum, item) => sum + item.score,
        0
      ) / speechAnalysisResults.answer_completeness.length;

    return {
      avgWpm: Math.round(avgWpm),
      totalFillers,
      avgClarity: Math.round(avgClarity),
      avgCompleteness: Math.round(avgCompleteness),
      totalQuestions: speechAnalysisResults.words_per_minute.length,
    };
  }

  // Prepare data for download
  prepareDownloadData(
    speechAnalysisResults,
    averageVideoResults,
    allTranscripts,
    questionAnswerPairs = {}
  ) {
    const combinedResults = {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      speech_analysis: speechAnalysisResults,
      video_analysis: averageVideoResults,
      transcripts: allTranscripts,
      question_answer_pairs: questionAnswerPairs,
      speech_summary: this.calculateSpeechSummary(speechAnalysisResults),
    };

    return combinedResults;
  }

  // Get filler words list
  getFillerWordsList() {
    return FILLER_WORDS_LIST;
  }

  // NEW METHODS FOR DYNAMIC QUESTION GENERATION

  // Generate a question based on company and role
  generateQuestion = async function (company, role, questionNumber) {
    try {
      // Get the client ID from the socket connection
      const clientId = this.socket.sessionId;

      if (!clientId) {
        throw new Error("Socket connection not established");
      }

      const response = await fetch(`${this.baseUrl}/api/generate-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          questionNumber,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error generating question:`, error);
      throw error;
    }
  };

  // Submit answer and get next question
  submitAnswerAndGetNextQuestion = async function (
    company,
    role,
    questionNumber,
    questionText,
    answer,
    analysisResults
  ) {
    try {
      // Get the client ID from the socket connection
      const clientId = this.socket ? this.socket.id : null;

      if (!clientId) {
        throw new Error("Socket connection not established");
      }

      const response = await fetch(`${this.baseUrl}/api/next-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          questionNumber,
          question_text: questionText,
          answer,
          analysis: analysisResults,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Error submitting answer and getting next question:`,
        error
      );
      throw error;
    }
  };

  // Complete the interview (no more questions)
  completeInterview = async function (user_id, role) {
    try {
      // Get the client ID from the socket connection
      const clientId = this.socket ? this.socket.id : null;

      if (!clientId) {
        throw new Error("Socket connection not established");
      }

      const response = await fetch(
        `${this.baseUrl}/api/complete_interview/${clientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            role,
            role,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error completing interview:`, error);
      throw error;
    }
  };

  getQuestions = async function (options = {}) {
    const queryParams = new URLSearchParams();
    if (options.category) queryParams.append("category", options.category);
    if (options.limit) queryParams.append("limit", options.limit);

    const queryString = queryParams.toString();
    const endpoint = `/api/questions${queryString ? `?${queryString}` : ""}`;

    return this.get(endpoint);
  };

  getQuestionById = async function (id) {
    return this.get(`/api/questions/${id}`);
  };

  get = async function (endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`GET request to ${endpoint} failed:`, error);
      throw error;
    }
  };
}

export default new InterviewAnalysisService();
