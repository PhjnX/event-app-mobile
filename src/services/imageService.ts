import apiService from "./apiService";

export interface ImageFile {
  uri: string;
  type: string;
  name: string;
}

/**
 * Upload image to server
 * API: POST /images/upload
 * @param file - Image file object { uri, type, name }
 * @returns URL của ảnh đã upload
 */
export const uploadImage = async (file: ImageFile): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("image", file as any);

    const response: any = await apiService.post("/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60s cho upload
    });

    // Handle các dạng response khác nhau
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object") {
      return response.url || response.secure_url || response.data || response;
    }
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi upload ảnh");
  }
};

/**
 * Upload multiple images
 * @param files - Array of image files
 * @returns Array of uploaded image URLs
 */
export const uploadMultipleImages = async (
  files: ImageFile[],
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadImage(file));
  return Promise.all(uploadPromises);
};

/**
 * Helper: Create image file object from URI (for expo-image-picker)
 * @param uri - Image URI from picker
 * @param fileName - Optional custom filename
 * @returns ImageFile object
 */
export const createImageFile = (uri: string, fileName?: string): ImageFile => {
  const name = fileName || `image_${Date.now()}.jpg`;
  const type = uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  return {
    uri,
    type,
    name,
  };
};

export default {
  uploadImage,
  uploadMultipleImages,
  createImageFile,
};
