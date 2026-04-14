import cv2
import numpy as np
from datetime import datetime
import logging
import sys
import traceback
class LightweightEmotionDetector:
    def init(self, logger=None):
    """
    Initialize the lightweight emotion detector.
    Uses Haar Cascade for face detection and a simple emotion classification.
    """
    # Load pre-trained face detection cascade
    self.face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    # Set up logging
        self.logger = logger or logging.getLogger(__name__)

    def _detect_faces(self, frame):
        """
        Detect faces in the frame using Haar Cascade.
        
        Args:
            frame (numpy.ndarray): Input image frame
        
        Returns:
            list: List of detected face regions
        """
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        return faces

    def _simple_emotion_classification(self, face_roi):
        """
        Perform a very simple emotion classification based on face characteristics.
        
        Args:
            face_roi (numpy.ndarray): Region of interest (face)
        
        Returns:
            dict: Emotion classification results
        """
        # Convert to grayscale
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Detailed emotion breakdown mimicking DeepFace output
        emotions = {
            'angry': 0.0,
            'disgust': 0.0,
            'fear': 0.0,
            'happy': 0.0,
            'sad': 0.0,
            'surprise': 0.0,
            'neutral': 0.0
        }
        
        # Basic heuristics for emotion estimation
        brightness = np.mean(gray_face)
        contrast = np.std(gray_face)
        
        # Rough emotion estimation logic
        if brightness > 200:
            emotions['happy'] = 70.0
            emotions['neutral'] = 30.0
        elif brightness < 100:
            emotions['sad'] = 60.0
            emotions['neutral'] = 40.0
        
        if contrast > 50:
            emotions['surprise'] = 50.0
        
        # Ensure total percentage is around 100
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: (v / total * 100.0) for k, v in emotions.items()}
        
        return emotions

    def process_frame(self, frame_data, frame_id, question_number):
        """
        Process a single frame for emotion analysis.
        
        Args:
            frame_data (bytes or numpy.ndarray): Input frame
            frame_id (str): Identifier for the frame
            question_number (int): Question number for context
        
        Returns:
            list or dict: Emotion analysis results in DeepFace-like format
        """
        try:
            # Convert numpy array if it's not already
            if isinstance(frame_data, bytes):
                nparr = np.frombuffer(frame_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                frame = frame_data
                
            if frame is None:
                self.logger.warning(f"Could not decode frame: {frame_id}")
                print(f"WARNING: Could not decode frame: {frame_id}")
                return []
            
            # Detect faces
            faces = self._detect_faces(frame)
            
            if len(faces) == 0:
                print(f"No faces detected in frame: {frame_id}")
                self.logger.debug(f"No faces detected in frame: {frame_id}")
                return []
            
            # Process the first detected face
            (x, y, w, h) = faces[0]
            face_roi = frame[y:y+h, x:x+w]
            
            # Classify emotions
            emotions = self._simple_emotion_classification(face_roi)
            
            # Construct result in DeepFace-like format
            result = [{
                'region': {
                    'x': x,
                    'y': y,
                    'w': w,
                    'h': h
                },
                'emotion': emotions
            }]
            
            # Force stdout to flush
            sys.stdout.flush()
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in emotion analysis: {str(e)}")
            print(f"ERROR in emotion analysis: {str(e)}")
            self.logger.error(f"Exception details: {type(e).__name__}")
            
            tb = traceback.format_exc()
            self.logger.error(tb)
            print(tb)
            
            return []