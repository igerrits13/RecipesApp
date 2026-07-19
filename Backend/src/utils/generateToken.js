import jwt from "jsonwebtoken";

// Generate a user token using JSON web token
export const generateTokenAndSetCookie = (userID, res) => {
  const token = jwt.sign({ userID }, process.env.JWT_SECRET, {
    expiresIn: "14d",
  });

  res.cookie("jwt-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
};
