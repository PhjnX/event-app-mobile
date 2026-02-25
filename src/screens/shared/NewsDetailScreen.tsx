import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchPostDetail, clearPostDetail } from "../../store/slices/newsSlice";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function NewsDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const { slug } = route.params || {};

  const newsState = useAppSelector((state) => state.news);
  const postDetail = newsState?.postDetail;
  const isLoading = newsState?.isLoading || false;

  useEffect(() => {
    if (slug) {
      dispatch(fetchPostDetail(slug));
    }
    return () => {
      dispatch(clearPostDetail());
    };
  }, [slug]);

  if (isLoading && !postDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!postDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={COLORS.textMuted}
          />
          <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Parse content if it's JSON
  let contentText = postDetail.content || "";
  try {
    const parsed = JSON.parse(contentText);
    if (parsed.blocks) {
      contentText = parsed.blocks
        .map((block: any) => {
          if (block.type === "paragraph") return block.data?.text || "";
          if (block.type === "header") return block.data?.text || "";
          if (block.type === "list")
            return (block.data?.items || []).join("\n");
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
  } catch (e) {
    // Keep original content
  }

  // Remove HTML tags
  contentText = contentText.replace(/<[^>]*>/g, "");

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri:
                postDetail.thumbnailUrl ||
                "https://placehold.co/600x400/1a1a1a/666666?text=News",
            }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)", COLORS.background]}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <SafeAreaView style={styles.heroHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.heroBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons
              name="newspaper-outline"
              size={12}
              color={COLORS.background}
            />
            <Text style={styles.badgeText}>TIN TỨC</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{postDetail.title}</Text>

          {/* Meta */}
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>
                {formatDate(postDetail.createdAt)}
              </Text>
            </View>
            {postDetail.authorName && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={COLORS.textMuted}
                />
                <Text style={styles.metaText}>{postDetail.authorName}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {postDetail.summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summary}>{postDetail.summary}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <Text style={styles.body}>{contentText}</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: COLORS.textMuted, fontSize: 16, marginTop: 16 },

  header: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero
  heroBanner: { height: 280, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Content
  content: { paddingHorizontal: 20, marginTop: -40 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 6,
    letterSpacing: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 34,
    marginBottom: 16,
  },

  meta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  metaText: { color: COLORS.textMuted, fontSize: 13, marginLeft: 6 },

  summaryBox: {
    backgroundColor: COLORS.backgroundCard,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },

  body: { color: COLORS.text, fontSize: 16, lineHeight: 26 },
});
