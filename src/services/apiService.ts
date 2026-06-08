import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS, API_BASE_URL } from "../constants";

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 60000,
});

apiService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
