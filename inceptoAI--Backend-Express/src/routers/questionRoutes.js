import { fetchQuestions } from "../controllers/questionController.js";

import express from "express";

const Router = express.Router();

Router.get("/fetch", fetchQuestions);

export default Router;
