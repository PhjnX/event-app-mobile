import { parseServerDate } from "./datetime";

/**
 * Định dạng ngày dùng chung cho toàn app.
 *
 * Trước đây mỗi màn tự ghép một kiểu, nên cùng một sự kiện hiện ra ba dạng khác
 * nhau: "17 thg 12, 2026" ở màn Sự kiện, "20 Th9, 2026" ở thẻ lớn Trang chủ,
 * "TH 12" ở chip lưới trong khi EventCard lại ghi "THG 12".
 *
 * ⚠️ Phân biệt hai nhóm mốc thời gian, đừng dùng lẫn:
 * - `formatEventDate` / `formatEventDateChip`: cho giờ **sự kiện** (startDate,
 *   endDate, startTime) — organizer nhập theo giờ Việt Nam, đọc như giờ địa phương.
 * - `formatServerDate`: cho mốc **server sinh ra** (createdAt, registrationDate)
 *   — là giờ UTC không kèm offset, phải quy đổi.
 */

/** "20 thg 12, 2026" — dạng vừa, dùng ở danh sách và thẻ. */
export const formatEventDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** { day: "20", month: "THG 12" } — chip vuông ở góc thẻ. */
export const formatEventDateChip = (
  iso?: string | null,
): { day: string; month: string } => {
  if (!iso) return { day: "--", month: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "" };
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
  };
};

/** Cùng dạng với formatEventDate nhưng dành cho mốc do server sinh (giờ UTC). */
export const formatServerDate = (iso?: string | null): string => {
  const d = parseServerDate(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
