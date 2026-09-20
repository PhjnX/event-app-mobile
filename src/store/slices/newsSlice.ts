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

/**
 * Chỉ giữ danh sách bài. Chi tiết bài do từng màn NewsDetail tự giữ trong state
 * riêng: trước đây cả app dùng chung một `postDetail` ở đây, nên mở bài liên
 * quan rồi quay lại thì bài trước đã bị xoá mất dữ liệu và xoay mãi.
 */
interface NewsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  posts: [],
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

// Không có reducer: màn gọi .unwrap() rồi tự giữ kết quả (xem ghi chú NewsState)
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
      return normalizePost(response);
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.posts = action.payload || [];
      })
      // Giữ danh sách cũ khi tải lại thất bại. Trước đây gán posts = [] ở đây,
      // nên kéo làm mới lúc mạng chập chờn là màn Tin tức trống trơn.
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default newsSlice.reducer;
