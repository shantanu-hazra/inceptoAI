# models/question_generator.py
import json
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import requests
import random

from models.session_data_store import SessionDataStore
from decouple import config as env_config


class QuestionGenerator:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.QUESTION_API_URL = env_config("EXPRESS_BACKEND_API_FETCH_QUESTIONS")
        
             
   
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_questions(self, role: str, company: str, question_number: int = 1, questions: dict = {}) -> str:
        """Fetch a random unused interview question from the database."""
        
        
        try:
            # Fetch all questions for the company from DB
            response =  requests.get(
                self.QUESTION_API_URL,
                json={"company": company},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            all_questions = response.json().get("questions", [])
            
            if not all_questions:
                self.logger.warning(f"No questions found for company: {company}, role: {role}")
                return None

            # Get already asked question texts
            asked_questions = [q.get('question_text') for q in questions.get('questions', [])]
            print(asked_questions)

            # Filter out already asked questions
            remaining_questions = [q for q in all_questions if q["question"] not in asked_questions]

            if not remaining_questions:
                self.logger.info("All questions have been used.")
                return None

            # Pick a random question from remaining
            selected = random.choice(remaining_questions)
            selected_question = selected["question"]

            self.logger.info(f"Question {question_number} selected for {company}: {selected_question}")
            return selected_question

        except Exception as e:
            self.logger.error(f"Error during fetching question: {e}")
            raise