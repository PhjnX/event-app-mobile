import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants/theme";
import type { Post } from "../../models/news";

interface NewsCardProps {
  post: Post;
  onPress: () => void;
  compact?: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function NewsCard({
  post,
  onPress,
  compact = false,
}: NewsCardProps) {
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri:
              post.thumbnailUrl ||
              "https://placehold.co/100x100/1a1a1a/666666?text=News",
          }}
          style={styles.compactImage}
          resizeMode="cover"
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {post.title}
          </Text>
          <Text style={styles.compactDate}>{formatDate(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              post.thumbnailUrl ||
              "https://placehold.co/400x200/1a1a1a/666666?text=News",
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />

        {/* Label Badge */}
        <View style={styles.labelBadge}>
          <Ionicons
            name="newspaper-outline"
            size={10}
            color={COLORS.background}
          />
          <Text style={styles.labelText}>TIN TỨC</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {post.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {post.summary}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
          </View>
          <Text style={styles.readMore}>Đọc thêm →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  imageContainer: {
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  labelBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  labelText: {
    color: COLORS.background,
    fontSize: 9,
    fontFamily: FONTS.bold,
    marginLeft: 4,
    letterSpacing: 1,
  },
  content: {
    padding: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONTS.bold,
    lineHeight: 20,
    marginBottom: 8,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  readMore: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
  },
  compactImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  compactContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  compactTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
    marginBottom: 4,
  },
  compactDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
});
