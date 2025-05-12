# models/interview_evaluator.py
import numpy as np
from datetime import datetime
from typing import Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from decouple import config
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InterviewEvaluator:
    
    def __init__(self, llm=None):
        try:
            api_key = config("GOOGLE_GEMINI_API_KEY")
            model_name = config("GOOGLE_GEMINI_MODEL_NAME")
            self.llm = llm or ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
            logger.info("InterviewEvaluator initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing InterviewEvaluator: {str(e)}")
            # Set a fallback or raise exception based on your needs
            self.llm = None
    
    """Evaluates interview data and provides comprehensive metrics"""
    
    @staticmethod
    def calculate_emotional_balance(emotions):
        """Calculate emotional balance score based on emotions distribution"""
        # Higher is better - indicates good balance of positive, neutral emotions
        positive = emotions.get('happy', 0) + emotions.get('surprise', 0) * 0.5
        negative = emotions.get('sad', 0) + emotions.get('angry', 0) + emotions.get('fear', 0) + emotions.get('disgust', 0)
        neutral = emotions.get('neutral', 0)
        
        # Ideal balance has good positive and neutral, minimal negative
        return min(100, max(0, (positive * 0.6 + neutral * 0.4 - negative * 0.8) * 10))

    @staticmethod
    def calculate_engagement_score(emotion_analysis):
        """Calculate engagement score based on emotion variations and face detection"""
        # Higher score means better engagement
        
        # Count frames with detected faces vs total frames
        timestamps = emotion_analysis.get('timestamps', [])
        confidence_signals = emotion_analysis.get('confidence_signals', [])
        
        if not timestamps:
            return 0
        
        # Variation in emotions indicates engagement
        emotion_values = []
        for emotion, values in emotion_analysis.get('detailed_emotions', {}).items():
            if values:
                # Calculate standard deviation of each emotion
                values_only = [v.get('value', 0) for v in values]
                if values_only:
                    emotion_values.extend(values_only)
        
        # If we have emotion values, calculate variation
        if emotion_values:
            variation = np.std(emotion_values) * 100
            return min(100, max(0, 50 + variation * 2))
        
        return 50  # Default engagement score

    @staticmethod
    def calculate_stress_indicator(emotions):
        """Calculate stress indicator based on emotions"""
        # Higher score means more stress
        stress_score = (
            emotions.get('fear', 0) * 0.4 + 
            emotions.get('angry', 0) * 0.3 + 
            emotions.get('sad', 0) * 0.2 + 
            emotions.get('disgust', 0) * 0.1
        ) * 100
        
        return min(100, max(0, stress_score))

    @staticmethod
    def calculate_interview_duration(responses):
        """Calculate total interview duration from timestamps"""
        if not responses:
            return 0
        
        # If responses is a dictionary (with question numbers as keys), convert it to a list of values
        if isinstance(responses, dict):
            responses = list(responses.values())
        
        # Sort responses by question number
        sorted_responses = sorted(responses, key=lambda x: int(x.get('question_number', 0) or x.get('questionNumber', 0)))
        
        # Get first and last timestamps
        try:
            first_timestamp = datetime.fromisoformat(sorted_responses[0].get('timestamp'))
            last_timestamp = datetime.fromisoformat(sorted_responses[-1].get('timestamp'))
            
            # Calculate duration in seconds
            duration_seconds = (last_timestamp - first_timestamp).total_seconds()
            return duration_seconds
        except (ValueError, IndexError) as e:
            logger.error(f"Error calculating interview duration: {str(e)}")
            return 0
            
    @staticmethod
    def calculate_answer_quality(responses):
        """Calculate answer quality metrics"""
        if not responses:
            return {
                "average_length": 0,
                "detail_score": 0,
                "overall_quality": 0
            }
            
        # If responses is a dictionary (with question numbers as keys), convert it to a list of values
        if isinstance(responses, dict):
            responses = list(responses.values())
                
        total_length = 0
        total_words = 0
        total_sentences = 0
        
        for response in responses:
            # Check if response is a dictionary before using .get()
            if isinstance(response, dict):
                answer = response.get('answer', '')
            elif isinstance(response, str):
                # If response is a string, use it directly as the answer
                answer = response
            else:
                # For any other type, use empty string as fallback
                answer = ''
                
            if answer:
                total_length += len(answer)
                words = answer.split()
                total_words += len(words)
                sentences = answer.count('.') + answer.count('!') + answer.count('?')
                total_sentences += max(1, sentences)  # At least 1 sentence
        
        avg_length = total_length / len(responses) if responses else 0
        avg_words = total_words / len(responses) if responses else 0
        avg_words_per_sentence = total_words / total_sentences if total_sentences else 0
        
        # Calculate detail score (higher for more complex answers)
        detail_score = min(100, (avg_words_per_sentence / 20) * 100)
        
        # Overall quality score
        quality_score = min(100, (avg_words / 100) * 80 + (avg_words_per_sentence / 20) * 20)
        
        return {
            "average_length": avg_length,
            "average_words": avg_words,
            "words_per_sentence": avg_words_per_sentence,
            "detail_score": detail_score,
            "overall_quality": quality_score
        }

    @staticmethod
    def calculate_keywords_usage(responses, role):
        """Calculate usage of role-relevant keywords"""
        # If responses is a dictionary (with question numbers as keys), convert it to a list of values
        if isinstance(responses, dict):
            responses = list(responses.values())
            
        # Define common keywords by role
        role_keywords = {
            "software engineer": ["algorithm", "code", "development", "programming", "software", "design", "solution", "testing", "debug", "optimize"],
            "product manager": ["product", "market", "strategy", "user", "customer", "prioritize", "roadmap", "requirements", "stakeholder", "value"],
            "data scientist": ["data", "analysis", "model", "algorithm", "statistics", "machine learning", "insight", "prediction", "visualization", "hypothesis"],
            "designer": ["design", "user experience", "interface", "usability", "prototype", "visual", "feedback", "creative", "user-centered", "aesthetic"],
            "marketing": ["marketing", "campaign", "brand", "customer", "audience", "strategy", "conversion", "engagement", "analytics", "content"]
        }
        
        # Default keywords for any role
        default_keywords = ["experience", "team", "project", "challenge", "success", "communicate", "learn", "improve", "goal", "collaborate"]
        
        # Get keywords for this role or use default
        keywords = role_keywords.get(role.lower(), default_keywords)
        
        # Count keyword occurrences
        keyword_counts = {keyword: 0 for keyword in keywords}
        total_words = 0
        
        for response in responses:
            if isinstance(response, dict):
                answer = response.get('answer', '').lower()
                if answer:
                    total_words += len(answer.split())
                    for keyword in keywords:
                        keyword_counts[keyword] += answer.count(keyword.lower())
        
        # Calculate keyword density
        keyword_density = sum(keyword_counts.values()) / total_words if total_words else 0
        
        return {
            "keyword_counts": keyword_counts,
            "keyword_density": keyword_density,
            "relevance_score": min(100, keyword_density * 500)  # Scale up for readability
        }
        
    async def evaluate_answer(self, question_data, emotion_data=None, role="candidate") -> Dict:
        """
        Evaluate a single interview answer using AI.
        
        Args:
            question_data: Dictionary containing question and answer data
            emotion_data: Dictionary containing emotion analysis for this question (optional)
            role: The role the candidate is interviewing for
            
        Returns:
            Dictionary with evaluation metrics
        """
        question = question_data.get('question_text', '')
        answer = question_data.get('answer', '')
        question_number = question_data.get('question_number', 0)
        
        # Extract emotion data for this specific question if available
        question_emotions = {}
        if emotion_data and 'detailed_emotions' in emotion_data:
            for emotion, values in emotion_data['detailed_emotions'].items():
                for value in values:
                    if value.get('question') == question_number:
                        question_emotions[emotion] = value.get('value', 0)
        
        # Speech metrics if available
        speech_metrics = question_data.get('speech_analysis', {})
        wpm = speech_metrics.get('wpm', 0)
        clarity = speech_metrics.get('clarity', 0)
        
        prompt = f"""
        You are an expert interviewer evaluating a candidate for a {role} position.
        
        Analyze this Q&A from question #{question_number}:
        
        QUESTION: {question}
        
        CANDIDATE'S ANSWER: {answer}
        
        {"Additional context - The candidate's emotional signals during this answer:" if question_emotions else ""}
        {", ".join([f"{emotion}: {value:.1f}%" for emotion, value in question_emotions.items()]) if question_emotions else ""}
        
        {"Speech metrics: " + f"Speaking rate: {wpm} words per minute, Clarity score: {clarity}/100" if wpm > 0 else ""}
        
        Provide a detailed analysis in this exact JSON format:
        {{
            "answer_score": integer from 0-100,
            "completeness": integer from 0-100 indicating how completely the question was answered,
            "relevance": integer from 0-100 indicating how relevant the answer was to the question,
            "structure": integer from 0-100 rating the organization and flow of the answer,
            "key_strengths": [list of 1-3 specific strengths in the answer],
            "improvement_areas": [list of 1-3 specific areas to improve],
            "emotional_assessment": "brief analysis of how the candidate's emotional state may have impacted their answer",
            "ideal_keywords": [list of 3-5 keywords that would strengthen this answer for this role],
            "missing_elements": "description of any critical information omitted from the answer"
        }}
        
        If the answer is empty or very brief, focus evaluation on what should have been included rather than critique.
        Ensure your response is ONLY the valid JSON object and nothing else.
        """
        
        try:
            if not self.llm:
                raise ValueError("LLM is not initialized")
                
            response = self.llm.invoke(prompt)
            
            # Log the response for debugging
            logger.debug(f"Raw LLM response: {response.content}")
            
            # Extract JSON from response - handle potential formatting issues
            json_str = response.content.strip()
            
            # Remove any markdown code block indicators if present
            if json_str.startswith("```json"):
                json_str = json_str.replace("```json", "", 1)
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            json_str = json_str.strip()
            
            # Parse the response content as JSON
            evaluation_data = json.loads(json_str)
            
            # Add metadata
            evaluation_data["question_number"] = question_number
            evaluation_data["question_text"] = question
            evaluation_data["answer"] = answer
            evaluation_data["timestamp"] = datetime.now().isoformat()
            
            logger.info(f"Successfully evaluated answer for question {question_number}")
            return evaluation_data
            
        except Exception as e:
            logger.error(f"Error evaluating answer for question {question_number}: {str(e)}")
            return {
                "question_number": question_number,
                "question_textr": question,
                "answer": answer,
                "answer_score": 0,
                "completeness": 0, 
                "relevance": 0,
                "structure": 0,
                "key_strengths": ["Unable to evaluate"],
                "improvement_areas": ["Technical difficulties during evaluation"],
                "emotional_assessment": "Unable to assess",
                "ideal_keywords": [],
                "missing_elements": "Evaluation unavailable",
                "timestamp": datetime.now().isoformat()
            }

    @classmethod
    async def evaluate_interview_data(cls, interview_data, role="candidate"):
        """Main function to evaluate interview data with AI-powered answer analysis"""
        evaluator = cls()
        
        # Extract response data
        responses = interview_data.get('responses', {})  # Use {} as default for dict
        emotion_analysis = interview_data.get('emotion_analysis', {})
        
        # Get role and other metadata
        role = None
        if isinstance(responses, dict):
            # Try to find role in any of the dictionary values
            for response_value in responses.values():
                if isinstance(response_value, dict) and 'role' in response_value:
                    role = response_value.get('role')
                    break
        elif isinstance(responses, list):
            # Original code for when responses is a list
            for response in responses:
                if isinstance(response, dict) and 'role' in response:
                    role = response.get('role')
                    break
        
        # Use default role if none found
        role = role or "candidate"
        
        # Calculate traditional metrics
        emotion_metrics = {
            "confidence_score": emotion_analysis.get('average_confidence', 0),
            "emotional_balance": evaluator.calculate_emotional_balance(emotion_analysis.get('average_emotions', {})),
            "engagement_score": evaluator.calculate_engagement_score(emotion_analysis),
            "stress_indicator": evaluator.calculate_stress_indicator(emotion_analysis.get('average_emotions', {}))
        }
        
        answer_quality = evaluator.calculate_answer_quality(responses)
        keywords_usage = evaluator.calculate_keywords_usage(responses, role)
        
        # Perform AI-based evaluations for each response
        response_evaluations = []
        if isinstance(responses, dict):
            response_list = list(responses.values())
        else:
            response_list = responses
        
        for question_data in response_list:
            if isinstance(question_data, dict):
                # Only evaluate if there's actually an answer
                if question_data.get('answer'):
                    try:
                        evaluation = await evaluator.evaluate_answer(
                            question_data=question_data,
                            emotion_data=emotion_analysis,
                            role=role
                        )
                        response_evaluations.append(evaluation)
                    except Exception as e:
                        logger.error(f"Error in individual question evaluation: {str(e)}")
        
        # Aggregate AI evaluation results
        ai_evaluation_metrics = {
            "answer_scores": [],
            "average_completeness": 0,
            "average_relevance": 0,
            "average_structure": 0,
            "key_strengths": [],
            "common_improvement_areas": [],
            "emotional_insights": [],
            "missing_keywords": []
        }
        
        if response_evaluations:
            # Collect scores
            for eval_data in response_evaluations:
                ai_evaluation_metrics["answer_scores"].append(eval_data.get("answer_score", 0))
                
                # Collect strengths and improvement areas
                ai_evaluation_metrics["key_strengths"].extend(eval_data.get("key_strengths", []))
                ai_evaluation_metrics["common_improvement_areas"].extend(eval_data.get("improvement_areas", []))
                
                # Collect emotional insights
                if "emotional_assessment" in eval_data and eval_data["emotional_assessment"] != "Unable to assess":
                    ai_evaluation_metrics["emotional_insights"].append(eval_data["emotional_assessment"])
                
                # Collect missing keywords
                ai_evaluation_metrics["missing_keywords"].extend(eval_data.get("ideal_keywords", []))
            
            # Calculate averages
            ai_evaluation_metrics["average_completeness"] = sum(
                eval_data.get("completeness", 0) for eval_data in response_evaluations
            ) / len(response_evaluations)
            
            ai_evaluation_metrics["average_relevance"] = sum(
                eval_data.get("relevance", 0) for eval_data in response_evaluations
            ) / len(response_evaluations)
            
            ai_evaluation_metrics["average_structure"] = sum(
                eval_data.get("structure", 0) for eval_data in response_evaluations
            ) / len(response_evaluations)
            
            # Deduplicate lists
            ai_evaluation_metrics["key_strengths"] = list(set(ai_evaluation_metrics["key_strengths"]))[:5]
            ai_evaluation_metrics["common_improvement_areas"] = list(set(ai_evaluation_metrics["common_improvement_areas"]))[:5]
            ai_evaluation_metrics["missing_keywords"] = list(set(ai_evaluation_metrics["missing_keywords"]))[:10]
        
        # Calculate AI-enhanced overall score (incorporating AI evaluations)
        if response_evaluations:
            ai_score_component = sum(ai_evaluation_metrics["answer_scores"]) / len(ai_evaluation_metrics["answer_scores"])
            ai_score_weight = 0.4  # Adjust weight as needed
            
            traditional_score_component = (
                emotion_metrics['confidence_score'] * 0.15 +
                emotion_metrics['emotional_balance'] * 0.15 +
                emotion_metrics['engagement_score'] * 0.1 -
                emotion_metrics['stress_indicator'] * 0.05 +
                answer_quality['overall_quality'] * 0.15 +  # Reduced from 0.4
                keywords_usage.get('relevance_score', 0) * 0.1  # Reduced from 0.15
            )
            
            traditional_weight = 1 - ai_score_weight
            overall_score = (traditional_score_component * traditional_weight) + (ai_score_component * ai_score_weight)
        else:
            # Fall back to traditional scoring if no AI evaluations
            overall_score = (
                emotion_metrics['confidence_score'] * 0.15 +
                emotion_metrics['emotional_balance'] * 0.15 +
                emotion_metrics['engagement_score'] * 0.1 -
                emotion_metrics['stress_indicator'] * 0.05 +
                answer_quality['overall_quality'] * 0.4 +
                keywords_usage.get('relevance_score', 0) * 0.15
            )
        
        # Comprehensive evaluation report
        comprehensive_report = {
            "overall_score": min(100, max(0, overall_score)),
            "emotion_metrics": emotion_metrics,
            "answer_quality": answer_quality,
            "keywords_usage": keywords_usage,
            "interview_duration_seconds": evaluator.calculate_interview_duration(responses),
            "ai_evaluation": ai_evaluation_metrics,
            "detail_evaluations": response_evaluations,  # Include individual question evaluations
            "timestamp": datetime.now().isoformat()
        }
        
        return comprehensive_report