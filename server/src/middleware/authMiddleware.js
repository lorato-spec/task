import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = asyncHandler(async (request, response, next) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401);
    throw new Error("Not authorized.");
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      response.status(401);
      throw new Error("Not authorized.");
    }

    request.user = user;
    next();
  } catch {
    response.status(401);
    throw new Error("Invalid or expired token.");
  }
});

