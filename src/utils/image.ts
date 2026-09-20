/**
 * Ảnh dự phòng khi thiếu ảnh bìa, ảnh đại diện diễn giả…
 *
 * Trước đây các màn trỏ thẳng tới `https://placehold.co/...`. Hai vấn đề:
 * dịch vụ đó trả về **SVG**, mà `Image` của React Native trên Android không vẽ
 * được nên chỉ ra một ô trống; và ảnh dự phòng lại phải tải qua mạng, mất chỗ
 * đó khi máy không có sóng. Nay dùng logo đóng gói sẵn trong app.
 */
const ANH_DU_PHONG = require("../../assets/Logo_EMS.webp");

/** Trả về nguồn ảnh cho <Image source={...} />, thiếu đường dẫn thì lấy logo. */
export const anhNguon = (uri?: string | null) =>
  uri && String(uri).trim() ? { uri: String(uri) } : ANH_DU_PHONG;

export default anhNguon;
