import os
from datetime import datetime
from flask import jsonify, request
import asyncio

import config
from models.session_data_store import SessionDataStore
from models.question_generator import QuestionGenerator
from flask import jsonify, request, current_app

from decouple import config as env_config


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
            
            # Save the question in the session data store (if we want to)
            session_id = f"{client_id}"
            if session_id not in config.session_data_stores:
                config.session_data_stores[session_id] = SessionDataStore(session_id)
                
            store = config.session_data_stores[session_id]
            print(store)            
            # Generate question
            question = await question_generator.generate_questions(role, company, question_number,store.get_all_questions())
                
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
            # store.save_video_analysis_by_question(question_answer_data)
            store.save_video_analysis_by_question()
            
            # Check if we should generate a new question (limit to 5 questions)
            if next_question_number <= 5:
                # Generate the next question
                question_generator = QuestionGenerator()
                next_question = await question_generator.generate_questions(role, company, next_question_number, store.get_all_questions())
                
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
            
                        
            target_api_url = env_config("EXPRESS_BACKEND_API_COMPLETE_INTERVIEW")
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
                
                print(session_data)
                print(response)
                
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