import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../utils/apiServices";
import speechAnalysisService from "../../utils/speechAnalysisService";
import videoAnalysisService from "../../utils/videoAnalysisService";
import questionService from "../../utils/questionService";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import useRecordingState from "../../hooks/useRecordingState";

import InterviewInterface from "../../components/InterviewPage/InterviewInterface";
import SetupForm from "../../components/InterviewPage/SetupForm";
import { useAuth } from "../../contexts/AuthContext/AuthProvider";

const InterviewAssistant = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  // Server state
  const [serverStatus, setServerStatus] = useState("disconnected");
  const [lastError, setLastError] = useState(null);
  const [sessionId, setSessionId] = useState(apiService.getSessionId());
  const [saveStatus, setSaveStatus] = useState("");

  // Company and role for dynamic questions
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  // Timer state
  const [timer, setTimer] = useState("00:00");
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Analysis state
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [frameCount, setFrameCount] = useState(0);
  const [frameRate, setFrameRate] = useState(1 / 3);
  const [averageVideoResults, setAverageVideoResults] = useState(null);
  const [allTranscripts, setAllTranscripts] = useState({});
  const [questionAnswerPairs, setQuestionAnswerPairs] = useState({});
  const [keyPhrases, setKeyPhrases] = useState([]);
  const [speechAnalysisResults, setSpeechAnalysisResults] = useState({
    words_per_minute: [],
    filler_words: {},
    clarity_score: [],
    answer_completeness: [],
    timestamps: [],
  });

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);

  // Refs and custom hooks
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const captureControllerRef = useRef(null);
  const { transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { isRecording, startAudioRecording, stopAudioRecording } =
    useRecordingState();
  const transcriptRef = useRef("");

  useEffect(() => {
    transcriptRef.current = transcript;

    // Extract key phrases (simplified implementation)
    if (transcript) {
      const words = transcript.split(/\s+/);
      const potentialKeyPhrases = words
        .filter(
          (word) =>
            word.length > 5 &&
            !["although", "because", "through", "therefore"].includes(
              word.toLowerCase()
            )
        )
        .slice(0, 5);
      setKeyPhrases(potentialKeyPhrases);
    }
  }, [transcript]);

  // Connect to server and initialize camera
  useEffect(() => {
    apiService.connect({
      onStatusChange: setServerStatus,
      onError: setLastError,
      onVideoAnalysisComplete: setAverageVideoResults,
      onSpeechAnalysisSaved: setSaveStatus,
    });

    const initializeCamera = async () => {
      if (setupComplete && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });

          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Camera init error:", err);
          setLastError(`Camera error: ${err.message}`);
        }
      }
    };

    setTimeout(initializeCamera, 100); // delay so videoRef is ready

    return () => {
      apiService.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [setupComplete]);

  useEffect;

  // Timer functionality
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      const minutes = Math.floor(elapsedSeconds / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
      setTimer(`${minutes}:${seconds}`);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  // Function to handle setup form submission
  const handleSetupSubmit = async (e) => {
    e.preventDefault();

    if (!company.trim() || !role.trim()) {
      setLastError("Company and role are required");
      return;
    }

    try {
      // Generate the first question
      const questionResponse = await questionService.generateQuestion(
        company,
        role,
        questionNumber
      );

      if (questionResponse.status === "success") {
        setCurrentQuestion({
          text: questionResponse.question,
          number: questionResponse.questionNumber,
        });
        setQuestionsLoaded(true);
        setSetupComplete(true);
      } else {
        setLastError(
          "Failed to generate question: " + questionResponse.message
        );
      }
    } catch (error) {
      setLastError("Error setting up interview: " + error.message);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (serverStatus !== "connected") {
      setLastError("Cannot start recording: server not connected");
      return;
    }

    if (!currentQuestion) {
      setLastError("Cannot start recording: no question loaded");
      return;
    }

    resetTranscript();
    setFrameCount(0);
    setAverageVideoResults(null);
    setKeyPhrases([]);

    // Start audio/speech
    startListening();
    await startAudioRecording();

    // Start timer
    startTimer();

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = videoRef.current?.videoWidth || 640;
      canvasRef.current.height = videoRef.current?.videoHeight || 480;
    }

    // Start video capture
    captureControllerRef.current = videoAnalysisService.startFrameCapture({
      video: videoRef.current,
      canvas: canvasRef.current,
      frameRate,
      questionNumber,
      onFrameCapture: (frameData, qNumber, frameId) => {
        apiService
          .sendVideoFrame(frameData, qNumber, frameId)
          .then(() => setFrameCount((prev) => prev + 1))
          .catch((error) =>
            setLastError(`Error sending frame: ${error.message}`)
          );
      },
      onError: setLastError,
    });
  };

  // Process recording results and send to server
  const processAndSendResults = async (duration) => {
    // Analyze speech
    const analysis = speechAnalysisService.analyzeSpeech(
      transcriptRef.current,
      questionNumber,
      duration
    );

    // Update speech analysis results
    setSpeechAnalysisResults((prev) => {
      const newResults = { ...prev };

      newResults.words_per_minute = [
        ...prev.words_per_minute,
        {
          question: questionNumber,
          wpm: analysis.wpm,
        },
      ];

      const newFillerWords = { ...prev.filler_words };
      Object.entries(analysis.fillerCount).forEach(([filler, count]) => {
        newFillerWords[filler] = [
          ...(newFillerWords[filler] || []),
          { question: questionNumber, count },
        ];
      });
      newResults.filler_words = newFillerWords;

      newResults.clarity_score = [
        ...prev.clarity_score,
        {
          question: questionNumber,
          score: analysis.clarity,
        },
      ];

      newResults.answer_completeness = [
        ...prev.answer_completeness,
        {
          question: questionNumber,
          score: analysis.completeness,
        },
      ];

      newResults.timestamps = [
        ...prev.timestamps,
        {
          question: questionNumber,
          timestamp: analysis.timestamp,
        },
      ];

      return newResults;
    });

    // Save transcript
    setAllTranscripts((prev) => ({
      ...prev,
      [questionNumber]: transcriptRef.current,
    }));

    // Store question-answer pair
    const questionText = currentQuestion?.text || `Question ${questionNumber}`;
    setQuestionAnswerPairs((prev) => ({
      ...prev,
      [questionNumber]: {
        question: questionText,
        answer: transcriptRef.current,
      },
    }));

    try {
      setSaveStatus(
        "Sending question-answer data and getting next question..."
      );

      const response = await questionService.submitAnswerAndGetNextQuestion(
        company,
        role,
        questionNumber,
        questionText,
        transcriptRef.current,
        analysis
      );

      if (response.status === "success") {
        if (!response.complete) {
          setQuestionNumber(response.nextQuestionNumber);
          setCurrentQuestion({
            text: response.nextQuestion,
            number: response.nextQuestionNumber,
          });
          setSaveStatus("Answer saved and next question loaded");
        } else {
          setSaveStatus("Final answer saved. Interview complete!");
          setCurrentQuestion({
            text: "Interview complete! Thank you for your participation.",
            number: questionNumber,
            isComplete: true,
          });
        }
      } else {
        setLastError(`Error: ${response.message}`);
      }
    } catch (error) {
      setLastError(`Error sending data: ${error.message}`);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    // Stop video capture
    if (captureControllerRef.current) {
      captureControllerRef.current.stop();
    }

    // Stop speech recognition
    stopListening();

    // Stop timer and get duration
    const duration = stopTimer();

    // Stop audio recording
    await stopAudioRecording();

    // Signal server to stop video capture
    try {
      // Wait a moment to let transcript finalize
      setTimeout(async () => {
        await processAndSendResults(duration);
      }, 1000);

      if (questionNumber >= totalQuestions) {
        setTimeout(async () => {
          await apiService.completeInterview(userId, role);
        }, 5000);
      }
    } catch (error) {
      setLastError(`Error stopping video capture: ${error.message}`);
    }
  };

  // End interview early
  const endInterview = async () => {
    try {
      // If recording is in progress, stop it first and save current progress
      if (isRecording) {
        await stopRecording();
      }

      // Show status to user
      setSaveStatus("Saving interview data and ending session...");

      // Make API call to mark the interview as complete
      await apiService.completeInterview(userId, role, true); // Added a parameter to indicate early termination

      // Clean up resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Redirect to home page
      setTimeout(() => {
        navigate("/"); // Navigate to home page
      }, 1000);
    } catch (error) {
      setLastError(`Error ending interview: ${error.message}`);
    }
  };

  return (
    <>
      {!setupComplete ? (
        <SetupForm
          company={company}
          setCompany={setCompany}
          role={role}
          setRole={setRole}
          handleSetupSubmit={handleSetupSubmit}
          serverStatus={serverStatus}
        />
      ) : (
        <InterviewInterface
          currentQuestion={currentQuestion}
          totalQuestions={totalQuestions}
          transcript={transcript}
          keyPhrases={keyPhrases}
          isRecording={isRecording}
          timer={timer}
          startRecording={startRecording}
          stopRecording={stopRecording}
          endInterview={endInterview} // Pass the new function to the interface
          videoRef={videoRef}
          canvasRef={canvasRef}
          sessionId={sessionId}
        />
      )}
    </>
  );
};

export default InterviewAssistant;
