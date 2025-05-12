import userSchema from "../models/user.js";
import passport from "passport";
import resultSchema from "../models/result.js";
import { handleUpload } from "../services/cloudService/handleUpload.js";
import Result from "../models/result.js";
import User from "../models/user.js";

export const userSignup = async (req, res) => {
  try {
    let { email, password, username } = req.body;

    let newUser = new userSchema({ email, username });

    // Register the user using passport-local-mongoose's register method
    const registeredUser = await userSchema.register(newUser, password);
    const id = registeredUser._id;
    return res.json({ id });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    res.status(500).json({ message: "Error creating user" });
  }
};

export const userLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || "Invalid credentials",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      const userData = user._id;
      res.status(200).json({ message: "Login was successful", id: userData });
    });
  })(req, res, next);
};

export const getAllResults = async (req, res) => {
  const users = await userSchema.findOne({ _id: req.params.id });
  let allResults = [];
  if (users.results) {
    for (let result of users.results) {
      allResults.push(await resultSchema.findById(`${result}`));
    }
  }
  res.json(allResults);
};

export const getResult = async (req, res) => {
  try {
    const id = req.params.resultId;
    const resultData = await resultSchema.findById(id);
    const url = resultData.url;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textContent = await response.json();
    res.json(textContent);
  } catch (error) {
    console.error("Error fetching file content:", error);
    res.status(500).json({ error: "Failed to fetch result content" });
  }
};

export const uploadResult = async (req, res) => {
  try {
    const interviewResult = req.body;

    // Extract essential values
    const session_id = interviewResult?.session_id;
    const role = interviewResult?.role;
    const user_id = interviewResult?.user_id;
    const overallScore = interviewResult?.evaluation?.overall_score;
    const duration = interviewResult?.evaluation?.interview_duration_seconds;
    const status =
      Object.keys(interviewResult.responses).length === 5
        ? "completed"
        : "abandoned";

    // Check if any required field is missing
    if (!session_id || !role || !user_id || !overallScore || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        received: {
          session_id: session_id || "(missing)",
          role: role || "(missing)",
          user_id: user_id || "(missing)",
        },
      });
    }

    // Generate a download URL for the interview result
    const uploadResult = await handleUpload(session_id, interviewResult);

    const downloadUrl =
      typeof uploadResult === "object" && uploadResult.url
        ? uploadResult.url
        : uploadResult;

    // Process responses to extract only what's needed for the UI
    const responsesSummary = {};
    if (interviewResult?.responses) {
      Object.keys(interviewResult.responses).forEach((key) => {
        const response = interviewResult.responses[key];
        responsesSummary[key] = {
          question_text: response.question_text,
          answer: response.answer,
          completeness: response.speech_analysis?.completeness || 0,
        };
      });
    }

    // Create a new result document with only UI-necessary fields
    const newResult = new Result({
      url: downloadUrl,
      date: new Date(),
      topic: role,
      overall_score: overallScore,
      interview_duration_seconds: duration,
      status: status,
    });

    // Save the result to the database
    const savedResult = await newResult.save();

    // Associate the result with the user account
    try {
      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        { $push: { results: savedResult._id } },
        { new: true }
      );
    } catch (userError) {
      console.error("Error updating user:", userError.message);
      // Don't fail the entire operation if user update fails
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Interview result uploaded successfully",
      result: savedResult,
    });
  } catch (error) {
    console.error("Error uploading interview result:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload interview result",
      error: error.message,
    });
  }
};
