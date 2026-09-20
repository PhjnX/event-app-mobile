import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, type DimensionValue } from "react-native";

/**
 * Khối xám nhấp nháy thay cho vòng xoay giữa màn hình trống.
 *
 * Vòng xoay chỉ nói "đang bận"; khung xám nói luôn "sắp có gì hiện ra và nó
 * trông như thế này", nên mắt không bị hẫng khi nội dung ập vào. Dùng
 * useNativeDriver nên chạy trên luồng UI, không giật khi JS đang bận nạp dữ liệu.
 */
export const Skeleton = ({
  width,
  height,
  radius = 10,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: object;
}) => {
  const mo = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const vong = Animated.loop(
      Animated.sequence([
        Animated.timing(mo, {
          toValue: 0.75,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mo, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    vong.start();
    return () => vong.stop();
  }, [mo]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: "#1f1f1f",
          opacity: mo,
        },
        style,
      ]}
    />
  );
};

/** Khung chờ mô phỏng một thẻ sự kiện trong danh sách. */
export const EventRowSkeleton = () => (
  <View
    style={{
      flexDirection: "row",
      padding: 14,
      marginHorizontal: 20,
      marginBottom: 14,
      borderRadius: 24,
      backgroundColor: "#111",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
    }}
  >
    <Skeleton width={96} height={96} radius={18} />
    <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
      <Skeleton width="88%" height={15} radius={6} />
      <Skeleton width="55%" height={15} radius={6} style={{ marginTop: 9 }} />
      <Skeleton width="72%" height={11} radius={6} style={{ marginTop: 14 }} />
      <Skeleton width={128} height={26} radius={9} style={{ marginTop: 10 }} />
    </View>
  </View>
);

export const EventListSkeleton = ({ count = 4 }: { count?: number }) => (
  <View style={{ paddingTop: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <EventRowSkeleton key={i} />
    ))}
  </View>
);

/** Khung chờ mô phỏng thẻ vé / sự kiện lớn ở màn Khoảnh khắc. */
export const TicketCardSkeleton = () => (
  <View
    style={{
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 24,
      backgroundColor: "#111",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
    }}
  >
    <Skeleton width="100%" height={144} radius={0} />
    <View style={{ padding: 14 }}>
      <Skeleton width="45%" height={13} radius={6} />
      <Skeleton width="80%" height={12} radius={6} style={{ marginTop: 10 }} />
    </View>
  </View>
);
