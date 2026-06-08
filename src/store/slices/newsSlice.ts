import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";

interface Post {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string;
  status?: string;
  createdAt?: string;
  categoryId?: number | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
  tags?: string[];
}

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

const normalizePost = (item: any): Post => ({
  ...item,
  isFeatured: item.isFeatured ?? item.featured ?? false,
  categoryName: item.categoryName ?? item.category?.name ?? null,
  categorySlug: item.categorySlug ?? item.category?.slug ?? null,
});

export const fetchPosts = createAsyncThunk(
  "news/fetchPosts",
  async ({ lang = "vi" }: { lang?: string } = {}, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/posts", {
        params: { page: 0, size: 50, lang },
      });
      const raw = Array.isArray(response)
        ? response
        : response?.content && Array.isArray(response.content)
          ? response.content
          : [];
      return raw.filter(Boolean).map(normalizePost);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải tin tức",
      );
    }
  },
);

export const fetchPostDetail = createAsyncThunk(
  "news/fetchDetail",
  async (
    { slug, lang = "vi" }: { slug: string; lang?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.get<Post>(`/posts/${slug}`, {
        params: { lang },
      });
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
