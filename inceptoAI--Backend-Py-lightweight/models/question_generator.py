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
        self.ext_api = Ext_Api()
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

    async def generate_ai(self, role: str, company: str, question_number: int = 1, questions: dict = None) -> str:
        """Generate role-specific interview questions using Groq."""

        if questions is None:
            questions = {}

        self.logger.info(f"[generate_ai] Generating AI question | role='{role}' company='{company}' q_number={question_number}")

        interview_prompt = f"""
        You are an experienced technical interviewer at {company} conducting an interview for a {role} position.
        This is question {question_number} out of 5.
        Ask the next most appropriate and concise interview question.
        These are the questions that have been asked till now {questions.get('questions', [])}
        Make your questions specific to the role and company.
        
        Provide only the next question without any additional text.
        """

        try:
            question = await self.ext_api.groq_api(interview_prompt)
            self.logger.info(f"[generate_ai] Successfully generated AI question for role='{role}'")
            return question

        except Exception as e:
            self.logger.error(f"[generate_ai] Groq API call failed | role='{role}' company='{company}' error='{e}'")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_questions(self, role: str, company: str, question_number: int = 1, questions: dict = None) -> str:
        """If SWE role, fetch a random unused question from DB. Otherwise fall back to AI."""

        if questions is None:
            questions = {}

        self.logger.info(f"[generate_questions] Request received | role='{role}' company='{company}' q_number={question_number}")

        try:
            if role.lower() not in self.SWE_ALIASES:
                self.logger.info(f"[generate_questions] Non-SWE role detected ('{role}'), routing to AI generation")
                return await self.generate_ai(role, company, question_number, questions)

            # SWE role — fetch from DB
            self.logger.info(f"[generate_questions] SWE role detected, fetching questions from DB | url='{self.QUESTION_API_URL}' company='{company}'")

            try:
                response = requests.get(
                    self.QUESTION_API_URL,
                    json={"company": company},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
            except requests.exceptions.ConnectionError as e:
                self.logger.error(f"[generate_questions] Could not connect to questions API | url='{self.QUESTION_API_URL}' error='{e}'")
                raise
            except requests.exceptions.Timeout:
                self.logger.error(f"[generate_questions] Request timed out after 10s | url='{self.QUESTION_API_URL}' company='{company}'")
                raise

            # ✅ Check HTTP status before parsing — this is what caused your JSONDecodeError
            self.logger.debug(f"[generate_questions] API response | status={response.status_code} body_preview='{response.text[:200]}'")

            if response.status_code != 200:
                self.logger.error(
                    f"[generate_questions] API returned non-200 status | "
                    f"status={response.status_code} body='{response.text[:300]}'"
                )
                raise ValueError(f"Questions API returned HTTP {response.status_code}")

            if not response.text.strip():
                self.logger.error(f"[generate_questions] API returned empty response body | company='{company}'")
                raise ValueError("Questions API returned empty response body")

            try:
                all_questions = response.json().get("questions", [])
            except requests.exceptions.JSONDecodeError as e:
                self.logger.error(
                    f"[generate_questions] Failed to parse JSON | "
                    f"status={response.status_code} body='{response.text[:300]}' error='{e}'"
                )
                raise

            self.logger.info(f"[generate_questions] Fetched {len(all_questions)} questions from DB for company='{company}'")

            if not all_questions:
                self.logger.warning(f"[generate_questions] No questions found in DB | company='{company}' role='{role}'")
                return None

            # Filter out already asked questions
            asked_questions = [q.get('question_text') for q in questions.get('questions', [])]
            self.logger.debug(f"[generate_questions] Already asked questions: {asked_questions}")

            remaining_questions = [q for q in all_questions if q["question"] not in asked_questions]
            self.logger.info(f"[generate_questions] {len(remaining_questions)} unused questions remaining out of {len(all_questions)}")

            if not remaining_questions:
                self.logger.warning(f"[generate_questions] All DB questions exhausted for company='{company}'")
                return None

            selected = random.choice(remaining_questions)
            selected_question = selected["question"]

            self.logger.info(f"[generate_questions] Selected question #{question_number} for company='{company}': '{selected_question[:80]}...'")
            return selected_question

        except Exception as e:
            self.logger.error(f"[generate_questions] Unhandled error | role='{role}' company='{company}' error='{e}'")
            raise
