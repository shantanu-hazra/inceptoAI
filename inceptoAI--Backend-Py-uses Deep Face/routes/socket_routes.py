import base64
import logging
from datetime import datetime
from flask import request
from flask_socketio import emit

import config
from models.session_data_store import SessionDataStore
from flask import jsonify, request, current_app

logger = logging.getLogger(__name__)

def register_socket_routes(socketio):
    @socketio.on('connect')
    def handle_connect():
        client_id = request.sid
        logger.info(f"Client connected: {client_id}")
        
        # Create a session ID for this client
        session_id = f"{client_id}"
        
        # Create a new SessionDataStore for this client
        config.session_data_stores[session_id] = SessionDataStore(client_id)
        
        # Start emotion analysis
        config.session_data_stores[session_id].start_emotion_analysis()
        
        # Return client_id to the client so they can use it in HTTP requests
        # emit({'status': 'success', 
        #         'message': 'Connected and session data store created',
        #         'client_id': client_id
        #     },to=client_id)

    @socketio.on('disconnect')
    def handle_disconnect():
        client_id = request.sid
        logger.info(f"Client disconnected: {client_id}")
        
        # Get session ID for this client
        session_id = f"{client_id}"
        
        # Stop and cleanup the session data store for this client
        if session_id in config.session_data_stores:
            # Stop emotion analysis
            config.session_data_stores[session_id].stop_emotion_analysis()
            # Delete the reference to free memory
            del config.session_data_stores[session_id]
            
        logger.info(f"Cleaned up resources for client {client_id}")

    @socketio.on('frame')
    def handle_frame(data):
        """
        Handle incoming video frames.
        Expected data format: {frameId: number, frame: base64EncodedJpeg, questionNumber: number}
        """
        try:
            # Extract frame data
            frame_id = data.get('frameId')
            frame_data = data.get('frame')
            question_number = data.get('questionNumber', 0)  # Default to 0 if not provided
            
            if not frame_data or frame_id is None:  # Allow frameId to be 0
                logger.warning("Received frame with missing data")
                return {'status': 'error', 'message': 'Missing frame data'}
            
            client_id = request.sid
            session_id = f"{client_id}"

            
            # Remove the base64 image prefix if present
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            
            try:
                # Decode the base64 image
                image_data = base64.b64decode(frame_data)
            except Exception as e:
                logger.error(f"Failed to decode base64 image: {str(e)}")
                return {'status': 'error', 'message': 'Invalid base64 image data'}
            
            # Log periodically to avoid flooding the console
            if int(frame_id) % 10 == 0:
                logger.info(f"Processing frame {frame_id} for client {client_id}")
                
            
            
            # Send the frame for emotion analysis using the session data store
            if session_id in config.session_data_stores:
                result = config.session_data_stores[session_id].add_frame(image_data, frame_id, question_number)
                return result
            else:
                logger.warning(f"No session data store found for client {client_id}")
                return {'status': 'error', 'message': 'Session data store not found'}
        
        except Exception as e:
            logger.error(f"Error handling frame: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    @socketio.on('stop_capture')
    def handle_stop_capture(data):
        """Handle stop capture event from client and save average results."""
        client_id = request.sid
        session_id = f"{client_id}"
        logger.info(f"Stop capture event received from client {client_id}")
        
        transcript = data.get('transcript')
        
        # Save average analysis results
        emotion_results = None
        if session_id in config.session_data_stores:
            # Update emotion averages and save to file
            emotion_results = config.session_data_stores[session_id].update_emotion_average_results()
            # Update video analysis by question
            config.session_data_stores[session_id].save_video_analysis_by_question(transcript)
        
        return {'status': 'success', 'average_results': emotion_results}

    @socketio.on('save_speech_analysis')
    def handle_save_speech_analysis(data):
        """Handle saving speech analysis data."""
        client_id = request.sid
        session_id = f"{client_id}"
        logger.info(f"Saving speech analysis for client {client_id}")
        
        if not data:
            return {'status': 'error', 'message': 'No speech analysis data provided'}
        
        # Save using the session data store
        if session_id in config.session_data_stores:
            # Include client_id in the data to maintain consistency
            if not data.get('client_id'):
                data['client_id'] = client_id
                
            result = config.session_data_stores[session_id].save_speech_analysis(data, client_id)
            return result
        else:
            return {'status': 'error', 'message': 'Session data store not found'}
        
    @socketio.on('question_answer_data')
    def handle_question_answer_data(data):
        """Handle question-answer data from client"""
        try:
            # Get client info
            client_id = request.sid  # Socket ID is the client ID
            
            # Always use the socket ID for consistency with HTTP routes
            if not data.get('client_id'):
                data['client_id'] = client_id
                
            # Create session ID using the standard format
            session_id = f"{client_id}"
            
            # Create or get session data store for this session
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Save the response
            store = config.session_data_stores[session_id]
            result = store.save_response(data)
            
            # Update emotion analysis if available
            question_number = data.get('questionNumber') or data.get('question_number')
            if question_number:
                # Update emotion averages for this question
                store.update_emotion_average_results()
                store.save_video_analysis_by_question(data)
            
            return result
        except Exception as e:
            error_msg = f"Error processing question-answer data: {str(e)}"
            current_app.logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg
            }