import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchPosts } from "../../store/slices/newsSlice";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  cardBorder: "rgba(255,255,255,0.05)",
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function NewsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const newsState = useAppSelector((state) => state.news);
  const posts = newsState?.posts || [];
  const isLoading = newsState?.isLoading || false;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPosts());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPosts());
    setRefreshing(false);
  }, []);

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const otherPosts = posts.slice(1);

  // Featured Post
  const renderFeaturedPost = () => {
    if (!featuredPost) return null;

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() =>
          navigation.navigate("NewsDetail", {
            slug: featuredPost.slug || featuredPost.id,
          })
        }
        activeOpacity={0.9}
      >
        <Image
          source={{
            uri:
              featuredPost.thumbnailUrl ||
              "https://placehold.co/600x300/1a1a1a/666666?text=News",
          }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay} />

        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={10} color={COLORS.background} />
          <Text style={styles.featuredBadgeText}>NỔI BẬT</Text>
        </View>

        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {featuredPost.title}
          </Text>
          {featuredPost.summary && (
            <Text style={styles.featuredSummary} numberOfLines={2}>
              {featuredPost.summary}
            </Text>
          )}
          <View style={styles.featuredFooter}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.featuredDate}>
              {formatDate(featuredPost.createdAt)}
            </Text>
            <Text style={styles.readMore}>Đọc thêm →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Compact News Card
  const renderCompactCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() =>
        navigation.navigate("NewsDetail", { slug: item.slug || item.id })
      }
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri:
            item.thumbnailUrl ||
            "https://placehold.co/100x100/1a1a1a/666666?text=News",
        }}
        style={styles.compactImage}
      />
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.summary && (
          <Text style={styles.compactSummary} numberOfLines={1}>
            {item.summary}
          </Text>
        )}
        <Text style={styles.compactDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin tức</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={otherPosts}
          renderItem={renderCompactCard}
          keyExtractor={(item) => `news-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <>
              {renderFeaturedPost()}
              {otherPosts.length > 0 && (
                <Text style={styles.sectionTitle}>
                  Tin tức <Text style={styles.highlight}>khác</Text>
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            !featuredPost ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="newspaper-outline"
                  size={60}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyTitle}>Chưa có tin tức</Text>
                <Text style={styles.emptyText}>Hãy quay lại sau nhé!</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Featured Card
  featuredCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: COLORS.backgroundCard,
  },
  featuredImage: { width: "100%", height: 200 },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featuredBadgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
    letterSpacing: 1,
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  featuredTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  featuredSummary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  featuredFooter: { flexDirection: "row", alignItems: "center" },
  featuredDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  readMore: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

  // Section Title
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  highlight: { color: COLORS.primary },

  // Compact Card
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  compactImage: { width: 80, height: 80, borderRadius: 10 },
  compactContent: { flex: 1, marginLeft: 14, marginRight: 8 },
  compactTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 4,
  },
  compactSummary: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  compactDate: { color: COLORS.textMuted, fontSize: 11 },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
});
