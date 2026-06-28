import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
});

export default mongoose.model("companyQuestion", questionSchema);
