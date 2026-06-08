import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizerEvent {
  eventId: number;
  slug: string;
  eventName: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  bannerImageUrl?: string;
  status: string;
  registrationDeadline?: string;
  organizerId?: number;
  organizerName?: string;
  editRequestStatus?: string;
  visibility?: string;
}

export interface Activity {
  activityId: number;
  activityName: string;
  description?: string;
  startTime: string;
  endTime?: string;
  roomOrVenue?: string;
  capacity?: number;
  currentRegistrations?: number;
  activityStatus?: string;
}

export interface Registration {
  id: number;
  userId: number;
  username: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  ticketCode?: string;
  status: string;
  registrationDate?: string;
  eventCheckInStatus?: string;
}

export interface CheckInResult {
  attendee: {
    id: number;
    userId: number;
    username: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    registrationDate: string;
    status: string;
    ticketCode: string;
    eventCheckInStatus: string;
  };
  event: {
    eventId: number;
    slug: string;
    eventName: string;
    location: string;
    startDate: string;
    endDate: string;
    bannerImageUrl?: string;
  };
}

export interface OrganizerProfile {
  name?: string;
  representative?: string;
  email?: string;
  phoneNumber?: string;
  description?: string;
  status?: string;
  locked?: boolean;
  unlockRequested?: boolean;
  slug?: string; // Khai báo thêm slug để dò tìm
}

export interface RegisterOrganizerPayload {
  name: string;
  representative?: string;
  email: string;
  phoneNumber: string;
  description?: string;
}

interface OrganizerState {
  events: OrganizerEvent[];
  activities: Activity[];
  registrations: Registration[];
  checkInResult: CheckInResult | null;
  checkInError: string | null;
  myStatus: OrganizerProfile | null;
  allOrganizers: any[]; // ✅ ĐÃ SỬA: Phải khai báo biến này ở đây để TypeScript hết mắng
  isLoading: boolean;
  isActivitiesLoading: boolean;
  isRegistrationsLoading: boolean;
  isCheckInLoading: boolean;
  isRegistering: boolean;
  error: string | null;
  stats: {
    totalEvents: number;
    pendingApproval: number;
    activeEvents: number;
    totalRegistrations: number;
  };
}

const initialState: OrganizerState = {
  events: [],
  activities: [],
  registrations: [],
  checkInResult: null,
  checkInError: null,
  myStatus: null,
  allOrganizers: [], // ✅ ĐÃ SỬA: Khởi tạo mảng rỗng
  isLoading: false,
  isActivitiesLoading: false,
  isRegistrationsLoading: false,
  isCheckInLoading: false,
  isRegistering: false,
  error: null,
  stats: {
    totalEvents: 0,
    pendingApproval: 0,
    activeEvents: 0,
    totalRegistrations: 0,
  },
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// MƯỢN API CỦA WEB ĐỂ LẤY FULL DATA (Chứa SĐT, Email...)
export const fetchAllOrganizers = createAsyncThunk(
  "organizer/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/organizers");
      return response?.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchOrganizerEvents = createAsyncThunk(
  "organizer/fetchMyEvents",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/events/my-events");
      const data = response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMyOrganizerStatus = createAsyncThunk(
  "organizer/fetchMyStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/organizers/me/status");
      return response?.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchEventActivities = createAsyncThunk(
  "organizer/fetchActivities",
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get(
        `/activities/by-event/${eventId}`,
      );
      const data = response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchOrganizerRegistrations = createAsyncThunk(
  "organizer/fetchRegistrations",
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get(
        `/events/${eventId}/registrations`,
      );
      const data = response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchActivityQRCode = createAsyncThunk(
  "organizer/fetchActivityQR",
  async (activityId: number, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get(
        `/activities/${activityId}/qr-code`,
      );
      return response?.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const checkInByQR = createAsyncThunk(
  "organizer/checkInByQR",
  async (
    data: {
      ticketCode: string;
      activityQrCode: string;
      latitude?: number;
      longitude?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response: any = await apiService.post("/checkin/event", {
        ticketCode: data.ticketCode,
        activityQrCode: data.activityQrCode,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
      });
      return response?.data || response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Check-in thất bại";
      return rejectWithValue(message);
    }
  },
);

export const registerOrganizer = createAsyncThunk(
  "organizer/register",
  async (payload: RegisterOrganizerPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.post("/organizers", payload);
      return response;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Đăng ký thất bại, vui lòng thử lại.";
      return rejectWithValue(message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const organizerSlice = createSlice({
  name: "organizer",
  initialState,
  reducers: {
    clearCheckInResult: (state) => {
      state.checkInResult = null;
      state.checkInError = null;
    },
    clearRegistrations: (state) => {
      state.registrations = [];
    },
    clearActivities: (state) => {
      state.activities = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchOrganizerEvents ──
      .addCase(fetchOrganizerEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizerEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        const events = action.payload as OrganizerEvent[];
        state.events = events;
        state.stats.totalEvents = events.length;
        state.stats.pendingApproval = events.filter(
          (e) => e.status === "PENDING_APPROVAL",
        ).length;
        state.stats.activeEvents = events.filter(
          (e) => e.status === "PUBLISHED" || e.status === "APPROVED",
        ).length;
      })
      .addCase(fetchOrganizerEvents.rejected, (state, action: any) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── fetchMyOrganizerStatus ──
      .addCase(fetchMyOrganizerStatus.fulfilled, (state, action) => {
        state.myStatus = {
          ...state.myStatus,
          ...(action.payload as OrganizerProfile),
        };
      })

      // ── fetchAllOrganizers (Lưu data vào Redux) ──
      .addCase(fetchAllOrganizers.fulfilled, (state, action) => {
        state.allOrganizers = action.payload || [];
      })

      // ── Các reducers khác ──
      .addCase(fetchEventActivities.pending, (state) => {
        state.isActivitiesLoading = true;
      })
      .addCase(fetchEventActivities.fulfilled, (state, action) => {
        state.isActivitiesLoading = false;
        state.activities = action.payload as Activity[];
      })
      .addCase(fetchEventActivities.rejected, (state) => {
        state.isActivitiesLoading = false;
        state.activities = [];
      })

      .addCase(fetchOrganizerRegistrations.pending, (state) => {
        state.isRegistrationsLoading = true;
      })
      .addCase(fetchOrganizerRegistrations.fulfilled, (state, action) => {
        state.isRegistrationsLoading = false;
        const regs = action.payload as Registration[];
        state.registrations = regs;
        state.stats.totalRegistrations = regs.length;
      })
      .addCase(fetchOrganizerRegistrations.rejected, (state) => {
        state.isRegistrationsLoading = false;
        state.registrations = [];
      })

      .addCase(checkInByQR.pending, (state) => {
        state.isCheckInLoading = true;
        state.checkInError = null;
        state.checkInResult = null;
      })
      .addCase(checkInByQR.fulfilled, (state, action) => {
        state.isCheckInLoading = false;
        state.checkInResult = action.payload as CheckInResult;
      })
      .addCase(checkInByQR.rejected, (state, action: any) => {
        state.isCheckInLoading = false;
        state.checkInError = action.payload;
      })

      .addCase(registerOrganizer.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(registerOrganizer.fulfilled, (state) => {
        state.isRegistering = false;
      })
      .addCase(registerOrganizer.rejected, (state, action: any) => {
        state.isRegistering = false;
        state.error = action.payload;
      });
  },
});

export const { clearCheckInResult, clearRegistrations, clearActivities } =
  organizerSlice.actions;

export default organizerSlice.reducer;
