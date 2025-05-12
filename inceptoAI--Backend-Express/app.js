import express from "express";
import userSchema from "./src/models/user.js";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import dotenv from "dotenv";
import { createServer } from "http";
import userRoutes from "./src/routers/userRoutes.js";

const app = express();
dotenv.config();

// MongoDB Atlas connection string
const uri = process.env.MONGO_URL;

// Express server port
const PORT = process.env.PORT;

mongoose
  .connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .catch(() => console.error("Unable to connect to DB"));

mongoose.connection.on("connected", () => {
  console.log("Connected to Atlas");
});

// Session configuration
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 3 * 24 * 60 * 60 * 1000,
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.PYTHON_BACKEND_URL,
    credentials: true,
  })
);
app.use(session(sessionOptions));

// User authorization middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    userSchema.authenticate()
  )
);

passport.serializeUser(userSchema.serializeUser());
passport.deserializeUser(userSchema.deserializeUser());

// Authentication routes
app.use("/api/users", userRoutes);

const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});

export { app, server };
