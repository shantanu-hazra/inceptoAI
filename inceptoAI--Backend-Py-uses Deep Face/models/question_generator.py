# models/question_generator.py
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from decouple import config
import json
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import asyncio

class QuestionGenerator:
    def __init__(self):
        """Initialize the Gemini-powered question generator."""
        api_key = config("GOOGLE_GEMINI_API_KEY")
        model_name = config("GOOGLE_GEMINI_MODEL_NAME")
        self.llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
        
        # Create and use cache directory consistently
        self.cache_dir = os.path.join(os.getcwd(), "question")
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
        self.questions_cache = os.path.join(self.cache_dir, "questions_cache.json")
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_questions(self, role: str, company: str, question_number: int = 1) -> str:
        """Generate role-specific interview questions using Gemini AI."""
        interview_prompt = f"""
        You are an experienced technical interviewer at {company} conducting an interview for a {role} position.
        This is question {question_number} out of 5.
        Ask the next most appropriate and concise interview question.
        Make your questions specific to the role and company.
        
        Provide only the next question without any additional text.
        """
        
        try:
            # Since we're using async, we need to use an asyncio executor for non-async operations
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.llm.invoke(interview_prompt))
            question = response.content
            
            # Cache the generated question
            self._cache_questions(role, company, question_number, question)
            
            return question
            
        except Exception as e:
            # Fallback to cached questions if available
            cached = self._get_cached_questions(role, company, question_number)
            if cached:
                return cached
            raise e
            
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def evaluate_answer(self, question: str, answer: str, role: str) -> Dict:
        """Evaluate interview answer using Gemini AI."""
        prompt = f"""
        As an interviewer for {role} position, evaluate:
        Question: {question}
        Answer: {answer}

        Provide:
        1. Rating (1-10)
        2. Strengths
        3. Areas for improvement
        4. Better answer suggestion

        Format the response as JSON with these exact keys:
        {{
            "rating": number,
            "strengths": [list of strings],
            "areas_for_improvement": [list of strings],
            "better_answer": string
        }}
        """
        
        try:
            # Since we're using async, we need to use an asyncio executor for non-async operations
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.llm.invoke(prompt))
            # Parse the response content as JSON
            return json.loads(response.content)
            
        except Exception as e:
            return {
                'rating': 0,
                'strengths': ['Unable to evaluate answer'],
                'areas_for_improvement': ['Technical difficulties during evaluation'],
                'better_answer': 'Evaluation unavailable'
            }
            
    def _cache_questions(self, role: str, company: str, question_number: int, question: str):
        """Cache generated questions for future use."""
        try:
            if os.path.exists(self.questions_cache):
                with open(self.questions_cache, 'r') as f:
                    cache = json.load(f)
            else:
                cache = {}
                
            key = f"{role}_{company}"
            if key not in cache:
                cache[key] = {}
                
            cache[key][str(question_number)] = question
            
            with open(self.questions_cache, 'w') as f:
                json.dump(cache, f)
                
        except Exception:
            pass  # Silently fail if caching isn't possible
            
    def _get_cached_questions(self, role: str, company: str, question_number: int) -> str:
        """Retrieve cached questions if available."""
        try:
            if os.path.exists(self.questions_cache):
                with open(self.questions_cache, 'r') as f:
                    cache = json.load(f)
                return cache.get(f"{role}_{company}", {}).get(str(question_number), "")
        except Exception:
            return ""