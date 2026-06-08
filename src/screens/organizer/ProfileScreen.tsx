// OrganizerProfileScreen.tsx
import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { logoutUser } from "../../store/slices/authSlice";
import {
  fetchOrganizerEvents,
  fetchMyOrganizerStatus,
  fetchAllOrganizers,
} from "../../store/slices/organizerSlice";

// ─── Premium Colors ──────────────────────────────────────────────────────
const GOLD = "#E5D07A";
const GOLD_DARK = "#9c8b46";
const BG = "#030303";
const BORDER = "rgba(255,255,255,0.06)";
const GREEN = "#10b981";
const RED = "#f43f5e";

// ─── Animation Wrapper ───────────────────────────────────────────────────
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
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
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

// ─── Components ─────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: any;
  label: string;
  value?: string | null;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={pr.infoRow}>
        <View style={pr.infoIcon}>
          <Ionicons name={icon} size={16} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pr.infoLabel}>{label}</Text>
          <Text
            style={[
              pr.infoValue,
              !value && { color: "#555", fontStyle: "italic" },
            ]}
          >
            {value || "Chưa cập nhật"}
          </Text>
        </View>
      </View>
      {!isLast && <View style={pr.infoSep} />}
    </>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger = false,
  chevron = true,
}: any) {
  return (
    <TouchableOpacity style={pr.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          pr.menuIcon,
          {
            backgroundColor: danger ? RED + "15" : GOLD + "10",
            borderColor: danger ? RED + "30" : GOLD + "20",
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={danger ? RED : GOLD} />
      </View>
      <Text style={[pr.menuLabel, danger && { color: RED }]}>{label}</Text>
      {value ? <Text style={pr.menuValue}>{value}</Text> : null}
      {chevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={danger ? RED + "60" : "#444"}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Divider trong card ──────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <View style={pr.dividerWrap}>
      <View style={pr.dividerLine} />
      <Text style={pr.dividerLabel}>{label}</Text>
      <View style={pr.dividerLine} />
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────
export function OrganizerProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { isLoading, myStatus, allOrganizers } = useAppSelector(
    (s) => s.organizer,
  );

  useEffect(() => {
    dispatch(fetchOrganizerEvents());
    dispatch(fetchMyOrganizerStatus());
    dispatch(fetchAllOrganizers());
  }, []);

  const handleLogout = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn thoát tài khoản?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => dispatch(logoutUser()),
      },
    ]);

  const fullProfile = useMemo(() => {
    if (!allOrganizers || !myStatus?.slug) return myStatus;
    const matchedOrg = allOrganizers.find(
      (org: any) => org.slug === myStatus.slug,
    );
    return matchedOrg ? { ...myStatus, ...matchedOrg } : myStatus;
  }, [allOrganizers, myStatus]);

  const orgStatus = (() => {
    if ((myStatus as any)?.approved === true || myStatus?.status === "APPROVED")
      return { label: "Đã xác thực", color: GREEN };
    if ((myStatus as any)?.approved === false || myStatus?.status === "PENDING")
      return { label: "Chờ duyệt", color: "#f59e0b" };
    if (myStatus?.status === "REJECTED")
      return { label: "Từ chối", color: RED };
    return { label: "Đang hoạt động", color: GOLD };
  })();

  const displayName =
    (fullProfile as any)?.organizerName ||
    fullProfile?.name ||
    user?.username ||
    "Organizer";
  const avatarUri =
    (user as any)?.avatarUrl || (user as any)?.profilePictureUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={pr.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              dispatch(fetchOrganizerEvents());
              dispatch(fetchMyOrganizerStatus());
              dispatch(fetchAllOrganizers());
            }}
            tintColor={GOLD}
          />
        }
      >
        {/* ── Avatar Hero ── */}
        <View style={pr.hero}>
          <LinearGradient colors={[GOLD_DARK, GOLD]} style={pr.avatarRing}>
            <View style={pr.avatarInner}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={pr.avatarImage} />
              ) : (
                <Text style={pr.avatarLetter}>{initial}</Text>
              )}
            </View>
          </LinearGradient>

          <Text style={pr.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={pr.emailText}>
            {(fullProfile as any)?.email || user?.email || ""}
          </Text>

          <View style={pr.badgeRow}>
            <View
              style={[
                pr.statusBadge,
                {
                  borderColor: orgStatus.color + "45",
                  backgroundColor: orgStatus.color + "16",
                },
              ]}
            >
              <View
                style={[
                  pr.statusDot,
                  {
                    backgroundColor: orgStatus.color,
                    shadowColor: orgStatus.color,
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  },
                ]}
              />
              <Text style={[pr.statusText, { color: orgStatus.color }]}>
                {orgStatus.label}
              </Text>
            </View>
            {myStatus?.locked && (
              <View
                style={[
                  pr.statusBadge,
                  { borderColor: RED + "45", backgroundColor: RED + "16" },
                ]}
              >
                <Ionicons name="lock-closed" size={11} color={RED} />
                <Text style={[pr.statusText, { color: RED }]}>Bị khoá</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Merged: Org Info + Account ── */}
        <FadeSlideIn delay={50}>
          <View style={pr.section}>
            <Text style={pr.sectionLabel}>HỒ SƠ & TÀI KHOẢN</Text>
            <Text style={pr.sectionTitle}>Thông tin của bạn</Text>
            <View style={pr.card}>
              <LinearGradient
                colors={["#1c1c1c", "#0a0a0a"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Phần tổ chức */}
              <SectionDivider label="Tổ chức / Doanh nghiệp" />

              <InfoRow
                icon="business"
                label="Tên tổ chức / Công ty"
                value={displayName}
              />
              <InfoRow
                icon="person"
                label="Người đại diện"
                value={
                  (fullProfile as any)?.representative ||
                  (fullProfile as any)?.representativeName
                }
              />
              <InfoRow
                icon="mail"
                label="Email liên hệ"
                value={(fullProfile as any)?.email || user?.email}
              />
              <InfoRow
                icon="call"
                label="Số điện thoại"
                value={
                  (fullProfile as any)?.phoneNumber ||
                  (fullProfile as any)?.phone
                }
              />
              <InfoRow
                icon="information-circle"
                label="Mô tả"
                value={(fullProfile as any)?.description}
              />

              {/* Phần tài khoản */}
              <SectionDivider label="Tài khoản hệ thống" />

              <InfoRow
                icon="person-circle"
                label="Tên đăng nhập (Username)"
                value={user?.username}
              />
              <InfoRow
                icon="mail"
                label="Email tài khoản"
                value={user?.email}
                isLast
              />
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Logout ── */}
        <FadeSlideIn delay={100}>
          <View style={[pr.section, { marginBottom: 20 }]}>
            <View style={pr.menuCard}>
              <LinearGradient
                colors={["#1c1c1c", "#0a0a0a"]}
                style={StyleSheet.absoluteFill}
              />
              <MenuItem
                icon="log-out"
                label="Đăng xuất tài khoản"
                onPress={handleLogout}
                danger
                chevron={false}
              />
            </View>
          </View>
        </FadeSlideIn>

        <Text style={pr.version}>Webie EMS Organizer v1.2.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const pr = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  hero: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 8,
  },

  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarLetter: { fontSize: 42, color: GOLD, fontWeight: "800" },

  displayName: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  emailText: { fontSize: 14, color: "#888", fontWeight: "500" },
  badgeRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },

  section: { paddingHorizontal: 20, marginTop: 15 },
  sectionLabel: {
    fontSize: 11,
    color: GOLD,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    gap: 14,
    overflow: "hidden",
  },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GOLD + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 3,
    fontWeight: "600",
  },
  infoValue: { fontSize: 15, color: "#eee", fontWeight: "600" },
  infoSep: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 50,
    marginVertical: 2,
  },

  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerLabel: {
    fontSize: 10,
    color: GOLD,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  menuCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#ddd", fontWeight: "600" },
  menuValue: { fontSize: 13, color: "#888" },

  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#333",
    marginTop: 32,
    fontWeight: "600",
  },
});
