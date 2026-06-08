// OrganizerHomeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchOrganizerEvents,
  OrganizerEvent,
} from "../../store/slices/organizerSlice";
import { fetchMyOrganizerStatus } from "../../store/slices/organizerSlice";
import { logoutUser } from "../../store/slices/authSlice";
import { AppHeader } from "./AppHeader";

// ─── Colors ──────────────────────────────────────────────────────────────────
const GOLD = "#D8C97B";
const GOLD2 = "#B5A65F";
const BG = "#060606";
const CARD = "#101010";
const CARD2 = "#161616";
const BORDER = "rgba(255,255,255,0.08)";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const RED = "#ef4444";

// ─── SVG & Chart Components ──────────────────────────────────────────────────
function arcPath(cx: number, cy: number, r: number, p: number) {
  if (p <= 0.001) return `M ${cx - r} ${cy}`;
  const a = Math.PI * (1 - Math.min(p, 0.9999));
  return `M ${cx - r} ${cy} A ${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy - r * Math.sin(a)).toFixed(1)}`;
}

function MiniGauge({
  value,
  max,
  width,
}: {
  value: number;
  max: number;
  width: number;
}) {
  const GH = width * 0.6;
  const GCX = width / 2;
  const GCY = GH - 5;
  const GR = width / 2 - 12;
  const [prog, setProg] = useState(0);
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  useEffect(() => {
    setProg(0);
    let fId: number;
    let n = 0;
    const run = () => {
      n++;
      setProg((1 - Math.pow(1 - Math.min(n / 40, 1), 3)) * pct);
      if (n < 40) fId = requestAnimationFrame(run);
    };
    fId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(fId);
  }, [pct]);

  return (
    <Svg width={width} height={GH}>
      <Defs>
        <SvgGrad id="gf" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={GOLD2} />
          <Stop offset="1" stopColor={GOLD} />
        </SvgGrad>
      </Defs>
      <Path
        d={arcPath(GCX, GCY, GR, 1)}
        stroke="#222"
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
      {prog > 0.01 && (
        <Path
          d={arcPath(GCX, GCY, GR, prog)}
          stroke="url(#gf)"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
        />
      )}
      <SvgText
        x={GCX}
        y={GCY}
        fontSize={28}
        fill="#fff"
        textAnchor="middle"
        fontWeight="900"
        letterSpacing={-1}
      >
        {value}
      </SvgText>
    </Svg>
  );
}

function VerticalBar({
  progress,
  color,
  label,
}: {
  progress: number;
  color: string;
  label: string;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: progress || 0,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={ss.barTrack}>
        <Animated.View
          style={[
            ss.barFill,
            {
              backgroundColor: color,
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={ss.barLabel}>{label}</Text>
    </View>
  );
}

// ─── Animation Wrapper ────────────────────────────────────────────────────────
function FadeSlideIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Event Row (NEW DESIGN WITH BANNER) ───────────────────────────────────────
function EventRow({
  event,
  onPress,
}: {
  event: OrganizerEvent;
  onPress: () => void;
}) {
  const { label, color } = (() => {
    if (event.status === "PENDING_APPROVAL")
      return { label: "Chờ duyệt", color: BLUE };
    if (event.status === "DRAFT") return { label: "Bản nháp", color: "#666" };
    if (event.status === "REJECTED") return { label: "Từ chối", color: RED };
    const now = new Date().getTime();
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    if (now > end) return { label: "Đã kết thúc", color: "#555" };
    if (now >= start && now <= end)
      return { label: "Đang diễn ra", color: GREEN };
    return { label: "Sắp tới", color: GOLD };
  })();

  const isLive = label === "Đang diễn ra";
  const isEnded = label === "Đã kết thúc";

  return (
    <TouchableOpacity
      style={[er.card, isLive && er.cardLive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Thumbnail Left */}
      <View style={er.imageWrap}>
        {event.bannerImageUrl ? (
          <Image
            source={{ uri: event.bannerImageUrl }}
            style={[er.image, isEnded && { opacity: 0.4 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[er.image, er.imagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#333" />
          </View>
        )}

        {/* LIVE Tag Over Image */}
        {isLive && (
          <View style={er.liveTag}>
            <View style={er.pulse} />
            <Text style={er.liveTagTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Content Right */}
      <View style={er.content}>
        <Text
          style={[er.title, isEnded && { color: "#777" }]}
          numberOfLines={2}
        >
          {event.eventName}
        </Text>

        <View style={er.metaGrid}>
          <View style={er.metaRow}>
            <Ionicons name="calendar-outline" size={13} color="#888" />
            <Text style={er.metaText}>
              {new Date(event.startDate).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>
          {event.location && (
            <View style={er.metaRow}>
              <Ionicons name="location-outline" size={13} color="#888" />
              <Text style={er.metaText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Badge & Arrow */}
        <View style={er.footer}>
          <View
            style={[
              er.badge,
              { backgroundColor: color + "15", borderColor: color + "30" },
            ]}
          >
            <View style={[er.badgeDot, { backgroundColor: color }]} />
            <Text style={[er.badgeTxt, { color }]}>{label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#444" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrganizerHomeScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { events, stats, isLoading, myStatus } = useAppSelector(
    (s) => s.organizer,
  );
  const { user } = useAppSelector((s) => s.auth);

  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    dispatch(fetchOrganizerEvents());
    dispatch(fetchMyOrganizerStatus());
  }, []);

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  };

  const handleLogout = () =>
    Alert.alert("Đăng xuất", "Bạn có muốn thoát?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => dispatch(logoutUser()),
      },
    ]);

  // Logic Phân loại dữ liệu
  const happeningEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter(
      (e) =>
        (e.status === "PUBLISHED" || e.status === "APPROVED") &&
        now >= new Date(e.startDate).getTime() &&
        now <= new Date(e.endDate).getTime(),
    );
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter(
      (e) =>
        (e.status === "PUBLISHED" || e.status === "APPROVED") &&
        now < new Date(e.startDate).getTime(),
    );
  }, [events]);

  const draftPendingEvents = useMemo(
    () =>
      events.filter(
        (e) => e.status === "DRAFT" || e.status === "PENDING_APPROVAL",
      ),
    [events],
  );
  const endedEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter(
      (e) =>
        (e.status === "PUBLISHED" || e.status === "APPROVED") &&
        now > new Date(e.endDate).getTime(),
    );
  }, [events]);

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )
        .slice(0, 8),
    [events],
  );

  const totalEvs = events.length || stats.totalEvents || 1;
  const wLive = (happeningEvents.length / totalEvs) * 100;
  const wUp = (upcomingEvents.length / totalEvs) * 100;
  const wPend = (draftPendingEvents.length / totalEvs) * 100;
  const wEnd = (endedEvents.length / totalEvs) * 100;

  const displayName = myStatus?.name || user?.username || "Organizer";
  const displayEmail = myStatus?.email || user?.email || "";
  const avatarUri =
    (user as any)?.avatarUrl || (user as any)?.profilePictureUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <AppHeader
        avatarUri={avatarUri}
        initial={initial}
        liveCount={happeningEvents.length}
        onAvatarPress={openMenu}
      />

      {/* Menu Dropdown */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={dd.backdrop} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            dd.sheet,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
          pointerEvents="box-none"
        >
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={dd.userRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={dd.userAv} />
            ) : (
              <View style={dd.userAvFallback}>
                <Text style={dd.userAvInitial}>{initial}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={dd.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={dd.userEmail} numberOfLines={1}>
                {displayEmail}
              </Text>
            </View>
          </View>
          <View style={dd.divider} />
          <TouchableOpacity
            style={dd.item}
            onPress={() => {
              closeMenu();
              setTimeout(handleLogout, 150);
            }}
          >
            <Ionicons name="log-out" size={20} color={RED} />
            <Text style={dd.itemLabelDanger}>Đăng xuất</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              dispatch(fetchOrganizerEvents());
              dispatch(fetchMyOrganizerStatus());
            }}
            tintColor={GOLD}
          />
        }
      >
        {/* Banner Đang Diễn Ra */}
        {happeningEvents.length > 0 && (
          <FadeSlideIn delay={50}>
            <TouchableOpacity
              style={ss.liveBanner}
              onPress={() =>
                navigation.navigate("OrganizerEventDetail", {
                  event: happeningEvents[0],
                })
              }
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[GREEN + "22", "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={ss.livePulse} />
              <View style={{ flex: 1 }}>
                <Text style={ss.liveTxt}>
                  {happeningEvents.length} sự kiện đang diễn ra
                </Text>
                <Text style={ss.liveSub} numberOfLines={1}>
                  {happeningEvents[0].eventName}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={GREEN} />
            </TouchableOpacity>
          </FadeSlideIn>
        )}

        {/* 2 Thẻ Chỉ Số Bento */}
        <FadeSlideIn delay={100}>
          <View style={ss.bentoRow}>
            <View style={ss.bentoCard}>
              <Text style={ss.bentoTitle}>TỔNG SỰ KIỆN</Text>
              <View style={ss.gaugeContainer}>
                <MiniGauge
                  value={events.length}
                  max={Math.max(events.length, 10)}
                  width={120}
                />
              </View>
              <Text style={ss.bentoSub}>Đã tạo trên hệ thống</Text>
            </View>

            {/* Thẻ Biểu Đồ Cột thay thế thẻ Khách Đăng Ký */}
            <View style={ss.bentoCard}>
              <Text style={ss.bentoTitle}>PHÂN BỔ SỰ KIỆN</Text>
              <View style={ss.barContainer}>
                <VerticalBar progress={wLive} color={GREEN} label="Đang" />
                <VerticalBar progress={wUp} color={GOLD} label="Sắp tới" />
                <VerticalBar progress={wEnd} color={"#555"} label="Đã xong" />
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* Biểu Đồ Thanh Ngang Tích Lũy */}
        <FadeSlideIn delay={150}>
          <View style={ss.chartSection}>
            <Text style={ss.sectionTitle}>Tình trạng chi tiết</Text>
            <View style={ss.chartCard}>
              <View style={ss.stackedBarWrap}>
                {wLive > 0 && (
                  <View
                    style={[
                      ss.barSegment,
                      {
                        flex: wLive,
                        backgroundColor: GREEN,
                        borderTopLeftRadius: 10,
                        borderBottomLeftRadius: 10,
                        borderTopRightRadius: wLive === 100 ? 10 : 0,
                        borderBottomRightRadius: wLive === 100 ? 10 : 0,
                      },
                    ]}
                  />
                )}
                {wUp > 0 && (
                  <View
                    style={[
                      ss.barSegment,
                      {
                        flex: wUp,
                        backgroundColor: GOLD,
                        borderRadius: wUp === 100 ? 10 : 0,
                      },
                    ]}
                  />
                )}
                {wPend > 0 && (
                  <View
                    style={[
                      ss.barSegment,
                      {
                        flex: wPend,
                        backgroundColor: BLUE,
                        borderRadius: wPend === 100 ? 10 : 0,
                      },
                    ]}
                  />
                )}
                {wEnd > 0 && (
                  <View
                    style={[
                      ss.barSegment,
                      {
                        flex: wEnd,
                        backgroundColor: "#444",
                        borderTopRightRadius: 10,
                        borderBottomRightRadius: 10,
                        borderTopLeftRadius: wEnd === 100 ? 10 : 0,
                        borderBottomLeftRadius: wEnd === 100 ? 10 : 0,
                      },
                    ]}
                  />
                )}
                {events.length === 0 && (
                  <View
                    style={[
                      ss.barSegment,
                      { flex: 1, backgroundColor: "#222", borderRadius: 10 },
                    ]}
                  />
                )}
              </View>

              <View style={ss.legendGrid}>
                {[
                  {
                    label: "Đang diễn ra",
                    count: happeningEvents.length,
                    color: GREEN,
                  },
                  {
                    label: "Sắp tới",
                    count: upcomingEvents.length,
                    color: GOLD,
                  },
                  {
                    label: "Chờ/Nháp",
                    count: draftPendingEvents.length,
                    color: BLUE,
                  },
                  {
                    label: "Đã kết thúc",
                    count: endedEvents.length,
                    color: "#666",
                  },
                ].map((l, i) => (
                  <View key={i} style={ss.legendItem}>
                    <View
                      style={[ss.legendDot, { backgroundColor: l.color }]}
                    />
                    <Text style={ss.legendNum}>{l.count}</Text>
                    <Text style={ss.legendLabel}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* Nút Hành Động Gradient */}
        <FadeSlideIn delay={200}>
          <View style={ss.actionRow}>
            <TouchableOpacity
              style={ss.actionBtn}
              onPress={() => navigation.navigate("OrgEvents")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[CARD2, CARD]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[ss.actionIconBg, { backgroundColor: GOLD + "1A" }]}>
                <Ionicons name="list" size={20} color={GOLD} />
              </View>
              <Text style={ss.actionBtnTxt}>Danh sách sự kiện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={ss.actionBtn}
              onPress={() => navigation.navigate("OrgProfile")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[CARD2, CARD]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[ss.actionIconBg, { backgroundColor: "#333" }]}>
                <Ionicons name="business" size={20} color="#ddd" />
              </View>
              <Text style={[ss.actionBtnTxt, { color: "#ddd" }]}>
                Hồ sơ Tổ chức
              </Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        {/* Danh sách Sự Kiện Gần Đây */}
        <FadeSlideIn delay={250}>
          <View style={ss.listHeader}>
            <Text style={ss.sectionTitle}>Sự kiện gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate("OrgEvents")}>
              <Text style={ss.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            {recentEvents.length === 0 && !isLoading ? (
              <View style={ss.empty}>
                <Ionicons name="calendar-outline" size={44} color="#222" />
                <Text style={ss.emptyTitle}>Chưa có sự kiện nào</Text>
                <Text style={ss.emptySub}>
                  Các sự kiện bạn tạo sẽ hiển thị tại đây
                </Text>
              </View>
            ) : (
              recentEvents.map((ev) => (
                <EventRow
                  key={ev.eventId}
                  event={ev}
                  onPress={() =>
                    navigation.navigate("OrganizerEventDetail", { event: ev })
                  }
                />
              ))
            )}
          </View>
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const dd = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 230,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  userAv: { width: 40, height: 40, borderRadius: 20 },
  userAvFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e1c0a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD + "50",
  },
  userAvInitial: { color: GOLD, fontSize: 18, fontWeight: "800" },
  userName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  userEmail: { color: "#888", fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: BORDER },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  itemLabelDanger: { color: RED, fontSize: 14, fontWeight: "600" },
});

// NEW Event Row Styles
const er = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 16,
    gap: 14,
  },
  cardLive: {
    borderColor: GREEN + "40",
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: CARD2,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  liveTag: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  liveTagTxt: {
    color: GREEN,
    fontSize: 9,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  title: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 22,
  },
  metaGrid: {
    gap: 4,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GREEN + "40",
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: "hidden",
  },
  livePulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN },
  liveTxt: { fontSize: 15, color: GREEN, fontWeight: "800" },
  liveSub: {
    fontSize: 13,
    color: GREEN + "99",
    marginTop: 4,
    fontWeight: "600",
  },

  bentoRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    height: 160,
    overflow: "hidden",
  },
  bentoTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: "800",
    letterSpacing: 1,
  },
  gaugeContainer: { alignItems: "center", marginTop: 10 },
  bentoSub: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "600",
  },

  // Mini Bar Chart Styles
  barContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  barTrack: {
    width: 22,
    height: 75,
    backgroundColor: "#222",
    borderRadius: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 12 },
  barLabel: { fontSize: 10, color: "#888", fontWeight: "700", marginTop: 8 },

  chartSection: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  chartCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginTop: 14,
  },
  stackedBarWrap: {
    flexDirection: "row",
    height: 20,
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 20,
  },
  barSegment: { height: "100%" },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  legendItem: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendNum: { fontSize: 16, color: "#fff", fontWeight: "800" },
  legendLabel: { fontSize: 13, color: "#888", fontWeight: "500" },

  actionRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  actionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnTxt: { fontSize: 14, fontWeight: "700", color: GOLD, flex: 1 },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  seeAll: { fontSize: 14, color: GOLD, fontWeight: "700" },
  empty: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: { fontSize: 17, color: "#666", fontWeight: "700" },
  emptySub: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
