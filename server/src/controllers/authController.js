import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { normalizeEmail, validateEmail } from "../utils/validation.js";

function buildAuthResponse(user) {
  return {
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

export const registerUser = asyncHandler(async (request, response) => {
  const { name, email, password } = request.body;
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail || typeof password !== "string" || !password) {
    response.status(400);
    throw new Error("Name, email, and password are required.");
  }

  if (normalizedName.length < 2) {
    response.status(400);
    throw new Error("Name must be at least 2 characters long.");
  }

  if (!validateEmail(normalizedEmail)) {
    response.status(400);
    throw new Error("Please provide a valid email address.");
  }

  if (password.length < 6) {
    response.status(400);
    throw new Error("Password must be at least 6 characters long.");
  }

  const existingUser = await User.findOne({
    email: normalizedEmail
  });

  if (existingUser) {
    response.status(409);
    throw new Error("An account with this email already exists.");
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password
  });

  response.status(201).json(buildAuthResponse(user));
});

export const loginUser = asyncHandler(async (request, response) => {
  const { email, password } = request.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || typeof password !== "string" || !password) {
    response.status(400);
    throw new Error("Email and password are required.");
  }

  if (!validateEmail(normalizedEmail)) {
    response.status(400);
    throw new Error("Please provide a valid email address.");
  }

  const user = await User.findOne({
    email: normalizedEmail
  });

  if (!user || !(await user.matchPassword(password))) {
    response.status(401);
    throw new Error("Invalid email or password.");
  }

  response.json(buildAuthResponse(user));
});

export const getCurrentUser = asyncHandler(async (request, response) => {
  response.json({
    user: buildAuthResponse(request.user).user
  });
});
