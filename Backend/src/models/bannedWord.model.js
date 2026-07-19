import mongoose from "mongoose";

const bannedWordSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    word: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    severity: {
      type: String,
      enum: ["flag", "block"],
      default: "block",
    },
  },
  { timestamps: true },
);

const BannedWord =
  mongoose.models.BannedWord || mongoose.model("BannedWord", bannedWordSchema);

export default BannedWord;
