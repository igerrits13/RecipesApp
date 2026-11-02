import sharp from "sharp";

const MAX_IMAGE_DIMENSION = 1920;

export async function validateRecipeImage(req, res, next) {
  if (!req.file) return next();

  try {
    const metadata = await sharp(req.file.path).metadata();

    if (!["jpeg", "png"].includes(metadata.format)) {
      const error = new Error(
        "Invalid image format. Please upload a JPEG or PNG image",
      );
      error.statusCode = 400;
      return next(error);
    }

    if (
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION
    ) {
      const error = new Error(
        `Image dimensions cannot exceed ${MAX_IMAGE_DIMENSION} × ${MAX_IMAGE_DIMENSION} pixels. Please resize your image`,
      );
      error.statusCode = 400;
      return next(error);
    }

    next();
  } catch (error) {
    if (error.statusCode) return next(error);

    const validationError = new Error(
      "Unable to process image. The file may be corrupted or invalid",
    );
    validationError.statusCode = 400;
    next(validationError);
  }
}
