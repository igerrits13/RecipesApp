// Middleware to handle file uploads
import multer from "multer";

// Reject non-supported file types and limit file size to 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];

const fileFilter = (req, file, cb) => {
  if (!ACCEPTED_FILE_TYPES.includes(file.mimetype)) {
    const error = new Error(
      "Invalid file type. Please upload a JPEG or PNG image",
    );
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default upload;
