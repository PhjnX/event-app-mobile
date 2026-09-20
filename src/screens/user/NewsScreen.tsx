import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchPosts } from "../../store/slices/newsSlice";
import AppHeader from "../../components/common/Appheader";
import SectionHeader from "../../components/common/SectionHeader";
import { useTabBar } from "../../context/TabBarContext";
import { parseServerDate } from "../../utils/datetime";
import { COLORS } from "../../constants/theme";
import { Skeleton } from "../../components/common/Skeleton";
import {
  NewsFeatureSlide,
  NewsRowCard,
  NewsRowDivider,
  NewsRowSkeleton,
} from "../../components/cards/NewsCard";
import type { Post } from "../../models/news";

/**
 * Màn Tin tức.
 *
 * Bố cục: đầu trang → khối "Nổi bật" (trượt ngang các bài được đánh dấu nổi
 * bật) → nút lọc danh mục → tiêu đề mục kèm số bài → danh sách dạng hàng, mỗi
 * lần hiện một ít kèm nút "Xem thêm".
 *
 * Bản cũ có ba cách lọc trùng nhau (nút lọc, "Khám phá theo danh mục", nút "Xem
 * tất cả" của từng mục), lưới hai cột cắt cụt tiêu đề, và đổi hẳn từ ScrollView
 * sang FlatList khi chọn danh mục nên trang dựng lại từ đầu, giật. Giờ chỉ còn
 * một FlatList, chọn danh mục chỉ đổi dữ liệu.
 */

/** "Tin tức sự kiện" → ["Tin tức", "sự kiện"] cho tiêu đề hai màu. */
const tachTieuDe = (ten: string): [string, string] => {
  const tu = ten.trim().split(/\s+/);
  if (tu.length <= 1) return [ten, ""];
  const n = tu.length >= 3 ? 2 : 1;
  return [tu.slice(0, n).join(" "), tu.slice(n).join(" ")];
};

const moc = (p: Post) => parseServerDate(p.createdAt).getTime() || 0;

const { width: W } = Dimensions.get("window");
const SLIDE_W = W - 40;
const SLIDE_GAP = 12;
/** Số bài hiện thêm mỗi lần bấm "Xem thêm" */
const MOI_LAN = 6;

const nhanMuc = {
  color: "#777",
  fontSize: 11,
  fontWeight: "800" as const,
  letterSpacing: 1.6,
  paddingHorizontal: 20,
};

const FilterPills = ({
  items,
  active,
  total,
  onChange,
}: {
  items: { name: string; count: number }[];
  active: string | null;
  total: number;
  onChange: (name: string | null) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
  >
    {[{ name: null as string | null, label: "Tất cả", count: total }, ...items.map((c) => ({ ...c, label: c.name }))].map(
      (c) => {
        const on = active === c.name;
        return (
          <TouchableOpacity
            key={c.label}
            onPress={() => onChange(c.name)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: 100,
              backgroundColor: on ? COLORS.primary : "#161616",
              borderWidth: 1,
              borderColor: on ? COLORS.primary : "#252525",
            }}
          >
            <Text
              style={{ color: on ? "#000" : "#888", fontWeight: "700", fontSize: 13 }}
            >
              {c.label}
            </Text>
            <Text
              style={{
                color: on ? "rgba(0,0,0,0.55)" : "#555",
                fontWeight: "700",
                fontSize: 12,
                marginLeft: 6,
              }}
            >
              {c.count}
            </Text>
          </TouchableOpacity>
        );
      },
    )}
  </ScrollView>
);

export default function NewsScreen() {
  const { onScroll } = useTabBar();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((s: any) => s.news);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // ── Video ở ảnh bìa: chỉ phát ở thẻ đang hiện trên màn hình ──────────────
  // Rời tab, mở một bài, hoặc cuộn thẻ ra khỏi màn hình thì video tạm dừng.
  const focused = useIsFocused();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { key: string }[] }) => {
      setVisibleKeys(new Set(viewableItems.map((v) => v.key)));
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Khối Nổi bật nằm trong phần đầu danh sách, không được FlatList theo dõi,
  // nên tự đo: cuộn quá đáy khối thì coi như đã khuất.
  const featBottom = useRef(0);
  const featVisibleRef = useRef(true);
  const [featVisible, setFeatVisible] = useState(true);
  const [slide, setSlide] = useState(0);
  const handleScroll = useCallback(
    (e: any) => {
      onScroll(e);
      const y = e.nativeEvent.contentOffset.y;
      const hienFeat = featBottom.current === 0 || y < featBottom.current - 80;
      if (hienFeat !== featVisibleRef.current) {
        featVisibleRef.current = hienFeat;
        setFeatVisible(hienFeat);
      }
    },
    [onScroll],
  );

  useEffect(() => {
    dispatch(fetchPosts({ lang: "vi" }) as any);
  }, []);

  // Mới nhất lên đầu
  const sorted = useMemo<Post[]>(
    () =>
      (Array.isArray(posts) ? posts : [])
        .filter(Boolean)
        .slice()
        .sort((a: Post, b: Post) => moc(b) - moc(a)),
    [posts],
  );

  // Bài được đánh dấu nổi bật; chưa bài nào được đánh dấu thì lấy 5 bài mới nhất
  const featured = useMemo(() => {
    const f = sorted.filter((p) => p.isFeatured);
    return (f.length > 0 ? f : sorted).slice(0, 5);
  }, [sorted]);
  const slideHienTai = Math.min(slide, Math.max(0, featured.length - 1));

  const categories = useMemo(() => {
    const dem = new Map<string, number>();
    sorted.forEach((p) => {
      if (p.categoryName) dem.set(p.categoryName, (dem.get(p.categoryName) || 0) + 1);
    });
    return Array.from(dem.entries()).map(([name, count]) => ({ name, count }));
  }, [sorted]);

  // Danh mục đang chọn không còn sau khi tải lại thì quay về Tất cả
  useEffect(() => {
    if (selectedCat && !categories.some((c) => c.name === selectedCat)) {
      setSelectedCat(null);
    }
  }, [categories, selectedCat]);

  const filtered = useMemo(
    () => (selectedCat ? sorted.filter((p) => p.categoryName === selectedCat) : sorted),
    [sorted, selectedCat],
  );
  // Hiện 6 bài, bấm "Xem thêm" thì hiện thêm 6. Đổi danh mục thì về lại 6.
  const [soLuong, setSoLuong] = useState(MOI_LAN);
  useEffect(() => setSoLuong(MOI_LAN), [selectedCat]);
  const shown = useMemo(() => filtered.slice(0, soLuong), [filtered, soLuong]);
  const conLai = filtered.length - shown.length;

  const reload = useCallback(async () => {
    const r = await dispatch(fetchPosts({ lang: "vi" }) as any);
    return !fetchPosts.rejected.match(r);
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ok = await reload();
    setRefreshing(false);
    if (!ok) {
      Toast.show({
        type: "error",
        text1: "Không tải lại được tin tức",
        text2: "Kiểm tra kết nối mạng rồi thử lại.",
      });
    }
  }, [reload]);

  const openPost = useCallback(
    (p: Post) => navigation.navigate("NewsDetail", { slug: p.slug || p.id }),
    [navigation],
  );

  const keyOf = (item: Post, i: number) => `news-${item?.id ?? item?.slug ?? i}`;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <NewsRowCard
        post={item}
        onPress={() => openPost(item)}
        // Đang lọc một danh mục thì nhãn danh mục trên từng hàng là thừa
        showCategory={!selectedCat}
        videoActive={focused && visibleKeys.has(keyOf(item, index))}
      />
    ),
    [openPost, selectedCat, focused, visibleKeys],
  );

  // Mọi hook phải nằm TRÊN dòng này. Bản cũ return sớm để hiện khung chờ ở
  // giữa các hook, nên mở tab lúc danh sách đang trống là React báo
  // "Rendered fewer hooks than expected" và app văng.
  const dangTai = isLoading && sorted.length === 0;
  const loiTai = !isLoading && sorted.length === 0 && !!error;
  const [white, gold] = selectedCat ? tachTieuDe(selectedCat) : ["Tất cả", "tin tức"];

  const header = (
    <View>
      <AppHeader />

      {/* ── Nổi bật: đặt trên cùng ── */}
      {(dangTai || featured.length > 0) && (
        <View
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            featBottom.current = y + height;
          }}
          style={{ marginTop: 4, marginBottom: 6 }}
        >
          <Text style={[nhanMuc, { marginBottom: 12 }]}>NỔI BẬT</Text>
          {dangTai ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Skeleton width="100%" height={360} radius={24} />
            </View>
          ) : (
            <>
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(p, i) => `feat-${p?.id ?? i}`}
                renderItem={({ item, index }) => (
                  <NewsFeatureSlide
                    post={item}
                    width={SLIDE_W}
                    onPress={() => openPost(item)}
                    // Chỉ trang đang xem mới chạy video
                    videoActive={focused && featVisible && index === slideHienTai}
                  />
                )}
                ItemSeparatorComponent={() => <View style={{ width: SLIDE_GAP }} />}
                showsHorizontalScrollIndicator={false}
                snapToInterval={SLIDE_W + SLIDE_GAP}
                decelerationRate="fast"
                disableIntervalMomentum
                contentContainerStyle={{ paddingHorizontal: 20 }}
                onMomentumScrollEnd={(e) =>
                  setSlide(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + SLIDE_GAP)))
                }
              />
              {featured.length > 1 && (
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 }}>
                  {featured.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        height: 6,
                        width: i === slideHienTai ? 20 : 6,
                        borderRadius: 3,
                        backgroundColor: i === slideHienTai ? COLORS.primary : "#333",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {categories.length > 1 && (
        <FilterPills
          items={categories}
          active={selectedCat}
          total={sorted.length}
          onChange={setSelectedCat}
        />
      )}
      <SectionHeader
        white={white}
        gold={gold}
        count={dangTai || loiTai ? undefined : filtered.length}
      />
    </View>
  );

  const footer =
    conLai > 0 ? (
      <TouchableOpacity
        onPress={() => setSoLuong((n) => n + MOI_LAN)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginHorizontal: 20,
          marginTop: 10,
          paddingVertical: 13,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(216,201,123,0.35)",
          backgroundColor: "rgba(216,201,123,0.06)",
        }}
      >
        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "800" }}>
          Xem thêm
        </Text>
        <Text style={{ color: "rgba(216,201,123,0.6)", fontSize: 13, fontWeight: "700" }}>
          · còn {conLai} bài
        </Text>
        <Ionicons name="chevron-down" size={15} color={COLORS.primary} />
      </TouchableOpacity>
    ) : null;

  const empty = dangTai ? (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <NewsRowSkeleton key={i} />
      ))}
    </View>
  ) : loiTai ? (
    <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 40 }}>
      <Ionicons name="cloud-offline-outline" size={40} color="#444" />
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 14 }}>
        Chưa tải được tin tức
      </Text>
      <Text style={{ color: "#777", fontSize: 13, textAlign: "center", marginTop: 6 }}>
        Kiểm tra kết nối mạng rồi thử lại.
      </Text>
      <TouchableOpacity
        onPress={reload}
        activeOpacity={0.85}
        style={{
          marginTop: 18,
          paddingHorizontal: 26,
          paddingVertical: 11,
          borderRadius: 100,
          backgroundColor: COLORS.primary,
        }}
      >
        <Text style={{ color: "#0a0a0a", fontSize: 13, fontWeight: "800" }}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  ) : filtered.length === 0 ? (
    <View style={{ alignItems: "center", paddingTop: 48 }}>
      <Ionicons name="newspaper-outline" size={40} color="#444" />
      <Text style={{ color: "#888", fontSize: 14, fontWeight: "700", marginTop: 12 }}>
        Chưa có bài viết
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <FlatList
        data={dangTai ? [] : shown}
        keyExtractor={keyOf}
        renderItem={renderItem}
        ItemSeparatorComponent={NewsRowDivider}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
