import { useWindowDimensions, View } from "react-native";

/**
 * Giới hạn bề rộng nội dung trên màn hình lớn.
 *
 * Mọi màn hình trong app đều dựng cho khổ điện thoại. Khi chạy trên tablet hay
 * máy gập xoay ngang, nếu để nội dung giãn hết 1600dp thì ảnh bìa sự kiện bị
 * kéo bẹt, nút "Đăng nhập" dài cả gang tay, dòng chữ chạy suốt màn hình rất khó
 * đọc. Cách xử lý ở đây là bó nội dung vào một cột giữa màn hình, hai bên để
 * nền tối — giống cách các ứng dụng đọc tin làm trên máy tính bảng.
 *
 * Trên điện thoại (bề rộng nhỏ hơn ngưỡng) khung này không làm gì cả, nên trải
 * nghiệm của toàn bộ người dùng hiện tại giữ nguyên.
 */

/** Bề rộng tối đa của cột nội dung, tính theo dp. */
const BE_RONG_TOI_DA = 820;

export default function KhungNoiDung({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();

  if (width <= BE_RONG_TOI_DA) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: "#000" }}>
      <View style={{ flex: 1, width: BE_RONG_TOI_DA }}>{children}</View>
    </View>
  );
}
