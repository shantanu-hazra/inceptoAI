import { useState, useRef } from "react";

/**
 * Custom hook for managing recording state and audio recording
 * @returns {Object} Recording state and controls
 */
const useRecordingState = () => {
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null); // Add a ref to store the stream

  // Start audio recording
  const startAudioRecording = async () => {
    try {
      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Store the stream in the ref for later access
      streamRef.current = audioStream;

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(audioStream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Return the actual audio stream
      return audioStream;
    } catch (error) {
      console.error("Error starting audio recording:", error);
      throw error;
    }
  };

  // Stop audio recording
  const stopAudioRecording = () => {
    return new Promise((resolve) => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        const duration = (Date.now() - startTimeRef.current) / 1000;

        mediaRecorderRef.current.onstop = () => {
          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setIsRecording(false);
          resolve(duration);
        };

        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        resolve(0);
      }
    });
  };

  // Get the current audio stream
  const getAudioStream = () => streamRef.current;

  return {
    isRecording,
    startAudioRecording,
    stopAudioRecording,
    getAudioStream,
    getRecordingDuration: () =>
      startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0,
  };
};

export default useRecordingState;
