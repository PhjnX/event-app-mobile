// OrganizerEventDetailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchEventActivities,
  fetchOrganizerRegistrations,
  fetchActivityQRCode,
  Activity,
  OrganizerEvent,
} from "../../store/slices/organizerSlice";

const GOLD = "#D8C97B";
const GOLD2 = "#B5A65F";
const BG = "#060606";
const CARD = "#0F0F0F";
const CARD2 = "#1A1A1A";
const BORDER = "rgba(255,255,255,0.08)";
const BGOLD = "rgba(216,201,123,0.22)";
const GREEN = "#22c55e";
const BLUE = "#60a5fa";
const RED = "#f87171";
const PURPLE = "#a78bfa";
const { width: SW } = Dimensions.get("window");

const eventStatusCfg = (s: string) =>
  ({
    PENDING_APPROVAL: { label: "Chờ duyệt", color: BLUE },
    DRAFT: { label: "Bản nháp", color: "#888" },
    REJECTED: { label: "Từ chối", color: RED },
    PUBLISHED: { label: "Đã công bố", color: GREEN },
    APPROVED: { label: "Đã duyệt", color: GREEN },
  })[s] || { label: s, color: "#888" };

// ── Activity QR Modal ─────────────────────────────────────────────────────
function ActivityQRModal({
  visible,
  activity,
  qrData,
  isLoading,
  onClose,
}: {
  visible: boolean;
  activity: Activity | null;
  qrData: string | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={qm.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={qm.sheet}>
          <View style={qm.handle} />
          <View style={qm.header}>
            <View style={qm.headerIcon}>
              <Ionicons name="qr-code" size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={qm.headerTitle}>QR Tham Gia Hoạt Động</Text>
              <Text style={qm.headerSub}>
                Giơ màn hình cho khách quét để tham gia
              </Text>
            </View>
            <TouchableOpacity style={qm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {activity && (
            <View style={qm.actRow}>
              <View style={qm.actIcon}>
                <Ionicons name="grid" size={16} color={GOLD} />
              </View>
              <Text style={qm.actName} numberOfLines={2}>
                {activity.activityName}
              </Text>
            </View>
          )}

          <View style={qm.instructBanner}>
            <Ionicons name="phone-portrait-outline" size={18} color={GOLD} />
            <Text style={qm.instructText}>
              Khách mở app → Vào phần{" "}
              <Text style={{ color: GOLD, fontWeight: "700" }}>
                "Hoạt động"
              </Text>{" "}
              → Quét mã này để check-in
            </Text>
          </View>

          <View style={qm.qrArea}>
            {isLoading ? (
              <View style={qm.qrLoading}>
                <ActivityIndicator color={GOLD} size="large" />
                <Text style={qm.qrLoadingText}>Đang tải mã QR...</Text>
              </View>
            ) : qrData ? (
              <View style={qm.qrFrame}>
                <QRCode
                  value={qrData}
                  size={SW * 0.55}
                  color="#000"
                  backgroundColor="#fff"
                />
              </View>
            ) : (
              <View style={qm.qrLoading}>
                <Ionicons name="alert-circle-outline" size={44} color="#555" />
                <Text style={qm.qrLoadingText}>Không thể tải mã QR</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={qm.doneBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={qm.doneTxt}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Activity Card (Redesigned with Image & Guests) ────────────────────────
function ActivityCard({
  activity,
  index,
  onShowQR,
  onViewRegistrations,
}: {
  activity: Activity | any;
  index: number;
  onShowQR: () => void;
  onViewRegistrations: () => void;
}) {
  const color =
    ({ ACTIVE: GREEN, INACTIVE: "#888", UPCOMING: GOLD, ENDED: "#555" } as any)[
      activity.activityStatus || "ACTIVE"
    ] || GOLD;
  const label =
    (
      {
        ACTIVE: "Đang mở",
        INACTIVE: "Đóng",
        UPCOMING: "Sắp mở",
        ENDED: "Kết thúc",
      } as any
    )[activity.activityStatus || "ACTIVE"] || "Hoạt động";

  const isFull =
    activity.capacity != null &&
    (activity.currentRegistrations ?? 0) >= activity.capacity;

  // Đã sửa lại thứ tự ưu tiên lấy URL ảnh: activityImageUrl (chuẩn nhất) -> imageUrl -> bannerImageUrl
  const imgUrl =
    activity.activityImageUrl || activity.imageUrl || activity.bannerImageUrl;
  const hasSpeakers = activity.speakers && activity.speakers.length > 0;

  return (
    <View style={ac.card}>
      {/* Ảnh bìa hoạt động */}
      <View style={ac.imageWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={ac.image} resizeMode="cover" />
        ) : (
          <View style={[ac.image, ac.imagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color="#333" />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(15,15,15,0.6)", CARD]}
          locations={[0.5, 0.9, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Số thứ tự góc trái */}
        <View style={ac.indexBadge}>
          <Text style={ac.indexTxt}>#{index + 1}</Text>
        </View>

        {/* Trạng thái góc phải */}
        <View
          style={[
            ac.statusBadge,
            { backgroundColor: color + "20", borderColor: color + "40" },
          ]}
        >
          <View style={[ac.statusDot, { backgroundColor: color }]} />
          <Text style={[ac.statusTxt, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={ac.content}>
        <Text style={ac.name} numberOfLines={2}>
          {activity.activityName}
        </Text>

        <View style={ac.metaGrid}>
          <View style={ac.metaRow}>
            <Ionicons name="time-outline" size={15} color="#888" />
            <Text style={ac.metaText}>
              {activity.startTime
                ? new Date(activity.startTime).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "Chưa cập nhật giờ"}
            </Text>
          </View>
          {activity.roomOrVenue && (
            <View style={ac.metaRow}>
              <Ionicons name="location-outline" size={15} color="#888" />
              <Text style={ac.metaText} numberOfLines={1}>
                {activity.roomOrVenue}
              </Text>
            </View>
          )}
          {activity.capacity && (
            <View style={ac.metaRow}>
              <Ionicons name="people-outline" size={15} color="#888" />
              <Text
                style={[
                  ac.metaText,
                  isFull && { color: RED, fontWeight: "700" },
                ]}
              >
                {activity.currentRegistrations ?? 0} / {activity.capacity} vé
              </Text>
              {isFull && (
                <View style={ac.fullChip}>
                  <Text style={ac.fullChipTxt}>FULL</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Hiển thị Khách mời / Diễn giả nếu có */}
        {hasSpeakers && (
          <View style={ac.speakersWrap}>
            <Text style={ac.speakerLabel}>KHÁCH MỜI / DIỄN GIẢ:</Text>
            <View style={ac.speakerList}>
              {activity.speakers.map((speaker: any, idx: number) => (
                <View key={idx} style={ac.speakerBadge}>
                  <Ionicons name="person-circle" size={16} color={GOLD} />
                  <Text style={ac.speakerName}>{speaker.name || speaker}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={ac.actions}>
          <TouchableOpacity
            style={ac.qrBtn}
            onPress={onShowQR}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[GOLD, GOLD2]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Ionicons name="qr-code" size={18} color="#000" />
            <Text style={ac.qrBtnTxt}>Mã QR Điểm Danh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ac.listBtn}
            onPress={onViewRegistrations}
            activeOpacity={0.78}
          >
            <Ionicons name="list" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function OrganizerEventDetailScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const event: OrganizerEvent = route.params?.event;
  const { activities, registrations, isActivitiesLoading } = useAppSelector(
    (s) => s.organizer,
  );

  const [qrModal, setQrModal] = useState<{
    visible: boolean;
    activity: Activity | null;
    qrData: string | null;
    isLoading: boolean;
  }>({ visible: false, activity: null, qrData: null, isLoading: false });

  useEffect(() => {
    if (event?.eventId) {
      dispatch(fetchEventActivities(event.eventId));
      dispatch(fetchOrganizerRegistrations(event.eventId));
    }
  }, [event?.eventId]);

  if (!event) return null;

  const { label: statusLabel, color: statusColor } = eventStatusCfg(
    event.status,
  );

  // Logic lấy số lượng Check-in chuẩn
  const checkedIn = registrations.filter(
    (r) => r.eventCheckInStatus === "CHECKED_IN",
  ).length;

  const handleShowQR = async (activity: Activity) => {
    setQrModal({ visible: true, activity, qrData: null, isLoading: true });
    try {
      const result = await dispatch(
        fetchActivityQRCode(activity.activityId),
      ).unwrap();
      setQrModal((prev) => ({
        ...prev,
        qrData: result as string,
        isLoading: false,
      }));
    } catch {
      setQrModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const goToRegs = (activityId?: number, activityName?: string) =>
    navigation.navigate("OrganizerRegistrations", {
      eventId: event.eventId,
      eventName: event.eventName,
      activityId,
      activityName,
    });

  const goToGateCheckIn = () =>
    navigation.navigate("OrganizerQRScanner", {
      eventId: event.eventId,
      eventName: event.eventName,
    });

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      {/* Top Bar */}
      <View style={ss.topBar}>
        <TouchableOpacity
          style={ss.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={ss.topTitle} numberOfLines={1}>
          Chi tiết sự kiện
        </Text>

        {/* Nút scan nhỏ gọn ở góc phải */}
        <TouchableOpacity
          style={ss.scanBtn}
          onPress={goToGateCheckIn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[GOLD + "28", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="scan-outline" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isActivitiesLoading}
            onRefresh={() => {
              dispatch(fetchEventActivities(event.eventId));
              dispatch(fetchOrganizerRegistrations(event.eventId));
            }}
            tintColor={GOLD}
          />
        }
      >
        {/* Banner */}
        <View style={ss.bannerWrap}>
          {event.bannerImageUrl ? (
            <Image
              source={{ uri: event.bannerImageUrl }}
              style={ss.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={[ss.banner, ss.bannerEmpty]}>
              <Ionicons name="image-outline" size={48} color="#222" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(6,6,6,0.8)", BG]}
            style={ss.bannerGrad}
          />

          <View
            style={[
              ss.statusBadge,
              {
                borderColor: statusColor + "40",
                backgroundColor: statusColor + "20",
              },
            ]}
          >
            <View style={[ss.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[ss.statusTxt, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={ss.content}>
          <Text style={ss.eventTitle}>{event.eventName}</Text>

          {/* Meta card */}
          <View style={ss.metaCard}>
            {[
              {
                icon: "location",
                label: "Địa điểm",
                val: event.location || "Chưa cập nhật",
              },
              {
                icon: "calendar",
                label: "Bắt đầu",
                val: new Date(event.startDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              },
              {
                icon: "calendar",
                label: "Kết thúc",
                val: new Date(event.endDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              },
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <View style={ss.metaRow}>
                  <View style={ss.metaIconWrap}>
                    <Ionicons name={item.icon as any} size={16} color={GOLD} />
                  </View>
                  <Text style={ss.metaLabel}>{item.label}</Text>
                  <Text style={ss.metaVal} numberOfLines={2}>
                    {item.val}
                  </Text>
                </View>
                {i < arr.length - 1 && <View style={ss.metaDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Stats Bento */}
          <View style={ss.statsRow}>
            <View style={ss.statCard}>
              <View style={[ss.statIcon, { backgroundColor: PURPLE + "1A" }]}>
                <Ionicons name="people" size={18} color={PURPLE} />
              </View>
              <Text style={[ss.statNum, { color: "#fff" }]}>
                {registrations.length}
              </Text>
              <Text style={ss.statLabel}>Đăng ký</Text>
            </View>
            <View style={ss.statCard}>
              <View style={[ss.statIcon, { backgroundColor: GREEN + "1A" }]}>
                <Ionicons name="checkmark-circle" size={18} color={GREEN} />
              </View>
              <Text style={[ss.statNum, { color: "#fff" }]}>{checkedIn}</Text>
              <Text style={ss.statLabel}>Check-in cổng</Text>
            </View>
            <View style={ss.statCard}>
              <View style={[ss.statIcon, { backgroundColor: GOLD + "1A" }]}>
                <Ionicons name="grid" size={18} color={GOLD} />
              </View>
              <Text style={[ss.statNum, { color: "#fff" }]}>
                {activities.length}
              </Text>
              <Text style={ss.statLabel}>Hoạt động</Text>
            </View>
          </View>

          {/* All registrations Action */}
          <TouchableOpacity
            style={ss.allRegBtn}
            onPress={() => goToRegs()}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={18} color={GOLD} />
            <Text style={ss.allRegTxt}>
              Quản lý danh sách khách tổng ({registrations.length})
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          {/* Activities Section */}
          <View style={ss.sectionHeader}>
            <View style={ss.sectionAccent} />
            <View style={{ flex: 1 }}>
              <Text style={ss.sectionLabel}>LỊCH TRÌNH</Text>
              <Text style={ss.sectionTitle}>Hoạt động sự kiện</Text>
            </View>
          </View>

          {isActivitiesLoading ? (
            <View style={ss.loadingRow}>
              <ActivityIndicator color={GOLD} />
              <Text style={ss.loadingTxt}>Đang tải hoạt động...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={ss.emptyAct}>
              <Ionicons name="calendar-outline" size={40} color="#333" />
              <Text style={ss.emptyTxt}>Sự kiện chưa có hoạt động nào</Text>
            </View>
          ) : (
            activities.map((act, i) => (
              <ActivityCard
                key={act.activityId}
                activity={act}
                index={i}
                onShowQR={() => handleShowQR(act)}
                onViewRegistrations={() =>
                  goToRegs(act.activityId, act.activityName)
                }
              />
            ))
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <ActivityQRModal
        visible={qrModal.visible}
        activity={qrModal.activity}
        qrData={qrModal.qrData}
        isLoading={qrModal.isLoading}
        onClose={() => setQrModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const ac = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  indexTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  statusBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  content: {
    padding: 18,
  },
  name: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 26,
  },
  metaGrid: { gap: 10, marginBottom: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontSize: 14, color: "#aaa", fontWeight: "500", flex: 1 },
  fullChip: {
    backgroundColor: RED + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: RED + "40",
  },
  fullChipTxt: { color: RED, fontSize: 9, fontWeight: "800" },

  speakersWrap: {
    backgroundColor: CARD2,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  speakerLabel: {
    fontSize: 10,
    color: GOLD,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  speakerList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  speakerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#222",
    paddingRight: 10,
    paddingVertical: 4,
    paddingLeft: 4,
    borderRadius: 20,
  },
  speakerName: { color: "#ddd", fontSize: 13, fontWeight: "600" },

  actions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
  },
  qrBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  qrBtnTxt: { fontSize: 14, color: "#000", fontWeight: "800" },
  listBtn: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },
});

const qm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    borderWidth: 1,
    borderColor: BORDER,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#333",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: GOLD + "1A",
    borderWidth: 1,
    borderColor: BGOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 19, color: "#fff", fontWeight: "800" },
  headerSub: { fontSize: 12, color: "#aaa", marginTop: 4, fontWeight: "500" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GOLD + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  actName: { fontSize: 15, color: "#fff", fontWeight: "700", flex: 1 },
  instructBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GOLD + "10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GOLD + "25",
  },
  instructText: { fontSize: 13, color: "#bbb", lineHeight: 20, flex: 1 },
  qrArea: { alignItems: "center", marginBottom: 24 },
  qrFrame: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  qrLoading: { alignItems: "center", padding: 50, gap: 16 },
  qrLoadingText: { fontSize: 14, color: "#777", fontWeight: "500" },
  doneBtn: {
    backgroundColor: "#222",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneTxt: { fontSize: 16, color: "#fff", fontWeight: "700" },
});

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    marginRight: 8,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BGOLD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bannerWrap: { height: 260, position: "relative" },
  banner: { width: "100%", height: "100%", backgroundColor: CARD2 },
  bannerEmpty: { alignItems: "center", justifyContent: "center" },
  bannerGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  content: { padding: 20, paddingTop: 10 },
  eventTitle: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 20,
  },
  metaCard: {
    backgroundColor: CARD2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  metaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: GOLD + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: { fontSize: 13, color: "#888", width: 70, fontWeight: "600" },
  metaVal: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  metaDivider: { height: 1, backgroundColor: BORDER, marginLeft: 48 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  allRegBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 30,
  },
  allRegTxt: { flex: 1, fontSize: 14, color: "#ddd", fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  sectionAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  sectionLabel: {
    fontSize: 11,
    color: GOLD,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  loadingTxt: { fontSize: 14, color: "#888", fontWeight: "500" },
  emptyAct: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 14,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTxt: { fontSize: 15, color: "#777", fontWeight: "600" },
});
