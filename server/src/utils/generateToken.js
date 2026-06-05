import jwt from "jsonwebtoken";

export default function generateToken(userId) {
  return jwt.sign(
    {
      id: userId
    },
    process.env.JWT_SECRET || "development-secret",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}
