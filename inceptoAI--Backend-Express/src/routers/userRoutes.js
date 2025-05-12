import {
  userSignup,
  userLogin,
  getAllResults,
  getResult,
  uploadResult,
} from "../controllers/userController.js";

import express from "express";

const Router = express.Router();

Router.post("/signup", userSignup);

Router.post("/login", userLogin);

Router.post("/interview/complete", uploadResult);

Router.get("/interview/result/:resultId", getResult);

Router.get("/results/:id", getAllResults);

export default Router;
