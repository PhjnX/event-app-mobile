import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS, API_BASE_URL } from "../constants";

// Khai báo biến đệm lưu trữ Token trong bộ nhớ RAM
let accessToken: string | null = null;

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 60000,
});

// Hàm đồng bộ để gán/xóa Token trong RAM ngay lập tức
export const setClientToken = (token: string | null) => {
  accessToken = token;
};

apiService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Ưu tiên kiểm tra token trong RAM để tránh độ trễ đọc đĩa vật lý
    if (!accessToken) {
      // 2. Nếu RAM trống (như khi vừa khởi động lại app), đọc từ SecureStore để tái tạo lại cache
      accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    }

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiService.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export default {
  get: <T = any>(url: string, config?: any) =>
    apiService.get<any, T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) =>
    apiService.post<any, T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) =>
    apiService.put<any, T>(url, data, config),
  delete: <T = any>(url: string, config?: any) =>
    apiService.delete<any, T>(url, config),
};
