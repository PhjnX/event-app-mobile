import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  RefreshControl,
  Dimensions,
  Linking,
  StatusBar,
} from "react-native";

import PagerView from "react-native-pager-view";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTabBar } from "../../context/TabBarContext";

import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchPublicEvents,
  fetchFeaturedEvents,
  fetchUpcomingEvents,
  fetchMyRegistrations,
} from "../../store/slices/eventSlice";
import { fetchPosts } from "../../store/slices/newsSlice";
import AppHeader from "../../components/common/Appheader";

const { width } = Dimensions.get("window");

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a0a}
.clip{position:relative;width:100%;height:100%;overflow:hidden}
iframe{
  position:absolute;top:-44px;left:0;
  width:100%;height:calc(100% + 84px);
  border:none;pointer-events:none;
}
</style>
</head>
<body>
<div class="clip">
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.609!2d106.73924!3d10.78476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175279f4c78da4f%3A0x23b2e7f0c4e48e13!2s28%20Mai%20Ch%C3%AD%20Th%E1%BB%8D%2C%20An%20Ph%C3%BA%2C%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
  loading="lazy" referrerpolicy="no-referrer-when-downgrade">
</iframe>
</div>
</body>
</html>`;

const TEAM_IMAGE = require("../../../assets/webie_team.webp");

const PARTNERS = [
  require("../../../assets/partner_1.webp"),
  require("../../../assets/partner_2.webp"),
  require("../../../assets/partner_3.webp"),
  require("../../../assets/partner_4.webp"),
  require("../../../assets/partner_5.webp"),
  require("../../../assets/partner_6.webp"),
  require("../../../assets/partner_7.webp"),
  require("../../../assets/partner_8.webp"),
  require("../../../assets/partner_9.webp"),
];

const SOLUTIONS: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  desc: string;
}[] = [
  { icon: "qrcode-scan", title: "Check-in QR\nSiêu Tốc", desc: "1 giây/người" },
  {
    icon: "cellphone-check",
    title: "Mobile App\nSự Kiện",
    desc: "Branded app",
  },
  {
    icon: "chart-timeline-variant",
    title: "Real-time\nAnalytics",
    desc: "Báo cáo tức thì",
  },
  {
    icon: "certificate-outline",
    title: "Chứng Nhận\nSố",
    desc: "Cấp ngay lập tức",
  },
  {
    icon: "form-select",
    title: "Form Đăng\nKý Smart",
    desc: "Tự động quản lý",
  },
  {
    icon: "email-fast-outline",
    title: "Vé & Thư Mời\nĐiện Tử",
    desc: "Chống giả mạo",
  },
];

const STATS = [
  { num: "50+", label: "Dự án" },
  { num: "100%", label: "Hài lòng" },
  { num: "24/7", label: "Hỗ trợ" },
  { num: "15+", label: "Chuyên gia" },
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ────────────────────────────────────────────────────
//  SECTION HEADER — gọn, Title Case, cân đối
// ────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  highlight,
  onSeeAll,
}: {
  title: string;
  highlight?: string;
  onSeeAll?: () => void;
}) => (
  <View className="flex-row justify-between items-center px-5 mb-5 mt-8">
    {/* Tiêu đề: thanh vàng + chữ trắng + highlight vàng */}
    <View className="flex-row items-center flex-1">
      <View className="w-1 h-7 rounded-full bg-[#D8C97B] mr-3" />
      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: "#fff",
          letterSpacing: -0.5,
        }}
      >
        {title}
        {highlight ? " " : ""}
        {highlight && (
          <Text style={{ color: "#D8C97B", fontSize: 26, fontWeight: "900" }}>
            {highlight}
          </Text>
        )}
      </Text>
    </View>

    {onSeeAll && (
      <TouchableOpacity
        onPress={onSeeAll}
        activeOpacity={0.7}
        className="flex-row items-center ml-2"
      >
        <Text style={{ fontSize: 14, color: "#888", fontWeight: "700" }}>
          Xem thêm
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#666" />
      </TouchableOpacity>
    )}
  </View>
);

// ────────────────────────────────────────────────────
//  ICON BOX
// ────────────────────────────────────────────────────
const IconBox = ({
  name,
  size = 24,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  size?: number;
}) => (
  <View className="w-14 h-14 rounded-2xl bg-[#D8C97B]/10 border border-[#D8C97B]/20 items-center justify-center">
    <MaterialCommunityIcons name={name} size={size} color="#D8C97B" />
  </View>
);

// ────────────────────────────────────────────────────
//  MARQUEE PARTNERS
// ────────────────────────────────────────────────────
const CARD_W = 120;
const TOTAL_W = PARTNERS.length * CARD_W;
const LOOP_DATA = [...PARTNERS, ...PARTNERS];

function MarqueePartners() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -TOTAL_W,
        duration: TOTAL_W * 18,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View className="overflow-hidden">
      <Animated.View
        style={{ flexDirection: "row", transform: [{ translateX }] }}
      >
        {LOOP_DATA.map((src, i) => (
          <View
            key={i}
            className="w-[108px] h-[68px] mr-3 bg-[#151515] rounded-2xl border border-white/5 items-center justify-center"
          >
            <Image
              source={src}
              style={{ width: 80, height: 36 }}
              resizeMode="contain"
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ────────────────────────────────────────────────────
//  MAIN SCREEN
// ────────────────────────────────────────────────────
export default function HomeScreen() {
  const { onScroll } = useTabBar();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const eventsState = useAppSelector((s) => s.events);
  const newsState = useAppSelector((s) => s.news);

  const featuredEvents = eventsState?.featuredEvents || [];
  const upcomingEvents =
    eventsState?.upcomingEvents?.length > 0
      ? eventsState.upcomingEvents
      : eventsState?.events || [];
  const posts = newsState?.posts || [];

  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchPublicEvents()),
      dispatch(fetchFeaturedEvents()),
      dispatch(fetchUpcomingEvents()),
      dispatch(fetchPosts({})),
      ...(isAuthenticated ? [dispatch(fetchMyRegistrations())] : []),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openMap = () =>
    Linking.openURL("https://maps.app.goo.gl/GzCzpU2hapePur246");
  const openPhone = () => Linking.openURL("tel:+84969838467");
  const openMail = () => Linking.openURL("mailto:Huyen.dang@webie.com.vn");

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D8C97B"
          />
        }
      >
        <AppHeader />

        {/* ══════════════════════════════════════════════
            1. HERO CAROUSEL — SỰ KIỆN NỔI BẬT
        ══════════════════════════════════════════════ */}
        <View className="mt-4 mb-2">
          <PagerView
            style={{ height: 260 }}
            initialPage={0}
            onPageSelected={(e) => setPage(e.nativeEvent.position)}
          >
            {featuredEvents.slice(0, 4).map((rawItem, index) => {
              const item = rawItem as any;
              return (
                <TouchableOpacity
                  key={index}
                  className="mx-5 rounded-[24px] overflow-hidden bg-[#151515]"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(216,201,123,0.15)",
                  }}
                  onPress={() =>
                    navigation.navigate("EventDetail", {
                      slug: item.slug || item.eventId,
                    })
                  }
                  activeOpacity={0.92}
                >
                  {/* Ảnh nền */}
                  <Image
                    source={{
                      uri:
                        item.bannerImageUrl || "https://placehold.co/600x300",
                    }}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                  />

                  {/* Gradient overlay — đen mạnh hơn ở đáy */}
                  <LinearGradient
                    colors={[
                      "rgba(0,0,0,0.08)",
                      "rgba(0,0,0,0.55)",
                      "rgba(0,0,0,0.97)",
                    ]}
                    locations={[0, 0.45, 1]}
                    className="absolute inset-0"
                  />

                  {/* Badge "SỰ KIỆN NỔI BẬT" ở góc trên-trái */}
                  <View
                    className="absolute top-4 left-5 flex-row items-center rounded-full px-3 py-1.5"
                    style={{ backgroundColor: "rgba(216,201,123,0.92)" }}
                  >
                    <MaterialCommunityIcons
                      name="star-four-points"
                      size={11}
                      color="#000"
                    />
                    <Text className="text-black text-[11px] font-black ml-1.5 tracking-widest uppercase">
                      Nổi bật
                    </Text>
                  </View>

                  {/* Nội dung — căn dưới, có padding trái phải rõ ràng */}
                  <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3">
                    {/* Tên sự kiện — chữ lớn, rõ */}
                    <Text
                      className="text-white font-black leading-tight mb-3"
                      numberOfLines={2}
                      style={{ fontSize: 22, lineHeight: 30 }}
                    >
                      {item.name || item.title || "Tên sự kiện đang cập nhật"}
                    </Text>

                    {/* Meta row */}
                    <View className="flex-row flex-wrap gap-y-1">
                      {item.location || item.venue ? (
                        <View className="flex-row items-center mr-5">
                          <View className="w-6 h-6 rounded-full bg-[#D8C97B]/15 items-center justify-center mr-2">
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={13}
                              color="#D8C97B"
                            />
                          </View>
                          <Text
                            className="text-[#ccc] text-[14px] font-semibold"
                            numberOfLines={1}
                          >
                            {item.location || item.venue}
                          </Text>
                        </View>
                      ) : null}
                      {item.startDate || item.startTime ? (
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 rounded-full bg-[#D8C97B]/15 items-center justify-center mr-2">
                            <MaterialCommunityIcons
                              name="calendar"
                              size={13}
                              color="#D8C97B"
                            />
                          </View>
                          <Text className="text-[#ccc] text-[14px] font-semibold">
                            {formatDate(item.startDate || item.startTime)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </PagerView>

          {/* Dots indicator */}
          <View className="flex-row justify-center mt-4 gap-x-2">
            {featuredEvents.slice(0, 4).map((_, i) => (
              <View
                key={i}
                style={{
                  width: page === i ? 24 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: page === i ? "#D8C97B" : "#2a2a2a",
                }}
              />
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════════════
            2. SỰ KIỆN SẮP DIỄN RA — GRID 2 CỘT
        ══════════════════════════════════════════════ */}
        <SectionHeader
          title="Sự kiện"
          highlight="sắp diễn ra"
          onSeeAll={() => navigation.navigate("Events")}
        />
        <View className="px-5" style={{ gap: 14 }}>
          {upcomingEvents.slice(0, 4).map((rawItem: any, index: number) => {
            const item = rawItem as any;
            const isFirst = index === 0;

            // Card đầu tiên: full width nổi bật hơn
            if (isFirst) {
              return (
                <TouchableOpacity
                  key={item.id || index}
                  className="w-full bg-[#131313] rounded-[22px] overflow-hidden border border-[#242424]"
                  onPress={() =>
                    navigation.navigate("EventDetail", {
                      slug: item.slug || item.id,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Image
                    source={{
                      uri:
                        item.bannerImageUrl ||
                        item.thumbnailUrl ||
                        "https://placehold.co/600x300",
                    }}
                    style={{ width: "100%", height: 180 }}
                  />
                  {/* Gradient overlay */}
                  <LinearGradient
                    colors={["transparent", "rgba(10,10,10,0.92)"]}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 130,
                      justifyContent: "flex-end",
                      padding: 16,
                    }}
                  >
                    {/* Date pill */}
                    <View
                      className="flex-row items-center self-start mb-2 rounded-full px-3 py-1"
                      style={{ backgroundColor: "#D8C97B" }}
                    >
                      <MaterialCommunityIcons
                        name="calendar"
                        size={12}
                        color="#000"
                      />
                      <Text className="text-black text-[12px] font-black ml-1.5">
                        {item.startDate
                          ? `${new Date(item.startDate).getDate()} Th${new Date(item.startDate).getMonth() + 1}, ${new Date(item.startDate).getFullYear()}`
                          : "Đang cập nhật"}
                      </Text>
                    </View>
                    <Text
                      className="text-white font-black mb-1.5"
                      numberOfLines={2}
                      style={{ fontSize: 19, lineHeight: 26 }}
                    >
                      {item.name || item.title}
                    </Text>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={14}
                        color="#999"
                      />
                      <Text
                        className="text-[#999] ml-1 font-medium"
                        numberOfLines={1}
                        style={{ fontSize: 13 }}
                      >
                        {item.location || item.venue || "Đang cập nhật"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            return null; // Handled by pairs below
          })}

          {/* 3 card còn lại chia 2 cột — cặp đôi */}
          {(() => {
            const rest = upcomingEvents.slice(1, 5) as any[];
            const rows: any[][] = [];
            for (let i = 0; i < rest.length; i += 2) {
              rows.push(rest.slice(i, i + 2));
            }
            return rows.map((row, rowIdx) => (
              <View key={rowIdx} className="flex-row" style={{ gap: 14 }}>
                {row.map((rawItem: any, colIdx: number) => {
                  const item = rawItem as any;
                  const cardW = (width - 40 - 14) / 2;
                  return (
                    <TouchableOpacity
                      key={item.id || colIdx}
                      style={{ width: cardW }}
                      className="bg-[#131313] rounded-[20px] overflow-hidden border border-[#242424]"
                      onPress={() =>
                        navigation.navigate("EventDetail", {
                          slug: item.slug || item.id,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{
                          uri:
                            item.bannerImageUrl ||
                            item.thumbnailUrl ||
                            "https://placehold.co/300",
                        }}
                        style={{ width: "100%", height: 110 }}
                      />
                      {/* Date badge góc trên phải */}
                      <View
                        className="absolute top-2.5 right-2.5 rounded-xl py-1.5 px-2.5 items-center"
                        style={{ backgroundColor: "#D8C97B" }}
                      >
                        <Text
                          className="text-black font-black leading-none"
                          style={{ fontSize: 17 }}
                        >
                          {item.startDate
                            ? new Date(item.startDate).getDate()
                            : "01"}
                        </Text>
                        <Text
                          className="text-black font-bold mt-0.5 uppercase"
                          style={{ fontSize: 10 }}
                        >
                          Th{" "}
                          {item.startDate
                            ? new Date(item.startDate).getMonth() + 1
                            : "1"}
                        </Text>
                      </View>

                      <View className="p-3">
                        <Text
                          className="text-white font-bold leading-snug mb-2"
                          numberOfLines={2}
                          style={{ fontSize: 14 }}
                        >
                          {item.name || item.title}
                        </Text>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={13}
                            color="#555"
                          />
                          <Text
                            className="text-[#666] ml-1 flex-1 font-medium"
                            numberOfLines={1}
                            style={{ fontSize: 12 }}
                          >
                            {item.location || item.venue || "Đang cập nhật"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}
        </View>

        {/* ══════════════════════════════════════════════
            3. TIN TỨC NỔI BẬT — GRID 2 CỘT
        ══════════════════════════════════════════════ */}
        <SectionHeader
          title="Tin Tức"
          highlight="Nổi Bật"
          onSeeAll={() => navigation.navigate("News")}
        />
        <View className="flex-row flex-wrap px-5" style={{ gap: 14 }}>
          {posts.slice(0, 4).map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={{ width: (width - 40 - 14) / 2 }}
              className="bg-[#131313] rounded-[20px] overflow-hidden border border-[#242424]"
              onPress={() =>
                navigation.navigate("NewsDetail", {
                  slug: item.slug || item.id,
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: item.thumbnailUrl || "https://placehold.co/300",
                }}
                style={{ width: "100%", height: 118 }}
              />
              <View className="p-3.5">
                <Text
                  className="text-white font-bold leading-tight mb-2"
                  numberOfLines={2}
                  style={{ fontSize: 15 }}
                >
                  {item.title}
                </Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={12}
                    color="#555"
                  />
                  <Text
                    className="text-[#555] ml-1.5 font-medium"
                    style={{ fontSize: 12 }}
                  >
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══════════════════════════════════════════════
            4. GIẢI PHÁP CÔNG NGHỆ
        ══════════════════════════════════════════════ */}
        <SectionHeader title="Giải Pháp" highlight="Công Nghệ" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SOLUTIONS}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View
              className="bg-[#131313] rounded-[22px] p-4 mr-3 border"
              style={{ width: 160, borderColor: "rgba(216,201,123,0.18)" }}
            >
              <IconBox name={item.icon} size={26} />
              <Text
                className="text-white font-bold mt-4 mb-2 leading-tight"
                style={{ fontSize: 16 }}
              >
                {item.title}
              </Text>
              <Text
                className="text-[#777] leading-relaxed"
                style={{ fontSize: 13 }}
              >
                {item.desc}
              </Text>
            </View>
          )}
        />

        {/* ══════════════════════════════════════════════
            5. ĐỐI TÁC
        ══════════════════════════════════════════════ */}
        <SectionHeader title="Đối Tác" highlight="Đồng Hành" />
        <View className="mb-2">
          <MarqueePartners />
        </View>

        {/* ══════════════════════════════════════════════
            6. VỀ WEBIE VIETNAM
        ══════════════════════════════════════════════ */}
        <SectionHeader title="Về" highlight="Webie Vietnam" />
        <View className="px-5 mb-6">
          {/* Team photo */}
          <View
            className="h-[210px] rounded-[22px] overflow-hidden mb-4"
            style={{ borderWidth: 1, borderColor: "rgba(216,201,123,0.2)" }}
          >
            <Image
              source={TEAM_IMAGE}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(10,10,10,0.97)"]}
              className="absolute bottom-0 left-0 right-0 h-28 justify-end p-5"
            >
              <View
                className="flex-row items-center self-start px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: "rgba(10,10,10,0.85)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.35)",
                }}
              >
                <MaterialCommunityIcons
                  name="star-circle-outline"
                  size={17}
                  color="#D8C97B"
                />
                <Text
                  className="text-[#D8C97B] font-bold ml-2 tracking-wide"
                  style={{ fontSize: 14 }}
                >
                  Đối tác chiến lược chuyển đổi số
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats */}
          <View
            className="flex-row bg-[#131313] rounded-[22px] overflow-hidden"
            style={{ borderWidth: 1, borderColor: "#222" }}
          >
            {STATS.map((s, i) => (
              <View
                key={i}
                className={`flex-1 items-center py-5 ${i < STATS.length - 1 ? "border-r border-[#222]" : ""}`}
              >
                <Text
                  className="text-[#D8C97B] font-black mb-1"
                  style={{ fontSize: 22 }}
                >
                  {s.num}
                </Text>
                <Text
                  className="text-[#666] uppercase font-bold tracking-wider"
                  style={{ fontSize: 11 }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════════════
            7. LIÊN HỆ HỢP TÁC
        ══════════════════════════════════════════════ */}
        <SectionHeader title="Liên Hệ" highlight="Hợp Tác" />
        <View className="px-5">
          {/* Map */}
          <TouchableOpacity
            activeOpacity={1}
            className="rounded-[22px] overflow-hidden mb-4 bg-[#0a0a0a]"
            style={{ borderWidth: 1, borderColor: "#1e1e1e" }}
          >
            <WebView
              source={{ html: MAP_HTML }}
              style={{ height: 190, backgroundColor: "#0a0a0a" }}
              scrollEnabled={false}
              androidLayerType="hardware"
              javaScriptEnabled
              domStorageEnabled
            />
            <TouchableOpacity
              className="absolute inset-0"
              onPress={openMap}
              activeOpacity={0.01}
            />
            <View
              className="flex-row items-center justify-between px-4 py-4"
              style={{ backgroundColor: "#131313" }}
            >
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons
                  name="navigation-variant-outline"
                  size={17}
                  color="#D8C97B"
                />
                <Text
                  className="text-[#999] font-medium flex-1 ml-2"
                  numberOfLines={1}
                  style={{ fontSize: 14 }}
                >
                  28 Mai Chí Thọ, An Phú, TP. Thủ Đức
                </Text>
              </View>
              <Text
                className="text-[#D8C97B] font-bold"
                style={{ fontSize: 14 }}
              >
                Mở Maps →
              </Text>
            </View>
          </TouchableOpacity>

          {/* Contact list */}
          <View
            className="bg-[#131313] rounded-[22px] overflow-hidden mb-8"
            style={{ borderWidth: 1, borderColor: "#222" }}
          >
            {[
              {
                icon: "map-marker-outline" as const,
                label: "ĐỊA CHỈ",
                value: "28 Mai Chí Thọ, P.An Phú",
                onPress: openMap,
              },
              {
                icon: "phone-outline" as const,
                label: "HOTLINE",
                value: "+84 969 838 467",
                onPress: openPhone,
              },
              {
                icon: "email-outline" as const,
                label: "EMAIL",
                value: "Huyen.dang@webie.com.vn",
                onPress: openMail,
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={item.onPress}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-4 ${i < 2 ? "border-b border-[#1e1e1e]" : ""}`}
              >
                <View
                  className="w-12 h-12 rounded-[16px] items-center justify-center mr-4"
                  style={{
                    backgroundColor: "rgba(216,201,123,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(216,201,123,0.2)",
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color="#D8C97B"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[#555] font-black tracking-widest mb-1"
                    style={{ fontSize: 11 }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    className="text-[#e0e0e0] font-bold"
                    style={{ fontSize: 16 }}
                  >
                    {item.value}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#333"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
