// src/utils/videoAnalysisService.js

/**
 * Service for handling video capture and analysis
 */
const videoAnalysisService = {
  /**
   * Start frame capture from video element
   * @param {Object} params - Parameters for frame capture
   * @returns {Object} Controller for the frame capture process
   */
  startFrameCapture({
    video,
    canvas,
    frameRate,
    questionNumber,
    onFrameCapture,
    onError,
  }) {
    if (!video || !canvas) return null;

    const context = canvas.getContext("2d");
    let frameId = 0;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Start capture interval
    const intervalId = setInterval(() => {
      try {
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get frame data as data URL
        const frameDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Call frame capture callback
        onFrameCapture(frameDataUrl, questionNumber, frameId++);
      } catch (error) {
        onError(`Frame capture error: ${error.message}`);
      }
    }, 1000 / frameRate);

    // Return controller object
    return {
      stop: () => clearInterval(intervalId),
      frameCount: () => frameId,
    };
  },

  /**
   * Initialize camera stream
   * @param {HTMLVideoElement} videoElement - Video element to attach stream to
   * @param {Function} onError - Error callback
   * @returns {Promise<MediaStream>} Media stream
   */
  async initializeCamera(videoElement, onError) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false, // Audio will be handled separately
      });

      if (videoElement) {
        videoElement.srcObject = stream;
      }

      return stream;
    } catch (err) {
      onError(`Error accessing camera: ${err.message}`);
      return null;
    }
  },
};

export default videoAnalysisService;
