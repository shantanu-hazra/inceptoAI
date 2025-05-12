# File path: utils/questions.py
import os
import json
import logging

logger = logging.getLogger(__name__)

def load_questions(file_path='data/questions.json'):
    """
    Load interview questions from a JSON file.
    
    Args:
        file_path: Path to the questions JSON file
        
    Returns:
        A list of question dictionaries
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"Questions file not found at {file_path}")
            return []
            
        with open(file_path, 'r') as f:
            questions = json.load(f)
            
        logger.info(f"Loaded {len(questions)} questions from {file_path}")
        return questions
    except Exception as e:
        logger.error(f"Error loading questions: {str(e)}")
        return []

def save_questions(questions, file_path='data/questions.json'):
    """
    Save interview questions to a JSON file.
    
    Args:
        questions: List of question dictionaries
        file_path: Path to save the questions JSON file
        
    Returns:
        Boolean indicating success or failure
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(questions, f, indent=2)
            
        logger.info(f"Saved {len(questions)} questions to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving questions: {str(e)}")
        return False