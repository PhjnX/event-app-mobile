/**
 * Người dùng đã xoá tài khoản.
 *
 * Backend không xoá hẳn hàng dữ liệu mà ẩn danh hoá, để lịch sử sự kiện và hồ sơ
 * báo cáo không bị hỏng. Dấu hiệu nhận biết:
 *   username  bắt đầu bằng "deleted_"   (vd deleted_3f2a1b4c5d6e…)
 *   email     kết thúc bằng "@deleted.invalid"
 *   avatarUrl, phoneNumber, address đều null
 *
 * Nếu cứ in thẳng ra, người quản trị sẽ thấy một chuỗi băm vô nghĩa trong danh
 * sách đăng ký, trang báo cáo và danh sách người dùng. Mọi chỗ hiển thị tên hãy
 * đi qua `tenNguoiDung()`.
 *
 * Bản này dùng chung cho web và mobile — sửa một bên thì chép sang bên kia.
 */

export const TEN_DA_XOA = "Người dùng đã xoá";

export const laNguoiDaXoa = (nguoi?: {
  username?: string | null;
  email?: string | null;
} | null): boolean => {
  if (!nguoi) return false;
  const ten = nguoi.username ?? "";
  const mail = nguoi.email ?? "";
  return ten.startsWith("deleted_") || mail.endsWith("@deleted.invalid");
};

/** Tên để hiển thị; tài khoản đã xoá thì ra "Người dùng đã xoá". */
export const tenNguoiDung = (
  nguoi?: { username?: string | null; email?: string | null } | null,
  duPhong = "Người dùng",
): string => {
  if (laNguoiDaXoa(nguoi)) return TEN_DA_XOA;
  return nguoi?.username?.trim() || duPhong;
};

/** Email để hiển thị; tài khoản đã xoá thì không hiện email giả. */
export const emailNguoiDung = (
  nguoi?: { username?: string | null; email?: string | null } | null,
  duPhong = "—",
): string => {
  if (laNguoiDaXoa(nguoi)) return duPhong;
  return nguoi?.email?.trim() || duPhong;
};

/** Dạng chỉ có mỗi chuỗi tên (một số API chỉ trả authorName, reporterName…). */
export const tenTuChuoi = (ten?: string | null, duPhong = "Người dùng"): string => {
  if (!ten) return duPhong;
  return ten.startsWith("deleted_") ? TEN_DA_XOA : ten;
};
