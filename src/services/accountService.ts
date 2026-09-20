import apiService, { setClientToken } from "./apiService";
import storageService from "./storageService";
import { STORAGE_KEYS } from "../constants";

/**
 * Người dùng tự xoá tài khoản — bắt buộc theo chính sách Google Play.
 *
 * Luồng hai bước, dùng chung cho tài khoản thường lẫn tài khoản Google:
 *   1. POST /users/me/deletion-otp   → backend gửi mã 6 số qua email
 *   2. POST /users/me/deletion       → xác nhận bằng mã đó
 *
 * Backend viết sẵn câu thông báo tiếng Việt cho mọi mã lỗi, nên màn hình hiện
 * thẳng `message` thay vì tự đặt câu khác.
 *
 * Bản này song song với src/services/accountService.ts bên web.
 */

export type MaXoaTaiKhoan = {
  message: string;
  /** Mã còn hiệu lực trong bao nhiêu giây (hiện là 600) */
  expiresInSeconds: number;
  /** Phải chờ bao nhiêu giây mới được bấm "Gửi lại mã" */
  resendAfterSeconds: number;
};

export type KetQuaXoaTaiKhoan = { deleted: boolean; message: string };

/** Bước 1 — xin mã. Có thể trả 409 ngay nếu còn sự kiện đang hoạt động. */
export const xinMaXoaTaiKhoan = (): Promise<MaXoaTaiKhoan> =>
  apiService.post<MaXoaTaiKhoan>("/users/me/deletion-otp", {});

/** Bước 2 — xác nhận xoá. `reason` tuỳ chọn, tối đa 500 ký tự. */
export const xacNhanXoaTaiKhoan = (
  otp: string,
  lyDo?: string,
): Promise<KetQuaXoaTaiKhoan> =>
  apiService.post<KetQuaXoaTaiKhoan>("/users/me/deletion", {
    otp: otp.trim(),
    ...(lyDo?.trim() ? { reason: lyDo.trim().slice(0, 500) } : {}),
  });

/**
 * Xoá sạch phiên sau khi tài khoản đã bị xoá: token trong bộ nhớ máy, token
 * đang giữ trong RAM, và cờ "đã bỏ qua đăng nhập". Token cũ đã mất hiệu lực
 * phía server nên giữ lại chỉ sinh lỗi khó hiểu.
 */
export const donDepPhienDaXoa = async () => {
  setClientToken(null);
  await Promise.all([
    storageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    storageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    storageService.removeItem("skippedAuth"),
  ]).catch(() => {
    /* không có gì để dọn thì thôi */
  });
};

/** Mã OTP phải đủ 6 chữ số — kiểm tại chỗ để khỏi nhận câu lỗi kỹ thuật từ server. */
export const maHopLe = (otp: string) => /^\d{6}$/.test(otp.trim());

export default {
  xinMaXoaTaiKhoan,
  xacNhanXoaTaiKhoan,
  donDepPhienDaXoa,
  maHopLe,
};
