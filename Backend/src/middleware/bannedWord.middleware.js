import BannedWord from "../models/bannedWord.model.js";
import { generateReport } from "../utils/generateEvent.js";

// Helper function to get the base content of the sepecific field
function getBaseContent(input) {
  // If the input is an array, get the base content of each item
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        return getBaseContent(item);
      })
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  // If the input is a object, get the base content of the object
  if (typeof input === "object") {
    return Object.values(input)
      .map(getBaseContent)
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  // If the input is a string, return the string
  if (typeof input === "string") {
    return input.toLowerCase();
  }

  // Otherwise, return an empty string
  return "";
}

// Ensure that the content does not contain any banned words
export function checkBannedWord(
  input,
  ignoreFlags = false,
  reportingUserId = null,
  targetId = null,
  collectionName = null,
) {
  return async (req, res, next) => {
    try {
      // Get all the banned words
      const bannedWords = await BannedWord.find().lean();
      const content = input
        // .map((field) => req.body[field])
        .map((field) => getBaseContent(req.body[field]))
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Check if the content contains any banned words
      const bannedWordFound = bannedWords.find((word) => {
        const regex = new RegExp(`\\b${word.word}\\b`, "i");
        return regex.test(content);
      });

      // If the content contains a banned word, return an error if the severity is "block", otherwise create a log
      if (bannedWordFound) {
        if (bannedWordFound.severity === "block") {
          const error = new Error(
            `Content contains banned word: ${bannedWordFound.word}`,
          );
          error.statusCode = 400;
          return next(error);
        }
        if (!ignoreFlags && bannedWordFound.severity === "flag") {
          await generateReport({
            reportingUserId,
            reportType: "report_banned_word",
            targetId: targetId ? req.params[targetId] : null,
            description: `Content contains banned word: ${bannedWordFound.word}`,
            collectionName,
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
