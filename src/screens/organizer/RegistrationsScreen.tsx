// ============================================================
// FILE: RegistrationsScreen.tsx
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchOrganizerRegistrations,
  Registration,
} from "../../store/slices/organizerSlice";

// ─── Design tokens ───────────────────────────────────────────
const GOLD = "#D8C97B";
const GOLD2 = "#B5A65F";
const BG = "#0A0A0C";
const SURFACE = "#111115";
const SURFACE2 = "#17171C";
const BORDER = "rgba(255,255,255,0.06)";
const BORDER_MID = "rgba(255,255,255,0.10)";
const MUTED = "#3A3A45";
const MUTED2 = "#252530";

// ─── Status map ──────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ duyệt", color: "#F59E0B", bg: "#F59E0B14" },
  APPROVED: { label: "Đã duyệt", color: "#60A5FA", bg: "#60A5FA14" },
  CONFIRMED: { label: "Xác nhận", color: "#34D399", bg: "#34D39914" },
  REJECTED: { label: "Từ chối", color: "#F87171", bg: "#F8717114" },
  CHECKED_IN: { label: "Check-in", color: "#A78BFA", bg: "#A78BFA14" },
};
const getStatus = (s: string) =>
  STATUS[s] || { label: s, color: "#6B7280", bg: "#6B728014" };

// ─── Filter config ───────────────────────────────────────────
const FILTERS = [
  { id: "ALL", label: "Tất cả", icon: "list-outline" },
  { id: "CHECKED_IN", label: "Check-in", icon: "checkmark-circle-outline" },
  { id: "PENDING", label: "Chờ duyệt", icon: "time-outline" },
  { id: "APPROVED", label: "Đã duyệt", icon: "shield-checkmark-outline" },
  { id: "REJECTED", label: "Từ chối", icon: "close-circle-outline" },
];

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconBox, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, alignItems: "center", gap: 5, paddingVertical: 14 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  val: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  lbl: {
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
  },
});

// ─── Detail Row ───────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={dr.row}>
      <View style={[dr.iconBox, { backgroundColor: (accent || MUTED) + "18" }]}>
        <Ionicons name={icon as any} size={13} color={accent || MUTED} />
      </View>
      <View style={dr.texts}>
        <Text style={dr.label}>{label}</Text>
        <Text
          style={[dr.value, accent ? { color: accent } : {}]}
          numberOfLines={2}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}
const dr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, gap: 2 },
  label: {
    fontSize: 10,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { fontSize: 13, color: "#D0D0E0", fontFamily: "Inter_500Medium" },
});

// ─── Bottom Sheet ─────────────────────────────────────────────
function DetailSheet({
  item,
  onClose,
}: {
  item: Registration | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [item]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onClose();
    });
  };

  if (!visible || !item) return null;

  const { label, color, bg } = getStatus(item.status);
  const checkedIn = item.eventCheckInStatus === "CHECKED_IN";

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
      animationType="none"
    >
      {/* Backdrop */}
      <Animated.View style={[bs.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[bs.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={bs.handle} />

        {/* Header */}
        <View style={bs.header}>
          <View style={bs.avatarWrap}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={bs.avatar} />
            ) : (
              <View style={[bs.avatar, bs.avatarFallback]}>
                <Text style={bs.avatarInitial}>
                  {(item.username || "?")[0].toUpperCase()}
                </Text>
              </View>
            )}
            {checkedIn && (
              <View style={bs.checkedRing}>
                <Ionicons name="checkmark" size={9} color="#000" />
              </View>
            )}
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={bs.name} numberOfLines={1}>
              {item.username || "Người dùng"}
            </Text>
            <Text style={bs.email} numberOfLines={1}>
              {item.email}
            </Text>
            <View
              style={[
                bs.statusBadge,
                { backgroundColor: bg, borderColor: color + "40" },
              ]}
            >
              <View style={[bs.statusDot, { backgroundColor: color }]} />
              <Text style={[bs.statusText, { color }]}>{label}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={bs.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={bs.divider} />

        {/* Body */}
        <ScrollView
          style={bs.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={bs.sectionTitle}>Thông tin vé</Text>
          <View style={bs.section}>
            {item.ticketCode && (
              <DetailRow
                icon="ticket-outline"
                label="Mã vé"
                value={item.ticketCode}
                accent="#A78BFA"
              />
            )}
            {item.registrationDate && (
              <DetailRow
                icon="calendar-outline"
                label="Ngày đăng ký"
                value={new Date(item.registrationDate).toLocaleDateString(
                  "vi-VN",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              />
            )}
            <DetailRow
              icon="shield-checkmark-outline"
              label="Trạng thái đăng ký"
              value={label}
              accent={color}
            />
            <DetailRow
              icon="scan-circle-outline"
              label="Trạng thái check-in"
              value={checkedIn ? "Đã check-in" : "Chưa check-in"}
              accent={checkedIn ? "#34D399" : MUTED}
            />
          </View>

          <Text style={[bs.sectionTitle, { marginTop: 20 }]}>
            Thông tin người dùng
          </Text>
          <View style={bs.section}>
            <DetailRow
              icon="person-outline"
              label="Tên"
              value={item.username || "Chưa cập nhật"}
            />
            <DetailRow
              icon="mail-outline"
              label="Email"
              value={item.email || "Chưa cập nhật"}
            />
            {(item as any).phoneNumber && (
              <DetailRow
                icon="call-outline"
                label="Số điện thoại"
                value={(item as any).phoneNumber}
              />
            )}
            {(item as any).userId && (
              <DetailRow
                icon="finger-print-outline"
                label="User ID"
                value={String((item as any).userId)}
                accent={MUTED}
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const bs = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_MID,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: MUTED2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 16 },
  avatarFallback: {
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER_MID,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 22, color: MUTED, fontFamily: "Inter_700Bold" },
  checkedRing: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#34D399",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: SURFACE,
  },
  name: {
    fontSize: 16,
    color: "#EBEBF5",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  email: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER_MID,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  body: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  section: {
    backgroundColor: SURFACE2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
});

// ─── Registration Row ─────────────────────────────────────────
function RegRow({
  item,
  onViewDetail,
}: {
  item: Registration;
  onViewDetail: () => void;
}) {
  const { label, color, bg } = getStatus(item.status);
  const checkedIn = item.eventCheckInStatus === "CHECKED_IN";

  return (
    <TouchableOpacity
      style={[rr.row, checkedIn && rr.rowChecked]}
      onPress={onViewDetail}
      activeOpacity={0.75}
    >
      <View style={[rr.accentBar, { backgroundColor: color }]} />

      <View style={rr.avatarWrap}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={rr.avatar} />
        ) : (
          <View style={[rr.avatar, rr.avatarFallback]}>
            <Text style={rr.avatarInitial}>
              {(item.username || "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        {checkedIn && (
          <View style={rr.checkedDot}>
            <Ionicons name="checkmark" size={7} color="#000" />
          </View>
        )}
      </View>

      <View style={rr.info}>
        <Text style={rr.name} numberOfLines={1}>
          {item.username || "Người dùng"}
        </Text>
        <Text style={rr.email} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={rr.bottomRow}>
          {item.ticketCode && (
            <View style={rr.ticketChip}>
              <Ionicons name="ticket-outline" size={9} color="#A78BFA" />
              <Text
                style={rr.ticketCode}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {item.ticketCode}
              </Text>
            </View>
          )}
          {item.registrationDate && (
            <Text style={rr.date}>
              {new Date(item.registrationDate).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>
      </View>

      <View style={rr.right}>
        <View
          style={[rr.badge, { backgroundColor: bg, borderColor: color + "35" }]}
        >
          <View style={[rr.badgeDot, { backgroundColor: color }]} />
          <Text style={[rr.badgeText, { color }]}>{label}</Text>
        </View>
        <View style={rr.eyeBtn}>
          <Ionicons name="eye-outline" size={14} color="#8888AA" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 0,
    marginBottom: 8,
    gap: 11,
    overflow: "hidden",
  },
  rowChecked: { borderColor: "#34D39920", backgroundColor: "#34D39905" },
  accentBar: {
    width: 3,
    height: "60%",
    borderRadius: 3,
    marginLeft: 8,
    opacity: 0.8,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 42, height: 42, borderRadius: 13 },
  avatarFallback: {
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER_MID,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 16, color: MUTED, fontFamily: "Inter_700Bold" },
  checkedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#34D399",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: BG,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 13, color: "#E8E8F0", fontFamily: "Inter_600SemiBold" },
  email: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  ticketChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#A78BFA12",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#A78BFA25",
    maxWidth: 140,
    flexShrink: 1,
  },
  ticketCode: {
    fontSize: 9,
    color: "#A78BFA",
    fontFamily: "Inter_500Medium",
    flexShrink: 1,
  },
  date: { fontSize: 9, color: MUTED2, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  eyeBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#8888AA12",
    borderWidth: 1,
    borderColor: "#8888AA25",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Main Screen ──────────────────────────────────────────────
export function OrganizerRegistrationsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, eventName, activityId, activityName } = route.params || {};

  const { registrations, isRegistrationsLoading } = useAppSelector(
    (s) => s.organizer,
  );

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Registration | null>(null);

  useEffect(() => {
    if (eventId) dispatch(fetchOrganizerRegistrations(eventId));
  }, [eventId]);

  const filtered = useMemo(() => {
    let r = [...registrations];
    if (filterStatus !== "ALL")
      r = r.filter((x) =>
        filterStatus === "CHECKED_IN"
          ? x.eventCheckInStatus === "CHECKED_IN"
          : x.status === filterStatus,
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          (x.username || "").toLowerCase().includes(q) ||
          (x.email || "").toLowerCase().includes(q) ||
          (x.ticketCode || "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [registrations, filterStatus, search]);

  const totalCheckedIn = registrations.filter(
    (r) => r.eventCheckInStatus === "CHECKED_IN",
  ).length;
  const totalPending = registrations.filter(
    (r) => r.status === "PENDING",
  ).length;
  const rate =
    registrations.length > 0
      ? Math.round((totalCheckedIn / registrations.length) * 100)
      : 0;

  return (
    <SafeAreaView style={rs.safe} edges={["top"]}>
      {/* Header */}
      <View style={rs.topBar}>
        <TouchableOpacity
          style={rs.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#C8C8D8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={rs.topTitle}>Danh sách đăng ký</Text>
          {(activityName || eventName) && (
            <Text style={rs.topSub} numberOfLines={1}>
              {activityName || eventName}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={rs.statsRow}>
        <StatCard
          value={registrations.length}
          label="Tổng"
          color="#C8C8D8"
          icon="people-outline"
        />
        <View style={rs.statsDivider} />
        <StatCard
          value={totalCheckedIn}
          label="Check-in"
          color="#34D399"
          icon="checkmark-circle-outline"
        />
        <View style={rs.statsDivider} />
        <StatCard
          value={totalPending}
          label="Chờ duyệt"
          color="#F59E0B"
          icon="time-outline"
        />
        <View style={rs.statsDivider} />
        <StatCard
          value={`${rate}%`}
          label="Tỷ lệ"
          color={rate > 70 ? "#34D399" : GOLD}
          icon="stats-chart-outline"
        />
      </View>

      {/* Search */}
      <View style={rs.searchWrap}>
        <Ionicons name="search-outline" size={15} color={MUTED} />
        <TextInput
          style={rs.searchInput}
          placeholder="Tìm tên, email, mã vé..."
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <View style={rs.clearBtn}>
              <Ionicons name="close" size={10} color={MUTED} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={rs.filterScroll}
        contentContainerStyle={rs.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filterStatus === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[rs.filterTab, active && rs.filterTabActive]}
              onPress={() => setFilterStatus(f.id)}
              activeOpacity={0.75}
            >
              {active && (
                <LinearGradient
                  colors={[GOLD, GOLD2]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              <Ionicons
                name={f.icon as any}
                size={11}
                color={active ? "#0A0A0C" : MUTED}
              />
              <Text style={[rs.filterText, active && rs.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      {!isRegistrationsLoading && (
        <View style={rs.countRow}>
          <Text style={rs.countText}>
            {filtered.length} kết quả{search ? ` cho "${search}"` : ""}
          </Text>
          {filterStatus !== "ALL" && (
            <TouchableOpacity
              onPress={() => {
                setFilterStatus("ALL");
                setSearch("");
              }}
            >
              <Text style={rs.clearFilter}>Xoá bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      {isRegistrationsLoading ? (
        <View style={rs.loadingWrap}>
          <ActivityIndicator color={GOLD} size="large" />
          <Text style={rs.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={rs.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRegistrationsLoading}
              onRefresh={() => dispatch(fetchOrganizerRegistrations(eventId))}
              tintColor={GOLD}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={rs.empty}>
              <View style={rs.emptyIconWrap}>
                <Ionicons name="people-outline" size={30} color={MUTED} />
              </View>
              <Text style={rs.emptyTitle}>Không có kết quả</Text>
              <Text style={rs.emptySub}>
                {search ? `Không tìm thấy "${search}"` : "Chưa có đăng ký nào"}
              </Text>
              {search.length > 0 && (
                <TouchableOpacity
                  style={rs.emptyBtn}
                  onPress={() => setSearch("")}
                >
                  <Text style={rs.emptyBtnText}>Xoá tìm kiếm</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map((item) => (
              <RegRow
                key={item.id}
                item={item}
                onViewDetail={() => setSelectedItem(item)}
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Bottom Sheet Detail */}
      <DetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
    </SafeAreaView>
  );
}

// ─── Main styles ──────────────────────────────────────────────
const rs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_MID,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    color: "#EBEBF5",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  topSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  statsDivider: { width: 1, backgroundColor: BORDER, marginVertical: 12 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_MID,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    color: "#E8E8F0",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: MUTED2,
    alignItems: "center",
    justifyContent: "center",
  },

  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 7,
    alignItems: "center",
    flexDirection: "row",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_MID,
    overflow: "hidden",
  },
  filterTabActive: { borderColor: GOLD + "60" },
  filterText: { fontSize: 11, color: MUTED, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: "#0A0A0C", fontFamily: "Inter_700Bold" },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 2,
    marginBottom: 8,
  },
  countText: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  clearFilter: { fontSize: 11, color: GOLD, fontFamily: "Inter_500Medium" },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },

  list: { paddingHorizontal: 16 },

  empty: { alignItems: "center", paddingVertical: 70, gap: 10 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_MID,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    color: "#3A3A50",
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: { fontSize: 12, color: MUTED2, fontFamily: "Inter_400Regular" },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD + "40",
    backgroundColor: GOLD + "10",
  },
  emptyBtnText: { fontSize: 12, color: GOLD, fontFamily: "Inter_500Medium" },
});
