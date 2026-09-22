/**
 * Đọc mốc thời gian do backend trả về.
 *
 * Backend dùng `LocalDateTime` nên chuỗi trả về không có hậu tố múi giờ
 * (ví dụ "2026-09-10T05:48:26"), nhưng server lại chạy giờ **UTC**. JavaScript
 * gặp chuỗi ISO thiếu múi giờ thì hiểu là giờ địa phương, nên parse thẳng sẽ
 * lệch đúng bằng chênh lệch múi giờ của máy — ở Việt Nam là 7 tiếng, khiến
 * thông báo vừa xảy ra hiện thành "7 giờ trước".
 *
 * QUAN TRỌNG: CHỈ dùng cho mốc do server sinh ra: createdAt, registrationDate,
 * blockedAt, postedAt. TUYỆT ĐỐI không dùng cho giờ sự kiện và hoạt động
 * (startDate, endDate, startTime) — những giá trị đó là giờ Việt Nam do
 * organizer nhập vào, áp hàm này sẽ làm chúng nhảy thêm 7 tiếng.
 */
export const parseServerDate = (iso?: string | null): Date => {
  if (!iso) return new Date(NaN);
  const coMuiGio = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(coMuiGio ? iso : `${iso}Z`);
};

/**
 * Giờ đăng bài Moment: "Vừa xong", "5 phút trước", "3 giờ trước", "2 ngày
 * trước", quá 7 ngày thì "10/09/2026 12:50".
 *
 * Tự tính từ `postedAt` thay vì dùng chuỗi `timeAgo` server định dạng sẵn:
 * chuỗi đó được tạo theo giờ UTC của server nên lệch 7 tiếng (bài đăng lúc
 * 12:50 giờ Việt Nam hiện thành "05:50").
 */
export const formatPostedTime = (iso?: string | null): string => {
  if (!iso) return "";
  const d = parseServerDate(iso);
  if (Number.isNaN(d.getTime())) return "";
  const phut = Math.floor((Date.now() - d.getTime()) / 60000);
  if (phut < 1) return "Vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  if (ngay < 7) return `${ngay} ngày trước`;
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(d.getDate())}/${hai(d.getMonth() + 1)}/${d.getFullYear()} ${hai(d.getHours())}:${hai(d.getMinutes())}`;
};
