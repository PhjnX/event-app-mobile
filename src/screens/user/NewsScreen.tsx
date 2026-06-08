import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchPosts } from "../../store/slices/newsSlice";
import AppHeader from "../../components/common/Appheader";
import { useTabBar } from "../../context/TabBarContext";

const { width } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  bg: "#09090b",
  card: "#111113",
  cardBorder: "rgba(255,255,255,0.06)",
  gold: "#D8C97B",
  goldDim: "rgba(216,201,123,0.1)",
  goldBorder: "rgba(216,201,123,0.22)",
  white: "#ffffff",
  body: "#a1a1aa",
  muted: "#52525b",
  dim: "#27272a",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url.split("?")[0]);
};

const formatDate = (d?: string): string => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── MediaThumbnail ───────────────────────────────────────────────────────────
const MediaThumbnail = ({
  uri,
  style,
  resizeMode = "cover",
}: {
  uri?: string | null;
  style?: any;
  resizeMode?: "cover" | "contain";
}) => {
  const isVideo = isVideoUrl(uri);
  const fallback = "https://placehold.co/600x360/111/333?text=EMS";
  const player = useVideoPlayer(isVideo && uri ? uri : "", (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (isVideo && uri) {
    return (
      <View style={[style, { overflow: "hidden" }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={ss.playBadge}>
          <Ionicons name="play" size={10} color="#000" />
          <Text style={ss.playBadgeText}>VIDEO</Text>
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: uri || fallback }}
      style={[style, { overflow: "hidden" }]}
      resizeMode={resizeMode}
    />
  );
};

// ─── HERO CARD ────────────────────────────────────────────────────────────────
const HeroCard = ({ item, onPress }: { item: any; onPress: () => void }) => {
  const isVideo = isVideoUrl(item.thumbnailUrl);
  const fallback = "https://placehold.co/800x480/111/333?text=EMS";
  const player = useVideoPlayer(
    isVideo && item.thumbnailUrl ? item.thumbnailUrl : "",
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  return (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={onPress}
      style={ss.heroCard}
    >
      {isVideo && item.thumbnailUrl ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: item.thumbnailUrl || fallback }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={["rgba(9,9,11,0)", "rgba(9,9,11,0.3)", "rgba(9,9,11,0.97)"]}
        locations={[0.15, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={ss.heroTopRow}>
        {item.categoryName ? (
          <View style={ss.heroCatBadge}>
            <Text style={ss.heroCatText}>
              {String(item.categoryName).toUpperCase()}
            </Text>
          </View>
        ) : null}
        {isVideo && (
          <View style={ss.heroVideoBadge}>
            <Ionicons name="play-circle" size={13} color={C.gold} />
            <Text style={ss.heroVideoText}>VIDEO</Text>
          </View>
        )}
      </View>

      <View style={ss.heroContent}>
        <View style={ss.heroDotRow}>
          <View style={ss.dotGold} />
          <Text style={ss.heroDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text numberOfLines={3} style={ss.heroTitle}>
          {item.title}
        </Text>
        {item.summary ? (
          <View style={ss.heroBorderLeft}>
            <Text numberOfLines={2} style={ss.heroSummary}>
              {item.summary}
            </Text>
          </View>
        ) : null}
        <View style={ss.heroCTA}>
          <Text style={ss.heroCTAText}>ĐỌC BÀI VIẾT</Text>
          <View style={ss.heroCTABtn}>
            <Ionicons name="arrow-forward" size={12} color="#000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── HERO CAROUSEL ────────────────────────────────────────────────────────────
const HeroCarousel = ({
  posts,
  onNavigate,
}: {
  posts: any[];
  onNavigate: (item: any) => void;
}) => {
  const [page, setPage] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: posts.length > 0 ? (page + 1) / posts.length : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [page, posts.length]);

  if (!posts.length) return null;

  return (
    <View style={{ marginBottom: 28 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const p = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
          setPage(p);
        }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={width - 40 + 12}
        snapToAlignment="start"
      >
        {posts.map((item, i) => (
          <View
            key={`hero-${item.id ?? i}`}
            style={{
              width: width - 40,
              marginRight: i < posts.length - 1 ? 12 : 0,
            }}
          >
            <HeroCard item={item} onPress={() => onNavigate(item)} />
          </View>
        ))}
      </ScrollView>

      <View style={ss.heroFooter}>
        <View style={ss.progressBg}>
          <Animated.View
            style={[
              ss.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <View style={ss.heroDots}>
          {posts.map((_, i) => (
            <View
              key={i}
              style={[ss.heroDot, i === page && ss.heroDotActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── SPOTLIGHT CARD (horizontal scroll) ──────────────────────────────────────
const SpotCard = ({ item, onPress }: { item: any; onPress: () => void }) => {
  const isVideo = isVideoUrl(item.thumbnailUrl);
  const player = useVideoPlayer(
    isVideo && item.thumbnailUrl ? item.thumbnailUrl : "",
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={ss.spotCard}
      onPress={onPress}
    >
      <View style={ss.spotImgWrap}>
        {isVideo && item.thumbnailUrl ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{
              uri:
                item.thumbnailUrl ||
                "https://placehold.co/400x240/111/333?text=EMS",
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={ss.spotDateBadge}>
          <Text style={ss.spotDateText}>{formatDate(item.createdAt)}</Text>
        </View>
        {isVideo && (
          <View
            style={[
              ss.playBadge,
              { bottom: 8, right: 8, top: undefined, left: undefined },
            ]}
          >
            <Ionicons name="play" size={9} color="#000" />
            <Text style={ss.playBadgeText}>VIDEO</Text>
          </View>
        )}
      </View>
      <View style={ss.spotBody}>
        {item.categoryName ? (
          <View style={ss.catPill}>
            <Text style={ss.catPillText}>
              {String(item.categoryName).toUpperCase()}
            </Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={ss.spotTitle}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text numberOfLines={2} style={ss.spotSummary}>
            {item.summary}
          </Text>
        ) : null}
        <View style={ss.spotCTA}>
          <Text style={ss.spotCTAText}>Xem chi tiết</Text>
          <Ionicons name="arrow-forward" size={11} color={C.gold} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── GRID CARD ────────────────────────────────────────────────────────────────
const GridCard = ({
  item,
  onPress,
  cardWidth,
}: {
  item: any;
  onPress: () => void;
  cardWidth: number;
}) => {
  const isVideo = isVideoUrl(item.thumbnailUrl);
  const player = useVideoPlayer(
    isVideo && item.thumbnailUrl ? item.thumbnailUrl : "",
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[ss.gridCard, { width: cardWidth }]}
      onPress={onPress}
    >
      <View style={ss.gridImgWrap}>
        {isVideo && item.thumbnailUrl ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{
              uri:
                item.thumbnailUrl ||
                "https://placehold.co/300x200/111/333?text=EMS",
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
          }}
        />
        <View style={ss.gridDateBadge}>
          <Text style={ss.gridDateText}>{formatDate(item.createdAt)}</Text>
        </View>
        {isVideo && (
          <View
            style={[
              ss.playBadge,
              { bottom: 8, left: 8, top: undefined, right: undefined },
            ]}
          >
            <Ionicons name="play" size={9} color="#000" />
            <Text style={ss.playBadgeText}>VIDEO</Text>
          </View>
        )}
      </View>
      <View style={ss.gridBody}>
        {item.categoryName ? (
          <View style={ss.catPill}>
            <Text style={ss.catPillText}>
              {String(item.categoryName).toUpperCase()}
            </Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={ss.gridTitle}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text numberOfLines={2} style={ss.gridSummary}>
            {item.summary}
          </Text>
        ) : null}
        <View style={ss.spotCTA}>
          <Text style={ss.spotCTAText}>Xem chi tiết</Text>
          <Ionicons name="arrow-forward" size={10} color={C.gold} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── CATEGORY SECTION (vertical list row) ────────────────────────────────────
const CategorySection = ({
  categoryName,
  posts,
  onNavigate,
  onViewAll,
}: {
  categoryName: string;
  posts: any[];
  onNavigate: (item: any) => void;
  onViewAll: () => void;
}) => {
  const cardW = (width - 52) / 2;
  const preview = posts.slice(0, 4);

  return (
    <View style={ss.catSection}>
      <View style={ss.catSectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={ss.catAccentBar} />
          <View>
            <Text style={ss.catSectionTitle}>{categoryName}</Text>
            <Text style={ss.catSectionSub}>{posts.length} bài viết</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          style={ss.viewAllBtn}
          activeOpacity={0.75}
        >
          <Text style={ss.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={12} color={C.gold} />
        </TouchableOpacity>
      </View>

      <View style={ss.catGrid}>
        {preview.map((item, i) => (
          <GridCard
            key={`${item.id ?? i}`}
            item={item}
            onPress={() => onNavigate(item)}
            cardWidth={cardW}
          />
        ))}
      </View>

      {posts.length > 4 && (
        <TouchableOpacity
          onPress={onViewAll}
          style={ss.moreBtn}
          activeOpacity={0.8}
        >
          <Text style={ss.moreBtnText}>+ {posts.length - 4} bài viết khác</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const { onScroll } = useTabBar();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const newsState = useAppSelector((s: any) => s.news);
  const posts: any[] = newsState?.posts || [];
  const isLoading: boolean = newsState?.isLoading || false;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPosts({ lang: "vi" }) as any);
  }, []);

  const safePosts = useMemo(
    () => (Array.isArray(posts) ? posts : []).filter((p) => p != null),
    [posts],
  );

  const categories = useMemo<string[]>(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    safePosts.forEach((p) => {
      if (p.categoryName && !seen.has(p.categoryName)) {
        seen.add(p.categoryName);
        result.push(p.categoryName);
      }
    });
    return result;
  }, [safePosts]);

  const heroPosts = useMemo(() => {
    const featured = safePosts.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : safePosts).slice(0, 5);
  }, [safePosts]);

  const filteredPosts = useMemo(() => {
    if (!selectedCat) return safePosts;
    return safePosts.filter((p) => p.categoryName === selectedCat);
  }, [safePosts, selectedCat]);

  const postsByCategory = useMemo(() => {
    const map = new Map<string, any[]>();
    safePosts.forEach((p) => {
      const cat = p.categoryName || "Khác";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return map;
  }, [safePosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPosts({ lang: "vi" }) as any);
    setRefreshing(false);
  }, []);

  const navigateToDetail = useCallback(
    (item: any) => {
      navigation.navigate("NewsDetail", { slug: item.slug || item.id });
    },
    [navigation],
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading && !safePosts.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <AppHeader />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={C.gold} />
          <Text
            style={{
              color: C.muted,
              marginTop: 12,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            ĐANG TẢI...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const listHeaderComponent = useMemo(
    () => (
      <View>
        <AppHeader />

        {heroPosts.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <HeroCarousel posts={heroPosts} onNavigate={navigateToDetail} />
          </View>
        )}

        {/* ── CATEGORY FILTER BAR ── */}
        {categories.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCat(null)}
                activeOpacity={0.8}
                style={[ss.filterPill, !selectedCat && ss.filterPillActive]}
              >
                <Text
                  style={[
                    ss.filterPillText,
                    !selectedCat && ss.filterPillTextActive,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    setSelectedCat(selectedCat === cat ? null : cat)
                  }
                  activeOpacity={0.8}
                  style={[
                    ss.filterPill,
                    selectedCat === cat && ss.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      ss.filterPillText,
                      selectedCat === cat && ss.filterPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── FILTERED VIEW header ── */}
        {selectedCat && (
          <View style={ss.filteredHeader}>
            <View style={ss.catAccentBar} />
            <View style={{ flex: 1 }}>
              <Text style={ss.filteredTitle}>{selectedCat}</Text>
              <Text style={ss.filteredSub}>
                {filteredPosts.length} bài viết
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedCat(null)}
              style={ss.clearCatBtn}
            >
              <Ionicons name="close" size={14} color={C.muted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroPosts, categories, selectedCat, filteredPosts, navigateToDetail],
  );

  // ── Filtered grid ────────────────────────────────────────────────────────
  const cardW = (width - 52) / 2;

  const renderGridCard = useCallback(
    ({ item }: { item: any }) => (
      <GridCard
        item={item}
        onPress={() => navigateToDetail(item)}
        cardWidth={cardW}
      />
    ),
    [cardW, navigateToDetail],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {selectedCat ? (
        // Filtered: show as FlatList grid
        <FlatList
          data={filteredPosts}
          renderItem={renderGridCard}
          keyExtractor={(item, i) => `filtered-${item?.id ?? item?.slug ?? i}`}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="newspaper-outline" size={40} color={C.muted} />
              <Text
                style={{
                  color: C.body,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 12,
                }}
              >
                Chưa có bài viết
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.gold}
            />
          }
        />
      ) : (
        // All: ScrollView with category sections
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.gold}
            />
          }
        >
          <AppHeader />

          {heroPosts.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <HeroCarousel posts={heroPosts} onNavigate={navigateToDetail} />
            </View>
          )}

          {categories.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCat(null)}
                  activeOpacity={0.8}
                  style={[ss.filterPill, ss.filterPillActive]}
                >
                  <Text style={[ss.filterPillText, ss.filterPillTextActive]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCat(cat)}
                    activeOpacity={0.8}
                    style={ss.filterPill}
                  >
                    <Text style={ss.filterPillText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={ss.divider} />
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={ss.allTitle}>
              Khám phá <Text style={{ color: C.gold }}>theo danh mục</Text>
            </Text>
            <Text style={ss.allSub}>Tổng hợp toàn bộ bài viết</Text>
          </View>

          {Array.from(postsByCategory.entries()).map(([catName, catPosts]) => (
            <CategorySection
              key={catName}
              categoryName={catName}
              posts={catPosts}
              onNavigate={navigateToDetail}
              onViewAll={() => setSelectedCat(catName)}
            />
          ))}

          <View style={ss.quoteWrap}>
            <Text style={ss.quoteIcon}>"</Text>
            <Text style={ss.quoteText}>
              Báo chí là bản nháp đầu tiên của lịch sử.
            </Text>
            <View style={ss.quoteLine} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  heroCard: {
    height: 400,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  heroCatBadge: {
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
  },
  heroCatText: {
    color: "#D8C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroVideoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  heroVideoText: {
    color: "#D8C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 20,
  },
  heroDotRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dotGold: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D8C97B",
    marginRight: 6,
  },
  heroDate: { color: "#D8C97B", fontSize: 11, fontWeight: "600" },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroBorderLeft: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(216,201,123,0.5)",
    paddingLeft: 10,
    marginBottom: 12,
  },
  heroSummary: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 18,
  },
  heroCTA: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroCTAText: {
    color: "#D8C97B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroCTABtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D8C97B",
    justifyContent: "center",
    alignItems: "center",
  },
  heroFooter: { paddingHorizontal: 20, marginTop: 14, gap: 10 },
  progressBg: {
    height: 2,
    backgroundColor: "rgba(216,201,123,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#D8C97B",
    borderRadius: 2,
  },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 5 },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(216,201,123,0.2)",
  },
  heroDotActive: {
    width: 18,
    backgroundColor: "#D8C97B",
  },
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D8C97B",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  playBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterPillActive: {
    backgroundColor: "#D8C97B",
    borderColor: "#D8C97B",
    shadowColor: "#D8C97B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  filterPillTextActive: { color: "#000" },
  catSection: { marginBottom: 32 },
  catSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  catAccentBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: "#D8C97B",
    shadowColor: "#D8C97B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  catSectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  catSectionSub: { color: "#52525b", fontSize: 11, marginTop: 2 },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  viewAllText: { color: "#D8C97B", fontSize: 11, fontWeight: "700" },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
  },
  moreBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.15)",
    borderRadius: 12,
    backgroundColor: "rgba(216,201,123,0.04)",
  },
  moreBtnText: { color: "#52525b", fontSize: 12, fontWeight: "600" },
  gridCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  gridImgWrap: {
    height: 120,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  gridDateBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  gridDateText: { color: "#D8C97B", fontSize: 9, fontWeight: "700" },
  gridBody: { padding: 11 },
  gridTitle: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 5,
  },
  gridSummary: {
    color: "#52525b",
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 7,
  },
  spotCard: {
    width: 210,
    backgroundColor: "#111113",
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  spotImgWrap: {
    height: 145,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  spotDateBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  spotDateText: { color: "#D8C97B", fontSize: 10, fontWeight: "700" },
  spotBody: { padding: 13 },
  spotTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 6,
  },
  spotSummary: {
    color: "#52525b",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 9,
  },
  spotCTA: { flexDirection: "row", alignItems: "center", gap: 5 },
  spotCTAText: { color: "#D8C97B", fontSize: 11, fontWeight: "700" },
  catPill: {
    backgroundColor: "rgba(216,201,123,0.1)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 7,
  },
  catPillText: {
    color: "#D8C97B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  filteredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filteredTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  filteredSub: { color: "#52525b", fontSize: 12, marginTop: 2 },
  clearCatBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(216,201,123,0.08)",
    marginHorizontal: 20,
    marginBottom: 24,
  },
  allTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  allSub: { color: "#52525b", fontSize: 12, marginTop: 3 },
  quoteWrap: {
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 12,
    paddingBottom: 40,
  },
  quoteIcon: {
    color: "#D8C97B",
    fontSize: 48,
    fontWeight: "900",
    opacity: 0.3,
    lineHeight: 52,
  },
  quoteText: {
    color: "#3f3f46",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    fontStyle: "italic",
    marginTop: 2,
    marginBottom: 14,
  },
  quoteLine: {
    width: 36,
    height: 2,
    backgroundColor: "#D8C97B",
    borderRadius: 1,
    opacity: 0.3,
  },
});
