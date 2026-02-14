# models/question_generator.py
import json
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from utils.ext_api import Ext_Api
from models.session_data_store import SessionDataStore

class QuestionGenerator:
    def __init__(self):
        self.ext_api=Ext_Api()   
        self.logger = logging.getLogger(__name__)
             
   
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_questions(self, role: str, company: str, question_number: int = 1, questions:dict={}) -> str:
        """Generate role-specific interview questions using Groq."""

        interview_prompt = f"""
        You are an experienced technical interviewer at {company} conducting an interview for a {role} position.
        This is question {question_number} out of 5.
        Ask the next most appropriate and concise interview question.
        These are the questions that have been asked till now {questions['questions']}
        Make your questions specific to the role and company.
        
        Provide only the next question without any additional text.
        """
        
        try:
            # question= Ext_Api.groq_api(interview_prompt)
            question = await self.ext_api.groq_api(interview_prompt)
              
            return question
            
        except Exception as e:
            self.logger.info("Error during generating question: ", e)            