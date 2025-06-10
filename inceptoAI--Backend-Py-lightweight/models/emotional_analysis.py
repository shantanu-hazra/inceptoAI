import cv2
import numpy as np

class LightweightEmotionDetector:
    def __init__(self):
        # Initialize only essential cascade classifiers
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
        # Skip eye cascade to save memory if not essential
        
    def analyze_facial_features(self, face_region):
        """Memory-efficient facial feature analysis"""
        emotions = {
            'happy': 0.0,
            'neutral': 60.0,
            'sad': 0.0,
            'angry': 0.0,
            'surprise': 0.0,
            'disgust': 0.0,
            'fear': 0.0
        }
        
        # Detect smiles with optimized parameters
        smiles = self.smile_cascade.detectMultiScale(
            face_region, 
            scaleFactor=1.8, 
            minNeighbors=20,
            minSize=(25, 25)  # Smaller minimum size for efficiency
        )
        
        if len(smiles) > 0:
            emotions['happy'] = 75.0
            emotions['neutral'] = 25.0
            return emotions
        
        # Quick statistical analysis
        brightness = float(np.mean(face_region))  # Convert to float to save memory
        
        # Simple emotion mapping
        if brightness < 80:
            emotions['sad'] = 40.0
            emotions['neutral'] = 40.0
            emotions['angry'] = 20.0
        elif brightness > 140:
            emotions['surprise'] = 35.0
            emotions['neutral'] = 45.0
            emotions['happy'] = 20.0
        else:
            emotions['neutral'] = 80.0
            emotions['happy'] = 10.0
            emotions['sad'] = 10.0
        
        return emotions