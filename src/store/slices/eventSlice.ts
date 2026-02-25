import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";
import type { Event, Registration } from "../../models/event";

// Helper function để xử lý image URL
const processImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // Thêm base URL nếu cần
  const baseUrl = "https://event-app-y77p.onrender.com";
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

interface EventState {
  events: Event[];
  featuredEvents: Event[];
  upcomingEvents: Event[];
  eventDetail: Event | null;
  activities: any[];
  myRegistrations: any[];
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
      console.log("fetchPublicEvents error:", error);
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
      console.log("fetchFeaturedEvents error:", error);
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
      console.log("fetchUpcomingEvents error:", error);
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
      console.log("fetchEventActivities error:", error);
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

// GET /events/my-registrations - Giống hệt cách desktop xử lý
export const fetchMyRegistrations = createAsyncThunk(
  "events/fetchMyRegistrations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<any[]>("/events/my-registrations");

      if (!Array.isArray(response)) return [];

      // Format data giống desktop
      const formattedData = await Promise.all(
        response.map(async (item: any) => {
          // Event có thể nằm trong item.event hoặc chính là item
          const evt = item.event || item;
          const eventId = evt.eventId || evt.id;
          const rawImage =
            evt.bannerImageUrl || evt.bannerUrl || evt.image || "";

          // Lấy activities đã đăng ký
          let activityNames = "";
          if (eventId) {
            try {
              const activitiesRes = await apiService.get<any[]>(
                `/activities/by-event/${eventId}/registered`,
              );
              if (Array.isArray(activitiesRes) && activitiesRes.length > 0) {
                activityNames = activitiesRes
                  .map((act) => act.activityName)
                  .join(", ");
              }
            } catch (error) {
              console.warn(`Không lấy được activities cho event ${eventId}`);
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
            activityNames: activityNames,
          };
        }),
      );

      return formattedData;
    } catch (err: any) {
      console.log("fetchMyRegistrations error:", err);
      return [];
    }
  },
);

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
