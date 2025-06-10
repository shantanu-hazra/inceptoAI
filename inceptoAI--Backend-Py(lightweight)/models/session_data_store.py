import os
import json
import time
import logging
import threading
import queue
import numpy as np
from datetime import datetime
from datetime import datetime
import gc  # For garbage collection

from .emotional_analysis import LightweightEmotionDetector 

def check_logging_config():
    """Print current logging configuration to diagnose issues."""
    root_logger = logging.getLogger()
    print(f"Root logger level: {logging.getLevelName(root_logger.level)}")
    print(f"Handlers: {root_logger.handlers}")
    
    session_logger = logging.getLogger('session_data_store')
    print(f"Session logger level: {logging.getLevelName(session_logger.level)}")
    print(f"Session logger handlers: {session_logger.handlers}")
    print(f"Session logger propagate: {session_logger.propagate}")

class SessionDataStore:
    """
    Centralized store for managing all session data including:
    - Question/answer responses
    - Emotion analysis data
    - Speech analysis data
    All data is stored in a single JSON file per session.
    """
    
    def __init__(self, session_id):
        """Initialize the session data store."""
        import config
        
        self.session_id = session_id
        self.logger = logging.getLogger('session_data_store')
        
        # Initialize session data structure
        self.session_data = {
            'session_id': session_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'responses': {},
            'speech_analyses': [],
            'emotion_analysis': {
                'average_emotions': {},
                'average_confidence': 0,
                'detailed_emotions': {
                    "happy": [],
                    "sad": [],
                    "angry": [],
                    "fear": [],
                    "surprise": [],
                    "neutral": [],
                    "disgust": []
                },
                'confidence_signals': [],
                'eye_contact': [],
                'timestamps': [],
            }
        }
        
        # self.session_data = {
        #     'session_id': session_id,
        #     'created_at': datetime.now().isoformat(),
        #     'updated_at': datetime.now().isoformat(),
        #     'responses': {},
        #     'speech_analyses': [],
        #     'emotion_analysis': {
        #         'average_emotions': {},
        #         'average_confidence': 0,
        #         'detailed_emotions': {
        #             "happy": [],
        #             "sad": [],
        #             "angry": [],
        #             "fear": [],
        #             "surprise": [],
        #             "neutral": [],
        #             "disgust": []
        #         },
        #     }
        # }
        
        # Initialize frame processing components for emotion analysis
        self.is_running = False
        self.frame_queue = queue.Queue()
        self.analysis_thread = None

    
    # ========== Question-Answer Methods ==========
    
    def save_response(self, data, client_id=None):
        """Save a question-answer response to the session file"""
        try:
            # Extract basic information
            question_number = data.get('questionNumber') or data.get('question_number')
            if not question_number:
                return {
                    'status': 'error',
                    'message': 'Question number is required'
                }
                
            question_text = data.get('questionText') or data.get('question_text', f"Question {question_number}")
            answer = data.get('answer', '')
            timestamp = data.get('timestamp', datetime.now().isoformat())
            self.logger.info(f"Saving response for question {question_number}: {answer}")
            
            # Check if we already have an entry for this question
            question_key = str(question_number)
            existing_data = self.session_data['responses'].get(question_key, {})
            
            # Get video analysis data from the data parameter or existing data
            video_analysis = data.get('videoAnalysis') or data.get('video_analysis') or existing_data.get('video_analysis', {})
            
            # If video_analysis data is not provided in the data parameter,
            # check if it can be extracted from the video frames for this question
            if not video_analysis:
                # Attempt to get video analysis data for this question from frames
                try:
                    # This assumes there's a method to get video analysis from frames
                    # that were already captured for this question
                    video_analysis = self.get_video_analysis_for_question(question_number)
                    if video_analysis:
                        self.logger.info(f"Retrieved video analysis for question {question_number}")
                except Exception as video_err:
                    self.logger.warning(f"Could not retrieve video analysis: {str(video_err)}")
            
            # Format the data, including any video_analysis we found
            formatted_data = {
                'question_number': question_number,
                'question_text': question_text,
                'answer': answer,
                'timestamp': timestamp,
                'server_received_at': datetime.now().isoformat(),
                'speech_analysis': data.get('speechAnalysis') or data.get('speech_analysis', {}),
                'video_analysis': video_analysis,
            }
            
            # Add to session data
            self.session_data['responses'][question_key] = formatted_data
            self.session_data['updated_at'] = datetime.now().isoformat()
            
            return {
                'status': 'success',
                'message': f'Response saved successfully to session file',
                'session_file': self.session_file_path
            }
            
        except Exception as e:
            error_msg = f"Error saving question-answer response: {str(e)}"
            self.logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg
            }
    
    def update_video_analysis(self, question_number, video_analysis_data, data, save_file=True):
        """Update the video analysis data for a specific question."""
        try:
            question_key = str(question_number)
            if question_key not in self.session_data['responses']:
                self.logger.warning(f"Question {question_number} not found for video analysis update")
                # Get question text from data if available
                question_text = data.get('question_text') or data.get('questionText', f"Question {question_number}")
                
                # Create a placeholder entry if question doesn't exist yet
                self.session_data['responses'][question_key] = {
                    'question_number': question_number,
                    'question_text': question_text,  # Use the provided question text
                    'answer': '',
                    'timestamp': datetime.now().isoformat(),
                    'server_received_at': datetime.now().isoformat(),
                    'speech_analysis': {},
                    'video_analysis': {},
                    "aisui":{}
                }
                    
            # Update the video analysis data
            self.session_data['responses'][question_key]['video_analysis'] = video_analysis_data
            self.logger.info(video_analysis_data)
            
            # Save to file if requested
            # if save_file:
                # self._save_to_file()
                
            return {
                'status': 'success',
                'message': f'Video analysis for question {question_number} updated successfully'
            }
            
        except Exception as e:
            error_msg = f"Error updating video analysis: {str(e)}"
            self.logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg
            }
    
    def get_responses(self):
        """Get all responses from this session."""
        try:
            # Convert the responses dict to a sorted list
            responses_list = []
            for q_num, response in self.session_data['responses'].items():
                responses_list.append(response)
            
            # Sort by question number
            responses_list.sort(key=lambda x: int(x.get('question_number', 0)))
            
            return {
                'status': 'success',
                'count': len(responses_list),
                'responses': responses_list,
                'emotion_analysis': self.session_data.get('emotion_analysis', {}),
                'speech_analyses': self.session_data.get('speech_analyses', []),
                'session_id': self.session_id,
                'created_at': self.session_data.get('created_at'),
                'updated_at': self.session_data.get('updated_at')
            }
            
        except Exception as e:
            error_msg = f"Error retrieving responses: {str(e)}"
            self.logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg
            }
    
    # ========== Speech Analysis Methods ==========
    
    def save_speech_analysis(self, analysis_data, client_id=None):
        """Save speech analysis data to the session file."""
        try:
            # Add timestamp if not present
            if 'timestamp' not in analysis_data:
                analysis_data['timestamp'] = datetime.now().isoformat()
                
            # Add server timestamp
            analysis_data['server_received_at'] = datetime.now().isoformat()
            
            # Add client ID if provided
            if client_id:
                analysis_data['client_id'] = client_id
                
            # Add unique ID for this analysis
            analysis_id = f"speech_{len(self.session_data['speech_analyses']) + 1}"
            analysis_data['analysis_id'] = analysis_id
            
            # Add to session data
            self.session_data['speech_analyses'].append(analysis_data)
            
            # If the speech analysis is for a specific question, also update that question's data
            question_number = analysis_data.get('questionNumber') or analysis_data.get('question_number')
            if question_number:
                question_key = str(question_number)
                if question_key in self.session_data['responses']:
                    self.session_data['responses'][question_key]['speech_analysis'] = analysis_data
                else:
                    # Create a placeholder entry for this question
                    self.session_data['responses'][question_key] = {
                        'question_number': question_number,
                        'question_text': f"Question {question_number}",
                        'answer': '',
                        'timestamp': datetime.now().isoformat(),
                        'server_received_at': datetime.now().isoformat(),
                        'speech_analysis': analysis_data,
                        'video_analysis': {}
                    }
            
            # Save to file
            # self._save_to_file()
            
            self.logger.info(f"Saved speech analysis with ID {analysis_id}")
            
            return {
                "status": "success",
                "message": "Speech analysis data saved successfully",
                "analysis_id": analysis_id
            }
            
        except Exception as e:
            error_msg = f"Error saving speech analysis: {str(e)}"
            self.logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg
            }
    
    # ========== Emotion Analysis Methods ==========
    
    def _analysis_worker(self):
        """
        Worker function that runs in a background thread to process video frames.
        This continuously pulls frames from the queue and processes them for emotion analysis.
        """
        self.logger.info("Analysis worker thread started")
        
        # Process frames until stopped
        while self.is_running:
            try:
                # Attempt to get a frame from the queue with a timeout
                try:
                    frame_data, frame_id, question_number = self.frame_queue.get(timeout=1.0)
                    
                    # Process the frame
                    self._process_frame(frame_data, frame_id, question_number)
                    
                    # Mark the task as done
                    self.frame_queue.task_done()
                    
                    # Periodically save results to prevent data loss
                    if int(frame_id) % 100 == 0:
                        self.update_emotion_average_results()
                        
                except queue.Empty:
                    # No frames in the queue, just continue the loop
                    continue
                    
            except Exception as e:
                self.logger.error(f"Error in analysis worker: {str(e)}")
                import traceback
                self.logger.error(traceback.format_exc())
                
                # Brief pause to prevent CPU spinning in case of persistent errors
                time.sleep(0.1)
        
        self.logger.info("Analysis worker thread stopped")
    
    def start_emotion_analysis(self):
        """Start the emotion analysis process in a background thread."""
        self.is_running = True
        
        # Check logging configuration
        check_logging_config()
        
        self.logger.info("Emotion analysis started")
        print("Starting emotion analysis thread...")
        
        # Ensure queue is empty before starting
        while not self.frame_queue.empty():
            try:
                self.frame_queue.get_nowait()
                self.frame_queue.task_done()
            except queue.Empty:
                break
        
        # Create and start the thread
        self.analysis_thread = threading.Thread(target=self._analysis_worker)
        self.analysis_thread.daemon = True
        self.analysis_thread.start()
        
        # Verify thread started
        if self.analysis_thread.is_alive():
            print(f"Analysis thread started and is running: {self.analysis_thread.ident}")
        else:
            print("WARNING: Analysis thread failed to start!")
        
        return {
            "status": "success",
            "message": "Emotion analysis started",
            "thread_running": self.analysis_thread.is_alive() if self.analysis_thread else False
        }
    
    def stop_emotion_analysis(self):
        """Stop the emotion analysis process."""
        self.is_running = False
        if self.analysis_thread and self.analysis_thread.is_alive():
            self.analysis_thread.join(timeout=5)
        
        # Save final results
        self.update_emotion_average_results()
        self.save_video_analysis_by_question()
        
        self.logger.info("Emotion analysis stopped")
        
        return {
            "status": "success",
            "message": "Emotion analysis stopped and final results saved"
        }
    
    def add_frame(self, frame_data, frame_id, question_number=0):
        """Add a video frame to the processing queue."""
        self.frame_queue.put((frame_data, frame_id, question_number))
        
        # Log periodically to avoid flooding
        if int(frame_id) % 100 == 0:
            self.logger.debug(f"Added frame {frame_id} to analysis queue")
            
        return {
            "status": "success",
            "frame_id": frame_id
        }
    
    def _process_frame(self, frame_data, frame_id, question_number):
        """Memory-optimized frame processing"""
        try:
            # Convert bytes to image
            if isinstance(frame_data, bytes):
                nparr = np.frombuffer(frame_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                frame = frame_data
                
            if frame is None:
                self.logger.warning(f"Could not decode frame: {frame_id}")
                return
            
            # Resize frame if too large to save memory
            height, width = frame.shape[:2]
            if width > 640:  # Limit processing to reasonable size
                scale = 640 / width
                new_width = int(width * scale)
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Convert to grayscale (saves memory)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Release original frame from memory
            del frame
            
            # Detect faces with optimized parameters
            faces = emotion_detector.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.3, 
                minNeighbors=5,
                minSize=(30, 30),
                maxSize=(300, 300)  # Limit max size for efficiency
            )
            
            if len(faces) == 0:
                print(f"No faces detected in frame: {frame_id}")
                # Clean up memory
                del gray
                gc.collect()  # Force garbage collection
                return
            
            # Process only the first (largest) face
            (x, y, w, h) = faces[0]
            face_region = gray[y:y+h, x:x+w]
            
            # Release gray image from memory
            del gray
            
            # Analyze emotions
            emotions_dict = emotion_detector.analyze_facial_features(face_region)
            emotions = {emotion: float(score) for emotion, score in emotions_dict.items()}
            
            # Release face region from memory
            del face_region
            
            # Calculate confidence
            confidence = (
                emotions.get('happy', 0) +
                emotions.get('neutral', 0) * 0.5 -
                emotions.get('fear', 0) -
                emotions.get('sad', 0)
            )
            confidence_value = float(max(0, min(100, confidence)))
            
            # Debug output
            print(f"[{frame_id}] Emotions: {emotions}, Confidence: {confidence_value:.2f}")
            
            # Force garbage collection every 10 frames to prevent memory buildup
            if int(frame_id) % 10 == 0:
                gc.collect()
                
        except Exception as e:
            self.logger.error(f"Error processing frame {frame_id}: {str(e)}")
            # Clean up on error
            gc.collect()
            print(f"ERROR processing frame {frame_id}: {str(e)}")
    
    def update_emotion_analysis(self, analysis_results, save_file=True):
        """Update the emotion analysis data in the session file."""
        try:
            # Check if we're receiving average data or detailed data
            if "average_emotions" in analysis_results:
                # Update averages directly
                self.session_data['emotion_analysis']['average_emotions'] = analysis_results.get("average_emotions", {})
                self.session_data['emotion_analysis']['average_confidence'] = analysis_results.get("average_confidence", 0)
                
                # Calculate and update average emotions
                avg_emotions = {}
                for emotion, values in analysis_results.get("emotions", {}).items():
                    if values:
                        avg_emotions[emotion] = sum(item["value"] for item in values) / len(values)
                    else:
                        avg_emotions[emotion] = 0
                        
                self.session_data['emotion_analysis']['average_emotions'] = avg_emotions
                
                # Calculate and update average confidence
                confidence_values = analysis_results.get("confidence_signals", [])
                if confidence_values:
                    avg_confidence = sum(item["value"] for item in confidence_values) / len(confidence_values)
                    self.session_data['emotion_analysis']['average_confidence'] = avg_confidence
                    
            
            # Save to file if requested
            # if save_file:
                # self._save_to_file()
                
            return {
                'status': 'success',
                'message': 'Emotion analysis updated successfully'
            }
            
        except Exception as e:
            error_msg = f"Error updating emotion analysis: {str(e)}"
            self.logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg
            }
    
    def get_emotion_analysis(self):
        """Get the current emotion analysis results."""
        return self.session_data["emotion_analysis"]
    
    def update_emotion_average_results(self):
        """Calculate and save average emotion values."""
        try:
            # Calculate averages
            avg_emotions = {}
            for emotion, values in self.session_data["emotion_analysis"]["detailed_emotions"].items():
                if values:
                    avg_emotions[emotion] = sum(item["value"] for item in values) / len(values)
                else:
                    avg_emotions[emotion] = 0
            
            # Calculate average confidence
            confidence_values = self.session_data["emotion_analysis"]["confidence_signals"]
            avg_confidence = 0
            if confidence_values:
                avg_confidence = sum(item["value"] for item in confidence_values) / len(confidence_values)
            
            # Update the session data with this average data
            self.session_data["emotion_analysis"]["average_emotions"] = avg_emotions
            self.session_data["emotion_analysis"]["average_confidence"] = avg_confidence
            
            # Save to file
            # self._save_to_file()
            
            return {
                "emotions": avg_emotions,
                "confidence": avg_confidence,
                "total_frames": len(self.session_data["emotion_analysis"]["timestamps"]),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error saving average results: {str(e)}")
            return {"error": str(e)}
    
    def save_video_analysis_by_question(self):
        """Summarize and save video analysis data by question number."""
        try:
            # Group frame analysis by question number
            question_analysis = {}
            
            # Process emotions
            for emotion, frames in self.session_data["emotion_analysis"]["detailed_emotions"].items():
                
                logger.info(frames)
                for frame_data in frames:
                    question_num = str(frame_data["question"])
                    if question_num not in question_analysis:
                        question_analysis[question_num] = {
                            "emotions": {},
                            "confidence": 0,
                            "frame_count": 0
                        }
                    
                    if emotion not in question_analysis[question_num]["emotions"]:
                        question_analysis[question_num]["emotions"][emotion] = []
                    
                    question_analysis[question_num]["emotions"][emotion].append(frame_data["value"])
                    question_analysis[question_num]["frame_count"] += 1
            
            # Process confidence
            for confidence_data in self.session_data["emotion_analysis"]["confidence_signals"]:
                question_num = str(confidence_data["question"])
                if question_num in question_analysis:
                    if "confidence_values" not in question_analysis[question_num]:
                        question_analysis[question_num]["confidence_values"] = []
                    
                    question_analysis[question_num]["confidence_values"].append(confidence_data["value"])
            
            # Calculate averages and store per question
            for question_num, analysis_data in question_analysis.items():
                # Skip question 0 (typically used for general frames not tied to a specific question)
                if question_num == "0":
                    continue
                    
                video_analysis = {
                    "frame_count": analysis_data["frame_count"],
                    "average_emotions": {},
                    "average_confidence": 0,
                    "updated_at": datetime.now().isoformat()
                }
                
                # Calculate average emotions
                for emotion, values in analysis_data["emotions"].items():
                    if values:
                        video_analysis["average_emotions"][emotion] = sum(values) / len(values)
                
                # Calculate average confidence
                if "confidence_values" in analysis_data and analysis_data["confidence_values"]:
                    video_analysis["average_confidence"] = sum(analysis_data["confidence_values"]) / len(analysis_data["confidence_values"])
                
                # Update the question with this video analysis
                self.update_video_analysis(question_num, video_analysis, data, save_file=False)
                
                self.logger.info(f"Updated video analysis for question {question_num}")
            
            # Save to file after all updates
            # self._save_to_file()
            
            return {
                "status": "success",
                "message": "Video analysis saved by question"
            }
            
        except Exception as e:
            error_msg = f"Error saving video analysis by question: {str(e)}"
            self.logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg
            }
            
    def get_video_analysis_for_question(self, question_number):
        """
        Get video analysis data for a specific question from stored frames
        or other sources.
        
        Returns: 
            dict: Video analysis data or empty dict if none available
        """
        try:

            return {}
        except Exception as e:
            self.logger.error(f"Error getting video analysis for question {question_number}: {str(e)}")
            return {}
        
    