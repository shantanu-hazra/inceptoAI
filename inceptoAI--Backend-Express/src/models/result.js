import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  // Adding essential UI fields
  overall_score: {
    type: Number,
    required: true,
  },
  interview_duration_seconds: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "in-progress", "abandoned"],
    default: "completed",
    required: true,
  },
});

export default mongoose.model("result", resultSchema);
