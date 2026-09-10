import imageCompression from "browser-image-compression";

// Function to compress the image
export async function compressRecipeImage(imageFile: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  return await imageCompression(imageFile, options);
}
