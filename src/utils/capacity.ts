/**
 * Quy ước sức chứa của một hoạt động.
 *
 * Backend hiểu `maxAttendees = 0` là **hết chỗ**: đăng ký vào hoạt động để 0 bị
 * chặn với câu "Hoạt động X đã hết chỗ". Trong khi giao diện cũ — cả trang
 * admin ("0 = Không giới hạn") lẫn trang người dùng và app — lại hiểu số 0 là
 * *không giới hạn*, nên người dùng chọn hoạt động xong, bấm đăng ký mới biết
 * không vào được.
 *
 * Trong lúc chờ backend đổi 0/null thành không giới hạn, hai bên thống nhất:
 * - Muốn không giới hạn thì lưu `SUC_CHUA_KHONG_GIOI_HAN`.
 * - Số 0 hiểu đúng như backend: hết chỗ, không cho đăng ký.
 *
 * Khi backend sửa, chỉ cần cho `laKhongGioiHan` nhận thêm 0/null là xong.
 *
 * Bản này dùng chung cho web và mobile — sửa một bên thì chép sang bên kia.
 */

/** Số chỗ ghi vào DB khi người tạo chọn "không giới hạn". */
export const SUC_CHUA_KHONG_GIOI_HAN = 99999;

/** Ngưỡng coi như không giới hạn, để phòng khi ai đó nhập tay 99999 hay hơn. */
const NGUONG = 9999;

export const laKhongGioiHan = (max?: number | null): boolean =>
  (max ?? 0) >= NGUONG;

/** Hoạt động đã kín chỗ chưa. maxAttendees = 0 nghĩa là không còn chỗ nào. */
export const laHetCho = (
  max?: number | null,
  daDangKy?: number | null,
): boolean => {
  if (laKhongGioiHan(max)) return false;
  return (daDangKy ?? 0) >= (max ?? 0);
};

/** "Không giới hạn" / "Còn 12 chỗ" / "Hết chỗ" */
export const moTaSucChua = (
  max?: number | null,
  daDangKy?: number | null,
): string => {
  if (laKhongGioiHan(max)) return "Không giới hạn";
  const con = Math.max(0, (max ?? 0) - (daDangKy ?? 0));
  return con > 0 ? `Còn ${con} chỗ` : "Hết chỗ";
};
