import os
from datetime import datetime

# Create a new session ID for this server instance
SESSION_ID = datetime.now().strftime("%Y%m%d_%H%M%S")


# Port for the server
PORT = int(os.environ.get('PORT', 5000))

# Dictionary to store session data stores for each client/session
session_data_stores = {}

# Keep the original dictionaries for backward compatibility during transition
# These can be removed once the full transition to session_data_stores is complete
emotion_analyzers = {}
speech_stores = {}
question_answer_stores = {}