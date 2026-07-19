import cloudinary from "../lib/cloudinary.js";

// Upload the image to cloudinary if provided and return the image URL
export async function uploadPhoto(image) {
  var imageURL = "";
  if (image && image.trim() !== "") {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageURL = uploadResponse.secure_url;
  }

  return imageURL;
}

// Delete photo from cloudinary given its URL
export async function deletePhoto(imageURL) {
  const publicId = imageURL.split("/").pop().split(".")[0];
  await cloudinary.uploader.destroy(publicId);
}
