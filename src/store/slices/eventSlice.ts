import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";
import type { Event, Registration } from "../../models/event";

// Helper function để xử lý image URL
const processImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = "https://event-app-y77p.onrender.com";
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ActivityItem {
  activityId: number;
  activityName: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface MyRegistration {
  registrationId: number;
  status: string;
  ticketCode: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  eventId: number;
  eventName: string;
  eventSlug: string;
  eventBanner: string;
  eventStartDate?: string;
  eventEndDate?: string;
  location: string;
  // Lưu full array để ActivityQRScannerScreen dùng được
  activities: ActivityItem[];
  // Giữ lại string để MyTicketsScreen backward compat
  activityNames: string;
}

interface EventState {
  events: Event[];
  featuredEvents: Event[];
  upcomingEvents: Event[];
  eventDetail: Event | null;
  activities: any[];
  myRegistrations: MyRegistration[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  featuredEvents: [],
  upcomingEvents: [],
  eventDetail: null,
  activities: [],
  myRegistrations: [],
  isLoading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

// GET /events/public
export const fetchPublicEvents = createAsyncThunk(
  "events/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/events/public");
      if (Array.isArray(response)) return response;
      if (response?.content && Array.isArray(response.content))
        return response.content;
      return [];
    } catch (error: any) {
      return [];
    }
  },
);

// GET /events/featured
export const fetchFeaturedEvents = createAsyncThunk(
  "events/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/events/featured");
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      return [];
    }
  },
);

// GET /events/upcoming-selected
export const fetchUpcomingEvents = createAsyncThunk(
  "events/fetchUpcoming",
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get("/events/upcoming-selected");
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      return [];
    }
  },
);

// GET /events/{slug}
export const fetchEventDetail = createAsyncThunk(
  "events/fetchDetail",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Event>(`/events/${slug}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không tìm thấy sự kiện",
      );
    }
  },
);

// GET /activities/by-event/{eventId}
export const fetchEventActivities = createAsyncThunk(
  "events/fetchActivities",
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response: any = await apiService.get(
        `/activities/by-event/${eventId}`,
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      return [];
    }
  },
);

// POST /events/register
export const registerForEvent = createAsyncThunk(
  "events/register",
  async (
    data: { eventId: number; activityIds: number[] },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post("/events/register", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng ký thất bại",
      );
    }
  },
);

// POST /events/{eventId}/add-activities
export const addActivitiesToEvent = createAsyncThunk(
  "events/addActivities",
  async (
    payload: { eventId: number; activityIds: number[] },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post(
        `/events/${payload.eventId}/add-activities`,
        payload.activityIds,
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thêm hoạt động",
      );
    }
  },
);

// POST /api/events/newsletter/subscribe
export const subscribeNewsletter = createAsyncThunk(
  "events/subscribeNewsletter",
  async (
    { email, subscribe }: { email: string; subscribe: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.post(
        `/api/events/newsletter/subscribe?subscribe=${subscribe}`,
        { email },
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng ký thất bại",
      );
    }
  },
);

// GET /events/my-registrations
export const fetchMyRegistrations = createAsyncThunk(
  "events/fetchMyRegistrations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<any[]>("/events/my-registrations");

      if (!Array.isArray(response)) return [];

      const formattedData: MyRegistration[] = await Promise.all(
        response.map(async (item: any) => {
          const evt = item.event || item;
          const eventId = evt.eventId || evt.id;
          const rawImage =
            evt.bannerImageUrl || evt.bannerUrl || evt.image || "";

          // Lấy activities đã đăng ký — lưu full array thay vì chỉ join string
          let activities: ActivityItem[] = [];
          let activityNames = "";

          if (eventId) {
            try {
              const activitiesRes = await apiService.get<any[]>(
                `/activities/by-event/${eventId}/registered`,
              );
              if (Array.isArray(activitiesRes) && activitiesRes.length > 0) {
                // ✅ Map ra ActivityItem[] để ActivityQRScannerScreen dùng được
                activities = activitiesRes.map((act: any) => ({
                  activityId: act.activityId || act.id,
                  activityName: act.activityName || act.name || "Hoạt động",
                  startTime: act.startTime || act.startDate,
                  endTime: act.endTime || act.endDate,
                  location: act.location || act.roomName || act.room,
                }));
                // Giữ backward compat cho MyTicketsScreen
                activityNames = activities
                  .map((a) => a.activityName)
                  .join(", ");
              }
            } catch (error) {
            }
          }

          return {
            registrationId: item.registrationId || item.id,
            status: item.status,
            ticketCode: item.ticketCode,
            createdAt:
              item.registrationDate ||
              item.createdAt ||
              new Date().toISOString(),
            updatedAt:
              item.updatedAt ||
              item.registrationDate ||
              new Date().toISOString(),
            rejectionReason: item.rejectionReason,
            eventId: eventId,
            eventName: evt.eventName || "Sự kiện",
            eventSlug: evt.slug || evt.eventId?.toString() || "#",
            eventBanner: processImageUrl(rawImage),
            eventStartDate: evt.startDate,
            eventEndDate: evt.endDate,
            location: evt.location || "Online",
            activities, // ✅ full array với activityId
            activityNames, // ✅ string join cho backward compat
          };
        }),
      );

      return formattedData;
    } catch (err: any) {
      return [];
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearEventDetail: (state) => {
      state.eventDetail = null;
      state.activities = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public events
      .addCase(fetchPublicEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPublicEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload || [];
      })
      .addCase(fetchPublicEvents.rejected, (state) => {
        state.isLoading = false;
        state.events = [];
      })

      // Fetch featured events
      .addCase(fetchFeaturedEvents.fulfilled, (state, action) => {
        state.featuredEvents = action.payload || [];
      })

      // Fetch upcoming events
      .addCase(fetchUpcomingEvents.fulfilled, (state, action) => {
        state.upcomingEvents = action.payload || [];
      })

      // Fetch event detail
      .addCase(fetchEventDetail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.eventDetail = action.payload;
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch activities
      .addCase(fetchEventActivities.fulfilled, (state, action) => {
        state.activities = action.payload || [];
      })

      // Register for event
      .addCase(registerForEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerForEvent.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch my registrations
      .addCase(fetchMyRegistrations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyRegistrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myRegistrations = action.payload || [];
      })
      .addCase(fetchMyRegistrations.rejected, (state) => {
        state.isLoading = false;
        state.myRegistrations = [];
      });
  },
});

export const { clearEventDetail, clearError } = eventSlice.actions;
export default eventSlice.reducer;
