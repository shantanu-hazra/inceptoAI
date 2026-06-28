import questionSchema from "../models/companyQuestions.js";

export const fetchQuestions = async (req, res) => {
  try {
    const { company } = req.body;

    // Validate input
    if (!company || typeof company !== "string" || !company.trim()) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const normalizedCompany = company.trim().toLowerCase();

    // Check if any questions exist for this company
    const questions = await questionSchema.find({
      company: { $regex: new RegExp(`^${normalizedCompany}$`, "i") },
    });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: `No questions found for company: ${company}` });
    }

    return res.status(200).json({
      company,
      totalQuestions: questions.length,
      questions,
    });
  } catch (err) {
    console.error("fetchQuestions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
