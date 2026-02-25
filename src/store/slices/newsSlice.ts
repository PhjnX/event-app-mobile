import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";
import type { Post } from "../../models/news";

interface NewsState {
  posts: Post[];
  postDetail: Post | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  posts: [],
  postDetail: null,
  isLoading: false,
  error: null,
};

// Lấy danh sách tin tức
export const fetchPosts = createAsyncThunk(
  "news/fetchPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/posts", {
        params: { page: 0, size: 20 },
      });
      // Handle các dạng response khác nhau
      if (Array.isArray(response)) return response;
      if (response?.content && Array.isArray(response.content))
        return response.content;
      return [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải tin tức",
      );
    }
  },
);

// Lấy chi tiết tin tức
export const fetchPostDetail = createAsyncThunk(
  "news/fetchDetail",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Post>(`/posts/${slug}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không tìm thấy bài viết",
      );
    }
  },
);

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    clearPostDetail: (state) => {
      state.postDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload || [];
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.posts = [];
      })

      // Fetch post detail
      .addCase(fetchPostDetail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.postDetail = action.payload;
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPostDetail } = newsSlice.actions;
export default newsSlice.reducer;
