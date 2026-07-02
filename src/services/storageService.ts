import * as SecureStore from "expo-secure-store";

export const storageService = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Kiểm tra xem module SecureStore đã sẵn sàng chưa trước khi gọi hàm
      if (SecureStore && typeof SecureStore.getItemAsync === "function") {
        return await SecureStore.getItemAsync(key);
      }
      return null;
    } catch (error) {
      console.warn("Lỗi SecureStore.getItem:", error);
      return null; // Trả về null thay vì crash app để luồng Redux chạy tiếp
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === "function") {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn("Lỗi SecureStore.setItem:", error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === "function") {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn("Lỗi SecureStore.removeItem:", error);
    }
  },
};

export default storageService;
