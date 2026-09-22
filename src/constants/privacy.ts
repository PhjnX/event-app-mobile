import { WEBIE_CONTACT } from "./contact";

/**
 * Nội dung chính sách quyền riêng tư hiển thị trong app.
 *
 * Google Play bắt buộc chính sách phải đọc được ở hai nơi: link khai trong Play
 * Console và ngay trong ứng dụng. Ở đây để văn bản nằm trong app thay vì mở
 * WebView, vì người dùng phải đọc được cả khi mạng chập chờn, và vì Google soát
 * xét bản APK chứ không soát trang web.
 *
 * Câu chữ phải trùng với trang web /privacy (event-app-frontend,
 * src/pages/HomeTemplate/PrivacyPolicyPage). Sửa một bên thì sửa cả bên kia,
 * khai một đằng làm một nẻo là lý do bị từ chối phát hành.
 */

export const NGAY_CAP_NHAT_CHINH_SACH = "17/09/2026";
export const EMAIL_QUYEN_RIENG_TU = WEBIE_CONTACT.email;
export const LINK_CHINH_SACH_WEB = "https://ems.webie.com.vn/privacy";

export type MucChinhSach = {
  tieuDe: string;
  /** Đoạn văn mở đầu của mục (có thể bỏ trống nếu mục chỉ có gạch đầu dòng) */
  moDau?: string;
  /** Gạch đầu dòng: `nhan` in đậm ở đầu dòng, `noiDung` là phần còn lại */
  gachDau?: { nhan?: string; noiDung: string }[];
  /** Đoạn văn đóng mục */
  ketThuc?: string;
};

export const TOM_TAT_CHINH_SACH =
  "Chính sách này nói rõ chúng tôi thu thập dữ liệu gì, dùng vào việc gì, ai thấy được, và bạn kiểm soát dữ liệu của mình bằng cách nào. Chúng tôi chỉ thu thập những gì cần cho việc đăng ký và tham dự sự kiện.";

export const CHINH_SACH_QUYEN_RIENG_TU: MucChinhSach[] = [
  {
    tieuDe: "1. Chúng tôi là ai",
    moDau: `Webie EMS là hệ thống quản lý sự kiện của Webie Vietnam, gồm trang web tại ems.webie.com.vn và ứng dụng di động EMS. Chính sách này áp dụng cho cả hai. Đơn vị chịu trách nhiệm về dữ liệu là Webie Vietnam, liên hệ qua ${EMAIL_QUYEN_RIENG_TU}.`,
  },
  {
    tieuDe: "2. Dữ liệu chúng tôi thu thập",
    moDau:
      "Chúng tôi chỉ thu thập dữ liệu cần cho việc đăng ký và tham dự sự kiện:",
    gachDau: [
      {
        nhan: "Thông tin tài khoản:",
        noiDung:
          " tên hiển thị, email, mật khẩu đã mã hoá. Nếu bạn đăng nhập bằng Google, chúng tôi nhận tên, email và ảnh đại diện từ tài khoản Google của bạn.",
      },
      {
        nhan: "Thông tin hồ sơ (tuỳ bạn điền):",
        noiDung: " số điện thoại, địa chỉ, giới tính, ngày sinh, ảnh đại diện.",
      },
      {
        nhan: "Dữ liệu tham dự sự kiện:",
        noiDung:
          " sự kiện bạn đăng ký, hoạt động bạn chọn, mã vé, thời điểm check-in và điểm danh.",
      },
      {
        nhan: "Nội dung bạn đăng:",
        noiDung:
          " ảnh và chú thích trong mục Khoảnh khắc, cùng các báo cáo vi phạm và danh sách người bạn đã chặn.",
      },
      {
        nhan: "Dữ liệu kỹ thuật tối thiểu:",
        noiDung: " nhật ký máy chủ phục vụ vận hành và xử lý sự cố.",
      },
    ],
    ketThuc:
      "Chúng tôi không thu thập vị trí của bạn, không dùng dữ liệu cho quảng cáo, và không bán dữ liệu cho bên thứ ba. Ứng dụng di động không có công cụ đo đạc nào; riêng trang web dùng Google Analytics để đếm lượt truy cập ở dạng thống kê chung.",
  },
  {
    tieuDe: "3. Quyền truy cập thiết bị",
    gachDau: [
      {
        nhan: "Máy ảnh:",
        noiDung:
          " chỉ dùng để quét mã QR khi check-in vào sự kiện và điểm danh hoạt động. Hình ảnh từ máy ảnh không được lưu lại hay gửi đi.",
      },
      {
        nhan: "Thư viện ảnh:",
        noiDung:
          " chỉ khi bạn chủ động chọn ảnh để đăng Khoảnh khắc hoặc đổi ảnh đại diện. Ứng dụng chỉ nhận đúng tấm ảnh bạn chọn, không đọc toàn bộ thư viện.",
      },
    ],
  },
  {
    tieuDe: "4. Dùng dữ liệu để làm gì",
    gachDau: [
      { noiDung: "Tạo và quản lý tài khoản, xác thực khi bạn đăng nhập." },
      {
        noiDung:
          "Xử lý đăng ký sự kiện, cấp vé, xác nhận check-in và điểm danh hoạt động.",
      },
      {
        noiDung:
          "Hiển thị tên và ảnh đại diện của bạn cho ban tổ chức sự kiện bạn tham dự, và cho người tham dự khác khi bạn đăng Khoảnh khắc.",
      },
      {
        noiDung:
          "Gửi email liên quan tới tài khoản: xác thực tài khoản, đặt lại mật khẩu, xác nhận xoá tài khoản, thông báo về sự kiện bạn đăng ký.",
      },
      {
        noiDung:
          "Kiểm duyệt nội dung: xử lý báo cáo vi phạm nhằm giữ môi trường an toàn theo quy tắc cộng đồng.",
      },
    ],
  },
  {
    tieuDe: "5. Ai có thể thấy dữ liệu của bạn",
    gachDau: [
      {
        nhan: "Ban tổ chức sự kiện bạn đăng ký",
        noiDung:
          " thấy tên, email, số điện thoại (nếu có) và trạng thái vé của bạn, để phục vụ việc đón tiếp tại sự kiện.",
      },
      {
        nhan: "Người tham dự cùng sự kiện",
        noiDung:
          " thấy tên, ảnh đại diện và nội dung bạn đăng trong Khoảnh khắc.",
      },
      {
        nhan: "Quản trị viên hệ thống",
        noiDung:
          " truy cập dữ liệu khi xử lý báo cáo vi phạm hoặc hỗ trợ kỹ thuật.",
      },
    ],
  },
  {
    tieuDe: "6. Dịch vụ bên thứ ba",
    moDau:
      "Hệ thống dùng một số dịch vụ bên ngoài, mỗi dịch vụ chỉ nhận phần dữ liệu cần thiết:",
    gachDau: [
      { nhan: "Google", noiDung: " — cho tuỳ chọn đăng nhập bằng tài khoản Google." },
      {
        nhan: "Cloudinary",
        noiDung:
          " — lưu trữ ảnh bạn tải lên (ảnh đại diện, ảnh Khoảnh khắc, ảnh sự kiện).",
      },
      {
        nhan: "Render",
        noiDung: " — nơi đặt máy chủ và cơ sở dữ liệu của hệ thống.",
      },
      {
        nhan: "Dịch vụ gửi email",
        noiDung: " — chuyển các email xác thực và thông báo tài khoản tới bạn.",
      },
      {
        nhan: "Google Analytics",
        noiDung:
          " — đếm lượt truy cập trang web ở dạng thống kê chung. Chỉ chạy trên trang web, không có trong ứng dụng này.",
      },
    ],
  },
  {
    tieuDe: "7. Lưu trữ bao lâu",
    moDau:
      "Dữ liệu tài khoản được giữ trong thời gian bạn còn sử dụng dịch vụ. Khi bạn xoá tài khoản, thông tin cá nhân (tên, email, số điện thoại, địa chỉ, ảnh đại diện) bị xoá và toàn bộ Khoảnh khắc của bạn bị gỡ. Lịch sử đăng ký sự kiện được giữ lại ở dạng ẩn danh — không còn gắn với danh tính của bạn — để ban tổ chức không mất số liệu của những sự kiện đã diễn ra.",
  },
  {
    tieuDe: "8. Quyền của bạn",
    gachDau: [
      { noiDung: "Xem và chỉnh sửa thông tin cá nhân ngay trong trang Hồ sơ." },
      { noiDung: "Đổi mật khẩu bất cứ lúc nào." },
      {
        noiDung:
          "Xoá Khoảnh khắc bạn đã đăng, chặn người dùng khác, ẩn bài viết.",
      },
      {
        noiDung:
          "Xoá vĩnh viễn tài khoản: vào Hồ sơ, chọn “Xoá tài khoản” ở cuối trang.",
      },
    ],
    ketThuc: `Nếu cần bản sao dữ liệu của mình hoặc có khiếu nại về quyền riêng tư, hãy gửi email tới ${EMAIL_QUYEN_RIENG_TU}. Chúng tôi phản hồi trong vòng 30 ngày.`,
  },
  {
    tieuDe: "9. An toàn dữ liệu",
    moDau:
      "Mọi kết nối giữa ứng dụng và máy chủ đều được mã hoá bằng HTTPS. Mật khẩu được lưu dưới dạng băm, không ai đọc được mật khẩu gốc. Phiên đăng nhập dùng mã thông báo có hạn. Dù vậy, không hệ thống nào an toàn tuyệt đối, nên bạn hãy dùng mật khẩu mạnh và không chia sẻ tài khoản.",
  },
  {
    tieuDe: "10. Trẻ em",
    moDau:
      "Dịch vụ dành cho người từ 13 tuổi trở lên. Chúng tôi không cố ý thu thập dữ liệu của trẻ nhỏ hơn. Nếu phát hiện một tài khoản thuộc về trẻ dưới độ tuổi này, chúng tôi sẽ xoá tài khoản đó. Phụ huynh có thể liên hệ email ở trên để yêu cầu xoá.",
  },
  {
    tieuDe: "11. Thay đổi chính sách",
    moDau:
      "Khi có thay đổi, chúng tôi cập nhật nội dung tại trang này và đổi ngày ở đầu trang. Với thay đổi lớn ảnh hưởng tới quyền của bạn, chúng tôi sẽ báo qua email hoặc thông báo trong ứng dụng.",
  },
];
