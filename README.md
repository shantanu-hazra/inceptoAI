Incepto AI

Incepto AI is an AI-powered mock interview assistant that helps candidates practice and improve their interview skills. It integrates question generation, speech analysis, and emotion/confidence detection into one seamless platform.

🔗 Live Project: https://incepto-ai.vercel.app/


✨ Features

1. Dynamic Questioning

    Choose company-specific or random questions.

    Next question adapts based on previous answers.

2. Interview Simulation

    Real-time video streaming for emotion/confidence analysis.

    Voice input for speech clarity, filler word detection, and sentiment.

    Automatic flow between questions and answers.

3. Performance Insights

    Emotion & confidence tracking throughout the session.

    Speech quality analysis (clarity, pauses, pace).

    Final detailed report with recommendations.


🛠️ Tech Stack

1. Frontend

    React.js (Vite)

    Tailwind CSS + ShadCN UI

2. Backend

    Node.js + Express.js (interview flow, API routes)

    Flask (Python) – emotion & speech analysis models

3. Database & Storage

    MongoDB (Atlas) – sessions, questions, analytics

    Cloudinary – file & report storage

4. Deployment

    Render (Express & Flask backends)

    Vercel (React frontend)


🔄 Working

1. Choose Interview Mode

    User selects either a company-specific interview (e.g., Google, Microsoft) or a general practice session.

2. Question Presented

    The server sends a question → frontend reads it aloud to the candidate.

4. Answering Phase

    User responds verbally while the camera streams frames for emotion/confidence tracking.

    Microphone input is recorded for speech clarity and filler word detection.

5. AI Analysis

    Flask backend analyzes the user’s emotion, confidence, and speech quality.

    Express backend manages question flow and stores session data in MongoDB.

6. Report Generation

    After all questions, a cumulative report is created.

    Report includes:
    
    Confidence trends across answers
    
    Speech clarity and filler word usage
    
    Strengths & weaknesses summary

7. Feedback Displayed
    
    User views a results dashboard with charts and improvement suggestions.
    
    Reports are stored in Cloudinary for secure access.

   
