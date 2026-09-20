import type { ReportReason } from "../models/moment";

// Phiên bản quy tắc cộng đồng hiện hành. Tăng số này khi nội dung thay đổi
// để bắt người dùng đồng ý lại.
export const CONTENT_POLICY_VERSION = "1.0";

// Khoá lưu cục bộ (AsyncStorage)
export const MODERATION_KEYS = {
  POLICY_ACCEPTED: "moderation:contentPolicyAcceptedVersion",
  HIDDEN_MOMENTS: "moderation:hiddenMomentIds",
  BLOCKED_USERS: "moderation:blockedUsers",
};

// Địa chỉ tiếp nhận phản hồi / khiếu nại về nội dung (Google yêu cầu có kênh liên hệ)
export const MODERATION_CONTACT_EMAIL = "webie.member2@gmail.com";

export interface ReportReasonOption {
  value: ReportReason;
  label: string;
  description: string;
}

// Danh sách lý do hiển thị trong modal báo cáo
export const REPORT_REASONS: ReportReasonOption[] = [
  {
    value: "SEXUAL_CONTENT",
    label: "Nội dung tình dục",
    description: "Hình ảnh, mô tả khiêu dâm hoặc gợi dục",
  },
  {
    value: "NUDITY",
    label: "Ảnh khoả thân",
    description: "Ảnh khoả thân hoặc hở hang phản cảm",
  },
  {
    value: "VIOLENCE",
    label: "Bạo lực / máu me",
    description: "Cảnh bạo lực, thương tích, kích động bạo lực",
  },
  {
    value: "HARASSMENT",
    label: "Quấy rối / bắt nạt",
    description: "Xúc phạm, đe doạ hoặc nhắm vào một cá nhân",
  },
  {
    value: "HATE_SPEECH",
    label: "Ngôn từ thù ghét",
    description: "Phân biệt chủng tộc, tôn giáo, giới tính...",
  },
  {
    value: "SPAM",
    label: "Spam / lừa đảo",
    description: "Quảng cáo rác, lừa đảo, nội dung trùng lặp",
  },
  {
    value: "CSAE",
    label: "Xâm hại trẻ em",
    description: "Nội dung lạm dụng hoặc bóc lột trẻ em",
  },
  {
    value: "OTHER",
    label: "Lý do khác",
    description: "Vi phạm quy tắc cộng đồng theo cách khác",
  },
];

// Nội dung quy tắc cộng đồng hiển thị trong app
export const COMMUNITY_GUIDELINES: { heading: string; body: string }[] = [
  {
    heading: "Moments là không gian chung",
    body: "Ảnh và caption bạn đăng trong Moments sẽ hiển thị cho những người tham gia cùng sự kiện. Hãy đăng nội dung mà bạn thoải mái chia sẻ công khai.",
  },
  {
    heading: "Nội dung bị cấm tuyệt đối",
    body: "Không đăng nội dung tình dục, khoả thân, bạo lực/máu me, ngôn từ thù ghét, quấy rối hay bắt nạt, nội dung xâm hại trẻ em, và bất kỳ hoạt động bất hợp pháp nào.",
  },
  {
    heading: "Tôn trọng người khác",
    body: "Chỉ đăng ảnh có người khác khi họ đồng ý. Không mạo danh, không tiết lộ thông tin cá nhân của người khác, không spam hay quảng cáo.",
  },
  {
    heading: "Báo cáo và chặn",
    body: "Nếu thấy nội dung vi phạm, hãy nhấn nút … trên bài viết để Báo cáo. Bạn cũng có thể Chặn người dùng để không còn thấy nội dung của họ. Mọi báo cáo được xem xét trong vòng 24 giờ.",
  },
  {
    heading: "Hậu quả khi vi phạm",
    body: "Nội dung vi phạm sẽ bị gỡ. Tài khoản vi phạm nhiều lần hoặc nghiêm trọng sẽ bị hạn chế đăng bài hoặc khoá vĩnh viễn.",
  },
];
