import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_local_notifications";

export type NotificationType =
  | "REGISTRATION_SUCCESS" // Đăng ký sự kiện thành công
  | "TICKET_APPROVED" // Vé được duyệt
  | "TICKET_REJECTED" // Vé bị từ chối
  | "CHECKIN_SUCCESS" // Check-in thành công
  | "NEWSLETTER_SUBSCRIBED" // Đăng ký newsletter
  | "MOMENT_POSTED" // Đăng moment thành công
  | "GENERAL"; // Thông báo chung

export interface LocalNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  // Data tùy chọn để navigate khi bấm vào
  screen?: string;
  params?: Record<string, any>;
}

// Icon và màu theo type
export const NOTIF_META: Record<
  NotificationType,
  { icon: string; color: string; bg: string }
> = {
  REGISTRATION_SUCCESS: {
    icon: "checkmark-circle",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
  },
  TICKET_APPROVED: {
    icon: "ticket",
    color: "#D8C97B",
    bg: "rgba(216,201,123,0.1)",
  },
  TICKET_REJECTED: {
    icon: "close-circle",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
  },
  CHECKIN_SUCCESS: {
    icon: "qr-code",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
  },
  NEWSLETTER_SUBSCRIBED: {
    icon: "mail",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
  },
  MOMENT_POSTED: {
    icon: "images",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.1)",
  },
  GENERAL: {
    icon: "notifications",
    color: "#aaa",
    bg: "rgba(255,255,255,0.07)",
  },
};

const generateId = () =>
  `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── Đọc toàn bộ ───────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<LocalNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalNotification[];
  } catch {
    return [];
  }
}

// ── Lưu toàn bộ ──────────────────────────────────────────────────────────────
async function saveNotifications(list: LocalNotification[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ── Thêm 1 notification mới ───────────────────────────────────────────────────
export async function addNotification(
  payload: Omit<LocalNotification, "id" | "read" | "createdAt">,
): Promise<LocalNotification> {
  const notif: LocalNotification = {
    ...payload,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  const existing = await getNotifications();
  // Giữ tối đa 50 notifications
  const updated = [notif, ...existing].slice(0, 50);
  await saveNotifications(updated);
  return notif;
}

// ── Đánh dấu đã đọc 1 ────────────────────────────────────────────────────────
export async function markAsRead(id: string): Promise<void> {
  const list = await getNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  await saveNotifications(updated);
}

// ── Đánh dấu đã đọc tất cả ───────────────────────────────────────────────────
export async function markAllAsRead(): Promise<void> {
  const list = await getNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  await saveNotifications(updated);
}

// ── Xóa 1 ────────────────────────────────────────────────────────────────────
export async function deleteNotification(id: string): Promise<void> {
  const list = await getNotifications();
  await saveNotifications(list.filter((n) => n.id !== id));
}

// ── Xóa tất cả ───────────────────────────────────────────────────────────────
export async function clearAllNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ── Đếm chưa đọc ─────────────────────────────────────────────────────────────
export async function getUnreadCount(): Promise<number> {
  const list = await getNotifications();
  return list.filter((n) => !n.read).length;
}

// ── Format thời gian tương đối ────────────────────────────────────────────────
export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(isoString).toLocaleDateString("vi-VN");
}

// ── Helpers để gọi nhanh từ các màn hình ─────────────────────────────────────
export const notify = {
  registrationSuccess: (eventName: string, slug?: string) =>
    addNotification({
      type: "REGISTRATION_SUCCESS",
      title: "Đăng ký thành công 🎉",
      body: `Bạn đã đăng ký tham gia "${eventName}". Vé đang chờ duyệt.`,
      screen: slug ? "EventDetail" : undefined,
      params: slug ? { slug } : undefined,
    }),

  ticketApproved: (eventName: string, slug?: string) =>
    addNotification({
      type: "TICKET_APPROVED",
      title: "Vé đã được duyệt ✅",
      body: `Vé tham gia "${eventName}" của bạn đã được chấp thuận!`,
      screen: "MyTickets",
    }),

  ticketRejected: (eventName: string, reason?: string) =>
    addNotification({
      type: "TICKET_REJECTED",
      title: "Vé bị từ chối",
      body: reason
        ? `Vé "${eventName}" bị từ chối: ${reason}`
        : `Vé tham gia "${eventName}" của bạn chưa được chấp thuận.`,
      screen: "MyTickets",
    }),

  checkinSuccess: (eventName: string, activityName: string) =>
    addNotification({
      type: "CHECKIN_SUCCESS",
      title: "Check-in thành công 📍",
      body: `Đã check-in hoạt động "${activityName}" tại sự kiện "${eventName}".`,
    }),

  newsletterSubscribed: () =>
    addNotification({
      type: "NEWSLETTER_SUBSCRIBED",
      title: "Đăng ký nhận tin thành công",
      body: "Bạn sẽ nhận thông báo sự kiện hot và ưu đãi vé sớm nhất.",
    }),

  momentPosted: (eventName: string) =>
    addNotification({
      type: "MOMENT_POSTED",
      title: "Moment đã được đăng 📸",
      body: `Khoảnh khắc của bạn tại "${eventName}" đã được chia sẻ.`,
    }),
};
