import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService, { setClientToken } from "../../services/apiService";
import imageService, { ImageFile } from "../../services/imageService";
import storageService from "../../services/storageService";
import { STORAGE_KEYS } from "../../constants";
import type { User } from "../../models/user";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  skippedAuth: boolean;
  verificationEmail: string | null;
  resetPasswordEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isUploading: false,
  error: null,
  isAuthenticated: false,
  skippedAuth: false,
  verificationEmail: null,
  resetPasswordEmail: null,
};

// Đăng nhập
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response: any = await apiService.post("/auth/signin", credentials);
      const token = response.token || response.accessToken;
      if (token) {
        await storageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        // Lưu token vào RAM của apiService ngay lập tức
        setClientToken(token);
        // Xóa skippedAuth khi login thành công
        await storageService.removeItem("skippedAuth");
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Email hoặc mật khẩu không đúng",
      );
    }
  },
);

// Đăng ký
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post("/auth/signup", userData);
      return { ...response, email: userData.email };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
      );
    }
  },
);

// Xác thực email (OTP)
export const verifyEmail = createAsyncThunk(
  "auth/verify",
  async (
    data: { email: string; verificationCode: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post("/auth/verify", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Mã xác thực không đúng",
      );
    }
  },
);

// Quên mật khẩu
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post("/users/forgot-password", {
        email,
      });
      return { ...response, email };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Email không tồn tại trong hệ thống",
      );
    }
  },
);

// Đặt lại mật khẩu
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    data: {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post("/users/reset-password", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể đặt lại mật khẩu",
      );
    }
  },
);

// Upload Avatar
export const uploadAvatar = createAsyncThunk(
  "auth/uploadAvatar",
  async (file: ImageFile, { rejectWithValue }) => {
    try {
      const imageUrl = await imageService.uploadImage(file);
      return imageUrl;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi upload ảnh");
    }
  },
);

// Update User Profile
export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response: any = await apiService.put("/users/me", userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật thất bại",
      );
    }
  },
);

// Đổi mật khẩu
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    data: { oldPassword: string; newPassword: string; confirmPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post("/users/me/change-password", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Đổi mật khẩu thất bại",
      );
    }
  },
);

// Lấy thông tin user hiện tại
export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return rejectWithValue("Không tìm thấy token");

      // Cập nhật lại cache RAM từ token vừa tìm được
      setClientToken(token);

      const response = await apiService.get<User>("/users/me");
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await storageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        setClientToken(null); // Giải phóng token trong RAM
      }
      return rejectWithValue(error.response?.data?.message || "Lỗi xác thực");
    }
  },
);

// Đăng xuất
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await apiService.post("/auth/logout");
  } catch (error) {
    // Ignore error
  } finally {
    await storageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    setClientToken(null); // Xóa sạch token trong RAM khi logout
    await storageService.removeItem("skippedAuth");
  }
  return null;
});

// Check stored auth on app start
export const checkStoredAuth = createAsyncThunk(
  "auth/checkStored",
  async (_, { dispatch }) => {
    try {
      const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const skippedAuth = await storageService.getItem("skippedAuth");

      if (token) {
        // Đồng bộ hóa token tìm được vào RAM cache
        setClientToken(token);
        // Có token -> fetch user info
        await dispatch(fetchCurrentUser());
        return { hasToken: true, skippedAuth: false };
      }

      return { hasToken: false, skippedAuth: skippedAuth === "true" };
    } catch (error) {
      return { hasToken: false, skippedAuth: false };
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    // Skip auth (Guest mode) - Cho phép vào app mà không đăng nhập
    setSkippedAuth: (state, action) => {
      state.skippedAuth = action.payload;
      if (action.payload) {
        // Lưu vào storage
        storageService.setItem("skippedAuth", "true");
      }
    },
    // Reset để quay lại màn hình đăng nhập (Guest muốn login)
    resetToLogin: (state) => {
      state.skippedAuth = false;
      state.isAuthenticated = false;
      state.user = null;
      // Xóa khỏi storage và RAM
      storageService.removeItem("skippedAuth");
      storageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      setClientToken(null);
    },
    setVerificationEmail: (state, action) => {
      state.verificationEmail = action.payload;
    },
    setResetPasswordEmail: (state, action) => {
      state.resetPasswordEmail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.skippedAuth = false;
        state.user = action.payload.user || action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationEmail = action.payload.email;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.verificationEmail = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetPasswordEmail = action.payload.email;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetPasswordEmail = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(uploadAvatar.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadAvatar.rejected, (state) => {
        state.isUploading = false;
      })

      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.skippedAuth = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
      })

      // Check stored auth
      .addCase(checkStoredAuth.fulfilled, (state, action) => {
        if (!action.payload.hasToken) {
          state.skippedAuth = action.payload.skippedAuth;
        }
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.skippedAuth = false;
        state.verificationEmail = null;
        state.resetPasswordEmail = null;
        state.error = null;
      });
  },
});

export const {
  clearError,
  setAuthenticated,
  setSkippedAuth,
  resetToLogin,
  setVerificationEmail,
  setResetPasswordEmail,
} = authSlice.actions;
export default authSlice.reducer;
