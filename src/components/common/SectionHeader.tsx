import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "../../constants/theme";

/**
 * Tiêu đề mục: chữ trắng + chữ vàng, kèm badge đếm và đường kẻ mảnh bên dưới.
 *
 * Trước đây mỗi màn tự khai một bản riêng. Bản này gom từ EventsScreen ra để
 * màn Khoảnh khắc dùng chung, cho đầu các màn giống nhau.
 *
 * Lưu ý: HomeScreen còn một SectionHeader khác hẳn (thanh vàng dọc + "Xem thêm"),
 * đó là khác biệt thiết kế chứ không phải trùng lặp thuần tuý — thống nhất hai
 * kiểu này là việc của đợt gom hệ thống màu sắc/bố cục.
 */
export default function SectionHeader({
  white,
  gold,
  count,
}: {
  white: string;
  gold: string;
  count?: number;
}) {
  return (
  <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 8 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 26,
          fontWeight: "900",
          letterSpacing: -0.8,
        }}
      >
        {white} <Text style={{ color: COLORS.primary }}>{gold}</Text>
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: "rgba(216,201,123,0.1)",
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.2)",
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginBottom: 3,
          }}
        >
          <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "700" }}>
            {count}
          </Text>
        </View>
      )}
    </View>
    <View
      style={{
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginTop: 10,
      }}
    />
  </View>
  );
}
