# models/question_generator.py
import json
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import requests
import random

from utils.ext_api import Ext_Api
from decouple import config as env_config


class QuestionGenerator:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.ext_api=Ext_Api()   
        self.QUESTION_API_URL = env_config("EXPRESS_BACKEND_API_FETCH_QUESTIONS")
        self.SWE_ALIASES = {
            "swe",
            "software engineer",
            "software engineering", 
            "software engg",
            "frontend engineer",
            "backend engineer",
            "full stack engineer",
            "devops engineer",
            "site reliability engineer",
            "cloud engineer",
            "security engineer",
            "mobile engineer (ios)",
            "mobile engineer (android)",
            "qa engineer",
        }
        
    async def generate_ai(self, role: str, company: str, question_number: int = 1, questions:dict={}) -> str:
        """Generate role-specific interview questions using Groq."""

        if questions is None:
            questions = {}
        
        interview_prompt = f"""
        You are an experienced technical interviewer at {company} conducting an interview for a {role} position.
        This is question {question_number} out of 5.
        Ask the next most appropriate and concise interview question.
        These are the questions that have been asked till now {questions.get('questions', [])}
        Make your questions specific to the role and company.
        
        Provide only the next question without any additional text.
        """
        
        try:
            # question= Ext_Api.groq_api(interview_prompt)
            question = await self.ext_api.groq_api(interview_prompt)
              
            return question
            
        except Exception as e:
            self.logger.error(f"Error during generating question: {e}")
            raise    
   
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_questions(self, role: str, company: str, question_number: int = 1, questions: dict = {}) -> str:
        """If non-SWE role then fetch a random unused interview question from the database else Fall back to AI."""
        
        if questions is None:
            questions = {}
        
        try:
            if role.lower() not in self.SWE_ALIASES:
                return await self.generate_ai(role,company,question_number,questions)
        
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
