import os
from datetime import datetime
from flask import jsonify, request
import asyncio

import config
from models.session_data_store import SessionDataStore
from utils.questions import load_questions
from models.question_generator import QuestionGenerator
from flask import jsonify, request, current_app


def register_http_routes(app):
    @app.route('/status')
    def status():
        """Simple endpoint to check if server is running"""
        return jsonify({
            'status': 'online',
            'session_id': config.SESSION_ID,
            'clients': list(app.socketio.server.sockets.keys()),
            'active_data_stores': list(config.session_data_stores.keys()),
            'timestamp': datetime.now().isoformat()
        })

    @app.route('/analysis/<client_id>')
    def get_analysis(client_id):
        """Endpoint to get the current emotion analysis results for a client"""
        session_id = f"{client_id}"
        if session_id in config.session_data_stores:
            return jsonify(config.session_data_stores[session_id].get_emotion_analysis())
        else:
            return jsonify({'error': 'Client not found'}), 404

    @app.route('/api/save-audio-analysis', methods=['POST'])
    def save_audio_analysis():
        """Endpoint to save audio analysis data"""
        try:
            # Get data from request
            data = request.json
            
            if not data:
                return jsonify({
                    "status": "error", 
                    "message": "No data provided"
                }), 400
                
            # Use client_id from request - this should be the same socket ID 
            # that's used in WebSocket connections
            client_id = data.get('client_id')
            
            if not client_id:
                return jsonify({
                    "status": "error", 
                    "message": "client_id is required"
                }), 400
            
            # Create a session ID for this client
            session_id = f"{client_id}"
            
            # Get or create session data store
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Save the speech analysis data
            result = config.session_data_stores[session_id].save_speech_analysis(data, client_id)
            
            if result['status'] == 'success':
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            error_msg = f"Error processing request: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500

    @app.route('/api/audio-analyses', methods=['GET'])
    def list_analyses():
        """List all available speech analysis files"""
        try:
            results = []
            
            # Walk through the analysis directory
            for root, dirs, files in os.walk(config.ANALYSIS_DIR):
                for file in files:
                    if file.endswith('_session_data.json'):
                        file_path = os.path.join(root, file)
                        rel_path = os.path.relpath(file_path, config.ANALYSIS_DIR)
                        
                        # Get file stats
                        stats = os.stat(file_path)
                        
                        results.append({
                            "filename": file,
                            "path": rel_path,
                            "size_bytes": stats.st_size,
                            "created_at": datetime.fromtimestamp(stats.st_ctime).isoformat()
                        })
            
            return jsonify({
                "status": "success",
                "count": len(results),
                "analyses": results
            })
            
        except Exception as e:
            error_msg = f"Error listing analyses: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
            
    # Get interview questions
    @app.route('/api/questions', methods=['GET'])
    def get_questions():
        """
        Fetch interview questions for the frontend.
        
        Query parameters:
        - category: Filter questions by category
        - limit: Limit the number of questions returned
        """
        try:
            # Load questions from file
            questions_file = os.path.join('data', 'questions.json')
            questions = load_questions(questions_file)
            
            if not questions:
                return jsonify({
                    "status": "success",
                    "message": "No questions available",
                    "questions": []
                })
            
            # Apply optional filters
            category = request.args.get('category')
            if category:
                questions = [q for q in questions if q.get('category') == category]
                
            # Apply optional limit
            try:
                limit = int(request.args.get('limit', 0))
                if limit > 0:
                    questions = questions[:limit]
            except ValueError:
                pass
                
            return jsonify({
                "status": "success",
                "count": len(questions),
                "questions": questions
            })
            
        except Exception as e:
            error_msg = f"Error fetching questions: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error", 
                "message": error_msg
            }), 500
            
    # Get a specific question by ID
    @app.route('/api/questions/<int:question_id>', methods=['GET'])
    def get_question_by_id(question_id):
        """Fetch a specific interview question by ID"""
        try:
            # Load questions from file
            questions_file = os.path.join('data', 'questions.json')
            questions = load_questions(questions_file)
            
            # Find the question with the specified ID
            question = next((q for q in questions if q.get('id') == question_id), None)
            
            if question:
                return jsonify({
                    "status": "success",
                    "question": question
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Question with ID {question_id} not found"
                }), 404
                
        except Exception as e:
            error_msg = f"Error fetching question: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
            
    @app.route('/api/question-answers/<session_id>', methods=['GET'])
    def get_question_answers(session_id):
        """Get all question-answer responses for a session"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                # Try to create one (it will load data from disk if it exists)
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Get responses
            store = config.session_data_stores[session_id]
            result = store.get_responses()
            
            return jsonify(result)
            
        except Exception as e:
            error_msg = f"Error retrieving question-answers: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500

    @app.route('/api/question-answers', methods=['POST'])
    def save_question_answer():
        """Save a question-answer response via HTTP"""
        try:
            # Get data from request
            data = request.json
            
            if not data:
                return jsonify({
                    "status": "error", 
                    "message": "No data provided"
                }), 400
                
            # Get client ID from request - require it to match the socket ID
            client_id = data.get('client_id')
            
            if not client_id:
                return jsonify({
                    "status": "error", 
                    "message": "client_id is required"
                }), 400
                
            # Create a session ID consistent with WebSocket format
            session_id = f"{client_id}"
            
            # Create or get session data store
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
                
            # Save the response
            store = config.session_data_stores[session_id]
            result = store.save_response(data)
            
            # Update emotion analysis averages if available
            question_number = data.get('questionNumber') or data.get('question_number')
            if question_number:
                store.update_emotion_average_results()
                # Pass the entire data object to have access to question_text
                store.save_video_analysis_by_question(data)
            
            if result['status'] == 'success':
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            error_msg = f"Error saving question-answer: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
            
    @app.route('/api/session-data/<session_id>', methods=['GET'])
    def get_session_data(session_id):
        """Get all session data including questions, answers, and emotion analysis"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                # Try to create one (it will load data from disk if it exists)
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Get all session data
            store = config.session_data_stores[session_id]
            result = store.get_responses()
            
            return jsonify(result)
            
        except Exception as e:
            error_msg = f"Error retrieving session data: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
            
    # Add new endpoint for emotion analysis for a specific client/session
    @app.route('/api/emotion-analysis/<session_id>', methods=['GET'])
    def get_emotion_analysis(session_id):
        """Get emotion analysis data for a session"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                # Try to create one (it will load data from disk if it exists)
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Get emotion analysis
            store = config.session_data_stores[session_id]
            result = store.get_emotion_analysis()
            
            return jsonify({
                "status": "success",
                "emotion_analysis": result
            })
            
        except Exception as e:
            error_msg = f"Error retrieving emotion analysis: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
    
    # Add new endpoint to start emotion analysis
    @app.route('/api/start-emotion-analysis/<session_id>', methods=['POST'])
    def start_emotion_analysis(session_id):
        """Start emotion analysis for a session"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                # Create one
                config.session_data_stores[session_id] = SessionDataStore(session_id)
            
            # Start emotion analysis
            store = config.session_data_stores[session_id]
            result = store.start_emotion_analysis()
            
            return jsonify(result)
            
        except Exception as e:
            error_msg = f"Error starting emotion analysis: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
    
    # Add new endpoint to stop emotion analysis
    @app.route('/api/stop-emotion-analysis/<session_id>', methods=['POST'])
    def stop_emotion_analysis(session_id):
        """Stop emotion analysis for a session"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                return jsonify({
                    "status": "error",
                    "message": f"Session {session_id} not found"
                }), 404
            
            # Stop emotion analysis
            store = config.session_data_stores[session_id]
            result = store.stop_emotion_analysis()
            
            return jsonify(result)
            
        except Exception as e:
            error_msg = f"Error stopping emotion analysis: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
    
    # New endpoint to generate dynamic questions based on company and role
    @app.route('/api/generate-question', methods=['POST'])
    async def generate_question():
        """Generate an interview question based on company and role"""
        try:
            data = request.json
            
            if not data:
                return jsonify({
                    "status": "error", 
                    "message": "No data provided"
                }), 400
                
            company = data.get('company')
            role = data.get('role')
            question_number = data.get('questionNumber', 1)
            client_id = data.get('client_id')
            
            
            if not company or not role:
                return jsonify({
                    "status": "error", 
                    "message": "Company and role are required"
                }), 400
                
            if not client_id:
                return jsonify({
                    "status": "error", 
                    "message": "client_id is required"
                }), 400
            
            # Create question generator
            question_generator = QuestionGenerator()
            
            # Generate question
            question = await question_generator.generate_questions(role, company, question_number)
            
            # Save the question in the session data store (if we want to)
            session_id = f"{client_id}"
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
                
            # Format the question data to match expected format
            question_data = {
                "question_number": question_number,
                "question_text": question,
                "company": company,
                "role": role,
                "client_id": client_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # Store the question (without answer for now)
            store = config.session_data_stores[session_id]
            store.save_response(question_data)
            
            return jsonify({
                "status": "success",
                "question": question,
                "questionNumber": question_number,
                "company": company,
                "role": role
            })
            
        except Exception as e:
            error_msg = f"Error generating question: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
    
    # New endpoint to generate the next question and save the current answer
    @app.route('/api/next-question', methods=['POST'])
    async def next_question():
        """Generate the next question and save the current answer"""
        try:
            data = request.json
            
            if not data:
                return jsonify({
                    "status": "error", 
                    "message": "No data provided"
                }), 400
                
            company = data.get('company')
            role = data.get('role')
            current_question_number = data.get('questionNumber')
            next_question_number = current_question_number + 1
            answer = data.get('answer', '')
            client_id = data.get('client_id')
            analysis = data.get('analysis')
            
            if not company or not role:
                return jsonify({
                    "status": "error", 
                    "message": "Company and role are required"
                }), 400
                
            if not client_id:
                return jsonify({
                    "status": "error", 
                    "message": "client_id is required"
                }), 400
            
            # Create session ID consistent with WebSocket format
            session_id = f"{client_id}"
            
            # Save the current question and answer
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
                
            # Create the question-answer data to save
            question_answer_data = {
                "questionNumber": current_question_number,
                "question_text": data.get('question_text', f"Question {current_question_number}"),
                "answer": answer,
                "client_id": client_id,
                "company": company,
                "role": role,
                "timestamp": datetime.now().isoformat(),
                "speechAnalysis":analysis
            }
            
            # Save the response
            store = config.session_data_stores[session_id]
            store.save_response(question_answer_data)
            
            # Update emotion analysis if available
            store.update_emotion_average_results()
            store.save_video_analysis_by_question(question_answer_data)
            
            # Check if we should generate a new question (limit to 5 questions)
            if next_question_number <= 5:
                # Generate the next question
                question_generator = QuestionGenerator()
                next_question = await question_generator.generate_questions(role, company, next_question_number)
                
                # Return both the saved answer confirmation and the next question
                return jsonify({
                    "status": "success",
                    "message": "Answer saved and next question generated",
                    "nextQuestion": next_question,
                    "nextQuestionNumber": next_question_number,
                    "company": company,
                    "role": role
                })
            else:
                # No more questions
                return jsonify({
                    "status": "success",
                    "message": "Final answer saved",
                    "complete": True,
                })
                
        except Exception as e:
            error_msg = f"Error processing next question: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500
            
    @app.route("/api/complete_interview/<session_id>", methods=['POST'])
    def complete_interview(session_id):
        """Retrieve session data, evaluate the interview, send to another backend, and delete existing files"""
        try:
            # Check if we have a store for this session
            if session_id not in config.session_data_stores:
                return jsonify({
                    "status": "error",
                    "message": f"Session {session_id} not found"
                }), 404
                
            data = request.json
                
            store = config.session_data_stores[session_id]
            
            # Since the data is already combined, just get the current session data
            session_data = store.session_data
            
            # Step 1: Evaluate the interview data
            from models.interview_evaluator import InterviewEvaluator
            evaluation_results = asyncio.run(InterviewEvaluator.evaluate_interview_data(session_data))
            
            # Add evaluation results to the session data
            session_data['evaluation'] = evaluation_results
            
            # Step 2: Send the evaluated data to the other endpoint
            
                        
            target_api_url = "http://localhost:3000/api/users/interview/complete/"
            api_response = None
            api_success = False
            
            session_data["user_id"]=data.get("user_id")
            session_data["role"]=data.get("role")
            
            try:
                import requests
                response = requests.post(
                    target_api_url,
                    json=session_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10  # 10 second timeout
                )
                
                # Handle the response
                if response.status_code == 200:
                    app.logger.info(f"Successfully sent interview data to target API")
                    api_response = response.json()
                    api_success = True
                else:
                    app.logger.warning(f"Target API returned status code: {response.status_code}, Response: {response.text}")
            except Exception as api_err:
                app.logger.error(f"Failed to post to target API: {str(api_err)}")
            
            # Step 3: Delete the existing data files if API call was successful
            if api_success:
                try:
                    # Use the existing method from store to delete session files
                    store.delete_session_files()
                    app.logger.info(f"Deleted session files for {session_id}")
                except Exception as del_err:
                    app.logger.error(f"Failed to delete session files: {str(del_err)}")
            
            # Return combined results
            return jsonify({
                "status": "success" if api_success else "partial_success",
                "message": "Interview data processed successfully" if api_success else "Data evaluated but API upload failed",
                "api_response": api_response,
                "evaluation": evaluation_results
            })
            
        except Exception as e:
            error_msg = f"Error processing interview data: {str(e)}"
            app.logger.error(error_msg)
            import traceback
            app.logger.error(traceback.format_exc())
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 500