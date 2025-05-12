// src/utils/questionService.js
import apiService from "./apiServices";

class QuestionService {
  constructor() {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.company = "";
    this.role = "";
  }

  /**
   * Fetch all available questions from the server
   * @param {Object} options - Optional parameters like category or limit
   * @returns {Promise<Array>} - Array of question objects
   */
  async fetchQuestions(options = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      if (options.category) queryParams.append("category", options.category);
      if (options.limit) queryParams.append("limit", options.limit);

      const queryString = queryParams.toString();
      const endpoint = `/api/questions${queryString ? `?${queryString}` : ""}`;

      const response = await apiService.get(endpoint);

      if (response.status === "success") {
        this.questions = response.questions || [];
        this.currentQuestionIndex = 0;
        return this.questions;
      } else {
        console.error("Error fetching questions:", response.message);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      return [];
    }
  }

  /**
   * Generate a dynamic interview question based on company and role
   * @param {string} company - Target company
   * @param {string} role - Job role
   * @param {number} questionNumber - Current question number
   * @returns {Promise<Object>} - Generated question data
   */
  async generateQuestion(company, role, questionNumber) {
    try {
      this.company = company;
      this.role = role;

      const response = await fetch(
        `${apiService.baseUrl}/api/generate-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company,
            role,
            questionNumber,
            client_id: apiService.sessionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        return {
          status: "success",
          question: data.question,
          questionNumber: data.questionNumber,
          company: data.company,
          role: data.role,
        };
      } else {
        console.error("Error generating question:", data.message);
        return { status: "error", message: data.message };
      }
    } catch (error) {
      console.error("Failed to generate question:", error);
      return { status: "error", message: error.message };
    }
  }

  /**
   * Submit the current answer and get the next question
   * @param {string} company - Target company
   * @param {string} role - Job role
   * @param {number} questionNumber - Current question number
   * @param {string} questionText - Current question text
   * @param {string} answer - User's answer
   * @param {Object} analysis - Analysis of the answer
   * @returns {Promise<Object>} - Next question data or completion status
   */
  async submitAnswerAndGetNextQuestion(
    company,
    role,
    questionNumber,
    questionText,
    answer,
    analysis
  ) {
    try {
      const response = await fetch(`${apiService.baseUrl}/api/next-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          questionNumber,
          question_text: questionText,
          answer,
          analysis,
          client_id: apiService.socket.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Failed to process next question:", error);
      return { status: "error", message: error.message };
    }
  }

  /**
   * Complete the interview (mark as finished)
   * @param {string} clientId - Client ID
   * @param {Object} finalAnswerData - Data for the final answer (optional)
   * @returns {Promise<Object>} - Completion status
   */
  async completeInterview(clientId, finalAnswerData = null) {
    try {
      const data = {
        client_id: clientId,
      };

      // Include final answer data if provided
      if (finalAnswerData) {
        Object.assign(data, finalAnswerData);
      }

      const response = await fetch(
        `${apiService.baseUrl}/api/complete-interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to complete interview:", error);
      return { status: "error", message: error.message };
    }
  }

  /**
   * Get a specific question by ID
   * @param {number} id - Question ID
   * @returns {Promise<Object|null>} - Question object or null if not found
   */
  async getQuestionById(id) {
    try {
      const response = await apiService.get(`/api/questions/${id}`);

      if (response.status === "success") {
        return response.question;
      } else {
        console.error("Error fetching question:", response.message);
        return null;
      }
    } catch (error) {
      console.error(`Failed to fetch question with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Get the current question
   * @returns {Object|null} - Current question or null if no questions available
   */
  getCurrentQuestion() {
    if (this.questions.length === 0) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Move to the next question
   * @returns {Object|null} - Next question or null if no more questions
   */
  getNextQuestion() {
    if (this.questions.length === 0) {
      return null;
    }

    this.currentQuestionIndex =
      (this.currentQuestionIndex + 1) % this.questions.length;
    return this.getCurrentQuestion();
  }

  /**
   * Reset to the first question
   */
  resetQuestions() {
    this.currentQuestionIndex = 0;
    this.company = "";
    this.role = "";
  }
}

// Create singleton instance
const questionService = new QuestionService();
export default questionService;
