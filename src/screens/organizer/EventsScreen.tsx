// OrganizerEventsScreen.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  TextInput,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchOrganizerEvents,
  OrganizerEvent,
} from "../../store/slices/organizerSlice";
import { AppHeader } from "./AppHeader";

// ─── Colors ──────────────────────────────────────────────────────────────────
const GOLD = "#D8C97B";
const BG = "#060606";
const CARD = "#0F0F0F";
const CARD2 = "#141414";
const BORDER = "rgba(255,255,255,0.08)";
const GREEN = "#22c55e";
const BLUE = "#60a5fa";
const RED = "#f87171";

const checkTime = (s: string, e: string) => {
  const now = Date.now();
  if (now > new Date(e).getTime()) return "ENDED";
  if (now < new Date(s).getTime()) return "UPCOMING";
  return "HAPPENING";
};

const getStatusCfg = (event: OrganizerEvent) => {
  if (event.status === "PENDING_APPROVAL")
    return { label: "Chờ duyệt", color: BLUE, bg: BLUE + "22" };
  if (event.status === "DRAFT")
    return { label: "Bản nháp", color: "#888", bg: "#252525" };
  if (event.status === "REJECTED")
    return { label: "Từ chối", color: RED, bg: RED + "22" };
  if (event.status === "PUBLISHED" || event.status === "APPROVED") {
    const t = checkTime(event.startDate, event.endDate);
    if (t === "HAPPENING")
      return { label: "Đang diễn ra", color: GREEN, bg: GREEN + "22" };
    if (t === "UPCOMING")
      return { label: "Sắp diễn ra", color: GOLD, bg: GOLD + "22" };
    return { label: "Đã kết thúc", color: "#666", bg: "#1a1a1a" };
  }
  return { label: event.status, color: "#888", bg: "#222" };
};

const FILTERS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PUBLISHED", label: "Đang / Sắp" },
  { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { id: "DRAFT", label: "Nháp" },
  { id: "REJECTED", label: "Từ chối" },
];

// ─── Animated Card ────────────────────────────────────────────────────────────
function AnimatedCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 9,
        tension: 80,
        delay: index * 55,
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

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({
  event,
  onPress,
  index,
}: {
  event: OrganizerEvent;
  onPress: () => void;
  index: number;
}) {
  const { label, color, bg } = getStatusCfg(event);
  const isEnded = checkTime(event.startDate, event.endDate) === "ENDED";
  const isHappening =
    !isEnded &&
    (event.status === "PUBLISHED" || event.status === "APPROVED") &&
    checkTime(event.startDate, event.endDate) === "HAPPENING";

  return (
    <AnimatedCard index={index}>
      <TouchableOpacity
        style={[ec.card, isHappening && { borderColor: GREEN + "40" }]}
        onPress={onPress}
        activeOpacity={0.78}
      >
        <View style={ec.bannerWrap}>
          {event.bannerImageUrl ? (
            <Image
              source={{ uri: event.bannerImageUrl }}
              style={[ec.banner, isEnded && { opacity: 0.3 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[ec.banner, ec.bannerEmpty]}>
              <Ionicons name="image-outline" size={40} color="#252525" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(6,6,6,0.7)", "#060606"]}
            style={ec.grad}
          />

          <View
            style={[
              ec.statusBadge,
              { backgroundColor: bg, borderColor: color + "40" },
            ]}
          >
            {isHappening && (
              <View style={[ec.pulse, { backgroundColor: color }]} />
            )}
            <Text style={[ec.statusTxt, { color }]}>{label}</Text>
          </View>

          <View style={ec.dateChip}>
            <Ionicons name="calendar-outline" size={12} color={GOLD} />
            <Text style={ec.dateText}>
              {new Date(event.startDate).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={ec.body}>
          <Text
            style={[ec.title, isEnded && { color: "#555" }]}
            numberOfLines={2}
          >
            {event.eventName}
          </Text>
          <View style={ec.metaRow}>
            <Ionicons name="location-outline" size={13} color="#555" />
            <Text style={ec.metaText} numberOfLines={1}>
              {event.location || "Chưa cập nhật địa điểm"}
            </Text>
          </View>
          <View style={ec.footer}>
            <Text style={[ec.cta, isEnded && { color: "#444" }]}>
              {isEnded ? "Xem chi tiết" : "Quản lý sự kiện"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={15}
              color={isEnded ? "#444" : GOLD}
            />
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function OrganizerEventsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { events, isLoading } = useAppSelector((s) => s.organizer);
  const { user } = useAppSelector((s) => s.auth);
  const { myStatus } = useAppSelector((s) => s.organizer);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const displayName = myStatus?.name || user?.username || "Organizer";
  const avatarUri =
    (user as any)?.avatarUrl || (user as any)?.profilePictureUrl;
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    dispatch(fetchOrganizerEvents());
  }, []);

  const filtered = useMemo(() => {
    let r = [...events];
    if (filter !== "ALL")
      r = r.filter((e) =>
        filter === "PUBLISHED"
          ? e.status === "PUBLISHED" || e.status === "APPROVED"
          : e.status === filter,
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (e) =>
          e.eventName.toLowerCase().includes(q) ||
          (e.location || "").toLowerCase().includes(q),
      );
    }
    return r.sort((a, b) => {
      const ord: Record<string, number> = {
        HAPPENING: 0,
        UPCOMING: 1,
        ENDED: 2,
      };
      return (
        (ord[checkTime(a.startDate, a.endDate)] ?? 3) -
        (ord[checkTime(b.startDate, b.endDate)] ?? 3)
      );
    });
  }, [events, filter, search]);

  const countFor = (id: string) =>
    id === "ALL"
      ? events.length
      : events.filter((e) =>
          id === "PUBLISHED"
            ? e.status === "PUBLISHED" || e.status === "APPROVED"
            : e.status === id,
        ).length;

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      {/* HEADER */}
      <AppHeader
        avatarUri={avatarUri}
        initial={initial}
        onAvatarPress={() => navigation.goBack()}
      />

      {/* SEARCH */}
      <View style={ss.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#555" />
        <TextInput
          style={ss.searchInput}
          placeholder="Tìm kiếm sự kiện..."
          placeholderTextColor="#3a3a3a"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={17} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={ss.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const cnt = countFor(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.75}
              style={[ss.tab, active ? ss.tabOn : ss.tabOff]}
            >
              <Text style={active ? ss.tabTxtOn : ss.tabTxtOff}>{f.label}</Text>
              {cnt > 0 && (
                <View style={active ? ss.badgeOn : ss.badgeOff}>
                  <Text style={active ? ss.badgeTxtOn : ss.badgeTxtOff}>
                    {cnt}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={ss.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => dispatch(fetchOrganizerEvents())}
            tintColor={GOLD}
          />
        }
      >
        {!isLoading && filtered.length === 0 && (
          <View style={ss.empty}>
            <View style={ss.emptyIcon}>
              <Ionicons name="calendar-outline" size={34} color="#2a2a2a" />
            </View>
            <Text style={ss.emptyTitle}>
              {search ? "Không tìm thấy kết quả" : "Chưa có sự kiện nào"}
            </Text>
            <Text style={ss.emptySub}>
              {search
                ? "Thử từ khóa khác"
                : "Sự kiện của bạn sẽ hiển thị ở đây"}
            </Text>
          </View>
        )}
        {filtered.map((event, i) => (
          <EventCard
            key={event.eventId}
            event={event}
            index={i}
            onPress={() =>
              navigation.navigate("OrganizerEventDetail", { event })
            }
          />
        ))}
        <View style={{ height: 130 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ec = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: "hidden",
  },
  bannerWrap: { height: 185, position: "relative" },
  banner: { width: "100%", height: "100%", backgroundColor: "#111" },
  bannerEmpty: { alignItems: "center", justifyContent: "center" },
  grad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 100 },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  pulse: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateChip: {
    position: "absolute",
    bottom: 10,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  dateText: { fontSize: 12, color: "#ccc", fontWeight: "600" },
  body: { padding: 16, gap: 8, backgroundColor: BG },
  title: {
    fontSize: 18,
    color: "#f5f5f5",
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#666", flex: 1, fontWeight: "500" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  cta: { fontSize: 14, color: GOLD, fontWeight: "700" },
});

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },

  // Filter tabs
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Đảm bảo chữ luôn nằm giữa
    gap: 7,
    height: 40, // Đã đổi thành height cố định để chống phình to
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
  },
  tabOn: { backgroundColor: GOLD, borderColor: GOLD },
  tabOff: { backgroundColor: "#1c1c1c", borderColor: "rgba(255,255,255,0.08)" },

  tabTxtOn: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
    lineHeight: 18, // Chống cắt chữ
  },
  tabTxtOff: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
    lineHeight: 18, // Chống cắt chữ
  },

  badgeOn: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOff: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeTxtOn: { fontSize: 11, fontWeight: "800", color: "#000" },
  badgeTxtOff: { fontSize: 11, fontWeight: "700", color: "#666" },

  // List & Empty
  list: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, color: "#666", fontWeight: "700" },
  emptySub: { fontSize: 13, color: "#3a3a3a", fontWeight: "500" },
});
