/**
 * Dọn thông điệp lỗi từ backend trước khi đưa ra giao diện.
 *
 * Bản này dùng chung cho web (event-app-frontend) và mobile (event-app-mobile) —
 * sửa ở một bên thì chép sang bên kia.
 *
 * Backend đang để lọt thông điệp nội bộ ra ngoài, ví dụ khi sai mật khẩu:
 *
 *   {"statusCode":500,
 *    "message":"Lỗi hệ thống: Bad credentials Kiểm tra lại thông tin các trường đã điền."}
 *
 * Còn lỗi nhập liệu thì backend in thẳng một `Map` của Java, thông điệp mặc định
 * lại bằng tiếng Anh:
 *
 *   "Lỗi xác thực: {password=size must be between 6 and 2147483647,
 *                    email=must be a well-formed email address}"
 *
 * Hàm này quy chúng về câu tiếng Việt. Đã đề nghị backend trả 401 cho sai mật
 * khẩu và trả lỗi nhập liệu dạng JSON `{ errors: { truong: thong_diep } }`; hàm
 * đã hiểu sẵn cả dạng mới, nên backend đổi lúc nào cũng không phải sửa lại.
 */

const NHAN_TRUONG: Record<string, string> = {
  email: "Email",
  password: "Mật khẩu",
  confirmPassword: "Mật khẩu xác nhận",
  newPassword: "Mật khẩu mới",
  oldPassword: "Mật khẩu cũ",
  currentPassword: "Mật khẩu hiện tại",
  username: "Tên người dùng",
  fullName: "Họ tên",
  phoneNumber: "Số điện thoại",
  address: "Địa chỉ",
  otp: "Mã xác thực",
  code: "Mã xác thực",
};

/** Dịch thông điệp mặc định (tiếng Anh) của Bean Validation cho một ô. */
const dichLoiTruong = (truong: string, thongDiep: string): string => {
  const nhan = NHAN_TRUONG[truong] || truong;
  const m = (thongDiep || "").trim();
  let khop: RegExpMatchArray | null;

  if ((khop = m.match(/^size must be between (\d+) and (\d+)$/i))) {
    const min = Number(khop[1]);
    const max = Number(khop[2]);
    return max >= 100000
      ? `${nhan} phải có ít nhất ${min} ký tự`
      : `${nhan} phải dài từ ${min} đến ${max} ký tự`;
  }
  if (/well-formed email address/i.test(m)) return "Email không đúng định dạng";
  if (/^must not be (blank|empty|null)$/i.test(m)) return `${nhan} không được để trống`;
  if ((khop = m.match(/^must match "(.+)"$/i))) return `${nhan} không đúng định dạng`;
  // Thông điệp tiếng Việt do backend tự đặt thì giữ nguyên
  return m;
};

/** Gom lỗi nhập liệu từ dạng JSON mới hoặc dạng chuỗi Map cũ. */
const docLoiNhapLieu = (data: any, raw: string): string[] => {
  const errors = data?.errors ?? data?.fieldErrors;
  if (Array.isArray(errors)) {
    return errors
      .map((e: any) =>
        typeof e === "string"
          ? e
          : dichLoiTruong(e?.field ?? "", e?.message ?? e?.defaultMessage ?? ""),
      )
      .filter(Boolean);
  }
  if (errors && typeof errors === "object") {
    return Object.entries(errors)
      .map(([truong, tb]) => dichLoiTruong(truong, String(tb)))
      .filter(Boolean);
  }

  const cu = raw.match(/^Lỗi xác thực:\s*\{(.+)\}\s*$/s);
  if (cu) {
    return cu[1]
      .split(/,\s*(?=[A-Za-z_][A-Za-z0-9_]*=)/)
      .map((phan) => {
        const [truong, ...conLai] = phan.split("=");
        return dichLoiTruong(truong.trim(), conLai.join("=").trim());
      })
      .filter(Boolean);
  }
  return [];
};

export const getApiErrorMessage = (error: any, fallback: string): string => {
  // Không có response: mất mạng, hoặc server chưa kịp tỉnh
  if (!error?.response) {
    return "Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.";
  }

  const data = error.response?.data;
  const raw: string =
    typeof data === "string" ? data : (data?.message ?? "");

  const loiNhapLieu = docLoiNhapLieu(data, raw);
  if (loiNhapLieu.length) {
    return loiNhapLieu.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(". ") + ".";
  }

  if (!raw) return fallback;

  if (/bad credentials/i.test(raw)) return "Email hoặc mật khẩu không đúng.";
  if (/user not found|không tìm thấy người dùng/i.test(raw)) {
    return "Tài khoản này không tồn tại.";
  }
  if (/disabled|locked|bị khoá/i.test(raw)) {
    return "Tài khoản đang bị khoá. Liên hệ ban quản trị để được hỗ trợ.";
  }

  // Bỏ tiền tố kỹ thuật và câu đuôi chung chung backend tự thêm
  const cleaned = raw
    .replace(/^Lỗi hệ thống:\s*/i, "")
    .replace(/^Lỗi xác thực:\s*/i, "")
    .replace(/\s*Kiểm tra lại thông tin các trường đã điền\.?\s*$/i, "")
    .trim();

  return cleaned || fallback;
};

/**
 * Sai email/mật khẩu khi đăng nhập. Nhận cả cách backend đang trả (500 kèm
 * "Bad credentials") lẫn cách đã đề nghị (401).
 */
export const isBadCredentials = (error: any): boolean => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const raw = typeof data === "string" ? data : (data?.message ?? "");
  return status === 401 || /bad credentials/i.test(raw);
};
