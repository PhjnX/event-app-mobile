/** Đường dẫn trỏ tới file video (mp4, webm, mov, ogg). */
export const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url.split("?")[0]);
};

/**
 * Ảnh tĩnh đại diện cho một media, để hiện trong danh sách.
 *
 * Với video trên Cloudinary, đổi đuôi .mp4 thành .jpg là Cloudinary trả về một
 * khung hình của video. Nhờ vậy danh sách hiện được ảnh tĩnh thay vì mở một
 * trình phát video tự chạy cho mỗi thẻ như trước — tốn pin, tốn dữ liệu di động.
 * Video ở nơi khác thì không có ảnh đại diện, trả null để hiện khung dự phòng.
 */
export const stillImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (!isVideoUrl(url)) return url;
  if (/res\.cloudinary\.com\/.+\/video\/upload\//.test(url)) {
    return url.replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, ".jpg");
  }
  return null;
};
