import cloudinary from "../lib/cloudinary.js";
import "dotenv/config";

const filePath = {
  test: "test",
  development: "development",
  production: "production",
};

const currentEnv = process.env.NODE_ENV || "development";
const defaultPath = filePath[currentEnv];

if (!defaultPath) {
  throw new Error(`Invalid NODE_ENV: ${currentEnv}`);
}

// Upload the image to cloudinary if provided
export async function uploadPhoto(imagePath) {
  if (!imagePath) return null;

  const uploadResponse = await cloudinary.uploader.upload(imagePath, {
    folder: defaultPath,
    resource_type: "image",
  });

  return {
    imageURL: uploadResponse.secure_url,
    publicId: uploadResponse.public_id,
  };
}

// Delete photo from cloudinary given its public ID
export async function deletePhoto(publicId) {
  if (!publicId) return null;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}
