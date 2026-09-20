import React, { memo, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/theme";
import type { Post } from "../../models/news";
import { formatServerDate } from "../../utils/date";
import { isVideoUrl, stillImageUrl } from "../../utils/media";
import { Skeleton } from "../common/Skeleton";

/**
 * Thẻ tin tức dùng chung cho màn Tin tức và mục "Bài viết liên quan".
 *
 * - NewsFeatureSlide: một trang trong khối "Nổi bật" trượt ngang.
 * - NewsRowCard: một hàng — ảnh nhỏ bên trái, tiêu đề ba dòng bên phải, kiểu
 *   các app báo. Tiêu đề bài ở đây dài trung bình 83 ký tự; lưới hai cột cũ chỉ
 *   chứa nổi hai dòng nửa bề ngang nên cắt còn "Lễ Quốc Khánh… Đà N…".
 */

/** "26 thg 8, 2026 · 202 lượt xem" */
export const newsMeta = (post: Post): string => {
  const parts = [formatServerDate(post.createdAt)];
  if (post.viewCount && post.viewCount > 0) {
    parts.push(`${post.viewCount.toLocaleString("vi-VN")} lượt xem`);
  }
  return parts.filter(Boolean).join(" · ");
};

/**
 * Video chạy tắt tiếng, lặp lại, đè lên khung hình tĩnh.
 *
 * - Chỉ phát khi `active` (thẻ đang hiện trên màn hình và màn đang mở), còn
 *   lại tạm dừng — không phát ngầm tốn pin, tốn dữ liệu.
 * - Chỉ hiện video sau khi nó thực sự chạy, trước đó vẫn thấy khung hình tĩnh
 *   bên dưới, nên không bị chớp ô đen lúc đang tải.
 */
const VideoLayer = ({ uri, active }: { uri: string; active: boolean }) => {
  const [dangChay, setDangChay] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener("playingChange", ({ isPlaying }) => {
      if (isPlaying) setDangChay(true);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    try {
      if (active) player.play();
      else player.pause();
    } catch {
      // trình phát đã bị huỷ khi thẻ rời danh sách
    }
  }, [active, player]);

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { opacity: dangChay ? 1 : 0 }]}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
};

/**
 * Ảnh bìa: lỗi hoặc thiếu ảnh thì hiện khung tối có biểu tượng. Trước đây ảnh
 * dự phòng lấy từ placehold.co — dịch vụ đó trả về SVG, loại Android không vẽ
 * được, nên thực tế chỉ ra một ô trống.
 *
 * Bài có ảnh bìa là video: truyền `videoActive` thì video tự chạy (và dừng khi
 * false); không truyền thì chỉ hiện khung hình tĩnh kèm nút ▶. Thẻ chỉ có ảnh
 * không tạo trình phát nào — bản cũ tạo một trình phát cho mọi thẻ.
 */
export const NewsThumb = ({
  uri,
  style,
  iconSize = 22,
  videoActive,
  hideBadge = false,
}: {
  uri?: string | null;
  style?: any;
  iconSize?: number;
  videoActive?: boolean;
  hideBadge?: boolean;
}) => {
  const [loi, setLoi] = useState(false);
  const anh = stillImageUrl(uri);
  const video = isVideoUrl(uri);
  const tuChay = video && !!uri && videoActive !== undefined;

  return (
    <View style={[{ backgroundColor: "#161616", overflow: "hidden" }, style]}>
      {anh && !loi ? (
        <Image
          source={{ uri: anh }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setLoi(true)}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Ionicons name="newspaper-outline" size={iconSize} color="#333" />
        </View>
      )}
      {tuChay && <VideoLayer uri={uri!} active={!!videoActive} />}
      {video && !tuChay && !hideBadge && (
        <View style={s.playDot}>
          <Ionicons name="play" size={iconSize * 0.5} color="#0a0a0a" />
        </View>
      )}
      {tuChay && !hideBadge && (
        <View style={s.videoTag}>
          <Ionicons name="videocam" size={10} color="#0a0a0a" />
          <Text style={s.videoTagText}>VIDEO</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Một trang trong khối "Nổi bật" ở đầu màn Tin tức: ảnh (hoặc video tự chạy)
 * phủ kín thẻ, tên bài nằm trên nền tối dần ở đáy.
 */
export const NewsFeatureSlide = memo(
  ({
    post,
    width,
    onPress,
    videoActive,
  }: {
    post: Post;
    width: number;
    onPress: () => void;
    videoActive?: boolean;
  }) => (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={{ width }}>
      <View style={s.featureBox}>
        <NewsThumb
          uri={post.thumbnailUrl}
          style={StyleSheet.absoluteFillObject}
          iconSize={44}
          videoActive={videoActive}
          hideBadge
        />
        {/* Nền tối dần khá sâu: ảnh bìa ở đây thường là banner in sẵn chữ,
            phải đè đủ đậm thì tên bài mới đọc được */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(10,10,10,0)", "rgba(10,10,10,0.72)", "rgba(10,10,10,0.97)"]}
          locations={[0.3, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.featureTop}>
          {post.categoryName ? (
            <View style={s.featureChip}>
              <Text style={s.featureChipText}>
                {String(post.categoryName).toUpperCase()}
              </Text>
            </View>
          ) : null}
          {isVideoUrl(post.thumbnailUrl) && (
            <View style={s.videoTagInline}>
              <Ionicons name="videocam" size={11} color="#0a0a0a" />
              <Text style={s.videoTagText}>VIDEO</Text>
            </View>
          )}
        </View>
        <View style={s.featureContent}>
          <Text numberOfLines={3} style={s.featureTitle}>
            {post.title}
          </Text>
          <Text style={s.featureMeta}>{newsMeta(post)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ),
);

export const NewsRowCard = memo(
  ({
    post,
    onPress,
    showCategory = true,
    videoActive,
  }: {
    post: Post;
    onPress: () => void;
    showCategory?: boolean;
    videoActive?: boolean;
  }) => (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={s.row}>
      <NewsThumb
        uri={post.thumbnailUrl}
        style={s.rowThumb}
        videoActive={videoActive}
      />
      <View style={{ flex: 1, marginLeft: 14 }}>
        {showCategory && post.categoryName ? (
          <Text numberOfLines={1} style={s.rowCat}>
            {String(post.categoryName).toUpperCase()}
          </Text>
        ) : null}
        <Text numberOfLines={3} style={s.rowTitle}>
          {post.title}
        </Text>
        <Text numberOfLines={1} style={s.rowMeta}>
          {newsMeta(post)}
        </Text>
      </View>
    </TouchableOpacity>
  ),
);

/** Đường kẻ mảnh giữa các hàng, thụt vào thẳng mép chữ. */
export const NewsRowDivider = () => <View style={s.divider} />;

export const NewsRowSkeleton = () => (
  <View style={s.row}>
    <Skeleton width={112} height={84} radius={14} />
    <View style={{ flex: 1, marginLeft: 14, gap: 8 }}>
      <Skeleton width="40%" height={10} />
      <Skeleton width="95%" height={14} />
      <Skeleton width="70%" height={14} />
      <Skeleton width="45%" height={10} />
    </View>
  </View>
);

const s = StyleSheet.create({
  playDot: {
    position: "absolute",
    left: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  videoTag: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  videoTagText: { color: "#0a0a0a", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  featureBox: {
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.18)",
  },
  featureTop: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.4)",
  },
  featureChipText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  videoTagInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  featureContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18 },
  featureTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  featureMeta: { color: "#bbb", fontSize: 12, marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowThumb: { width: 112, height: 84, borderRadius: 14 },
  rowCat: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  rowTitle: {
    color: "#f2f2f2",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  rowMeta: { color: "#777", fontSize: 12, marginTop: 6 },
  divider: {
    height: 1,
    marginLeft: 146,
    marginRight: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
