// store/slices/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../../services/apiService"; // Trỏ đúng đường dẫn apiService của bạn

interface NotificationData {
  eventId?: string;
  organizerId?: string;
  registrationId?: string;
  rejectionReason?: string;
  reason?: string;
  unlockReason?: string;
  unlockRequestReason?: string;
  editRequestReason?: string;
  slug?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: NotificationData;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const getValidDate = (obj: any, priorityField: string): string => {
  if (!obj) return new Date().toISOString();
  if (obj[priorityField]) return obj[priorityField];
  const fallbackFields = [
    "updatedAt",
    "updatedDate",
    "createdAt",
    "registrationDate",
    "startDate",
  ];
  for (const field of fallbackFields) {
    if (obj[field]) return obj[field];
  }
  return new Date().toISOString();
};

export const fetchOrganizerNotifications = createAsyncThunk(
  "notifications/fetchOrganizer",
  async (_, { rejectWithValue }) => {
    try {
      const notifList: Notification[] = [];
      const myEvents = await apiService.get<any[]>("/events/my-events");

      if (Array.isArray(myEvents)) {
        myEvents.forEach((event) => {
          if (event.status === "APPROVED" && !event.editRequestStatus) {
            notifList.push({
              id: `event-status-${event.eventId}-APPROVED`,
              type: "EVENT_APPROVED",
              title: "Sự kiện đã được duyệt",
              message: `"${event.eventName}" đã được phê duyệt công khai.`,
              data: event,
              createdAt: getValidDate(event, "updatedAt"),
              read: false,
            });
          } else if (event.status === "REJECTED") {
            notifList.push({
              id: `event-status-${event.eventId}-REJECTED`,
              type: "EVENT_REJECTED",
              title: "Sự kiện bị từ chối",
              message: `"${event.eventName}" đã bị từ chối.`,
              data: event,
              createdAt: getValidDate(event, "updatedAt"),
              read: false,
            });
          }

          if (event.editRequestStatus === "REJECTED") {
            notifList.push({
              id: `edit-rejected-${event.eventId}`,
              type: "EDIT_REQUEST_REJECTED",
              title: "Yêu cầu chỉnh sửa bị từ chối",
              message: `Yêu cầu chỉnh sửa cho "${event.eventName}" không được chấp nhận.`,
              data: {
                ...event,
                rejectionReason:
                  event.editRejectionReason || event.rejectionReason,
              },
              createdAt: getValidDate(event, "updatedAt"),
              read: false,
            });
          }

          if (event.editRequestStatus === "APPROVED") {
            notifList.push({
              id: `edit-approved-${event.eventId}`,
              type: "EDIT_REQUEST_APPROVED",
              title: "Yêu cầu chỉnh sửa được chấp nhận",
              message: `Bạn đã có thể chỉnh sửa sự kiện "${event.eventName}".`,
              data: event,
              createdAt: getValidDate(event, "updatedAt"),
              read: false,
            });
          }
        });

        const activeEvents = myEvents.filter((e) =>
          ["APPROVED", "ONGOING", "PUBLISHED", "DRAFT"].includes(e.status),
        );

        // Lấy danh sách đăng ký
        await Promise.all(
          activeEvents.map(async (event) => {
            try {
              const regs = await apiService.get<any[]>(
                `/events/${event.eventId}/registrations`,
              );
              if (Array.isArray(regs)) {
                regs
                  .filter((r) =>
                    ["PENDING", "PROCESSING", "WAITING", "SUCCESS"].includes(
                      r.status,
                    ),
                  )
                  .forEach((reg) => {
                    notifList.push({
                      id: `reg-${reg.registrationId || reg.id}`,
                      type: "NEW_REGISTRATION",
                      title: "Đăng ký mới",
                      message: `${reg.fullName || "Khách hàng"} đăng ký tham gia "${event.eventName}"`,
                      data: { ...reg, eventId: event.eventId },
                      createdAt: getValidDate(reg, "registrationDate"),
                      read: false,
                    });
                  });
              }
            } catch (e) {}
          }),
        );
      }

      return notifList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error: any) {
      return rejectWithValue(error.message || "Đã có lỗi xảy ra");
    }
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizerNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrganizerNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const currentMap = new Map(state.items.map((i) => [i.id, i]));
        const newItems = action.payload.map((newItem) => {
          const existing = currentMap.get(newItem.id);
          return existing ? { ...newItem, read: existing.read } : newItem;
        });
        state.items = newItems;
        state.unreadCount = state.items.filter((n) => !n.read).length;
      })
      .addCase(fetchOrganizerNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
