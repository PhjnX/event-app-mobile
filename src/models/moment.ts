// Trạng thái kiểm duyệt của một moment.
// - VISIBLE: hiển thị bình thường
// - UNDER_REVIEW: đã bị báo cáo đủ ngưỡng / admin đang xem xét -> ẩn với người khác,
//   chủ bài viết vẫn thấy kèm nhãn cảnh báo
// - REMOVED: admin đã gỡ vì vi phạm -> không ai xem được nội dung
export type MomentStatus = "VISIBLE" | "UNDER_REVIEW" | "REMOVED";

export interface Moment {
  id: number;
  userId: number;
  username: string;
  userAvatar: string;
  caption: string;
  imageUrl?: string;
  postedAt: string;
  timeAgo: string;
  // Backend nên trả về; nếu thiếu, client coi như VISIBLE
  status?: MomentStatus;
}

/** Một bài viết người dùng tự ẩn trên thiết bị này. */
export interface HiddenMoment {
  id: number;
  /** Lưu lại lúc ẩn để còn nhận ra bài nào khi muốn bỏ ẩn. */
  caption?: string;
  username?: string;
  imageUrl?: string;
  hiddenAt?: string;
}

export interface BlockedUser {
  userId: number;
  username: string;
  avatarUrl?: string;
  blockedAt?: string;
}

// Lý do báo cáo — khớp với enum phía backend
export type ReportReason =
  | "SEXUAL_CONTENT"
  | "NUDITY"
  | "VIOLENCE"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "SPAM"
  | "CSAE"
  | "OTHER";
