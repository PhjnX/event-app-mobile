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
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchMyRegistrations } from "../../store/slices/eventSlice";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const formatDate = (dateString: string) => {
  if (!dateString) return { day: "--", month: "---", full: "", time: "" };
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
    full: date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "CONFIRMED":
      return COLORS.success;
    case "PENDING":
      return COLORS.warning;
    case "REJECTED":
      return COLORS.error;
    default:
      return COLORS.textMuted;
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "CONFIRMED":
      return "Đã duyệt";
    case "PENDING":
      return "Đang chờ";
    case "REJECTED":
      return "Từ chối";
    default:
      return status;
  }
};

export default function MyTicketsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const eventsState = useAppSelector((state) => state.events);
  const myRegistrations = eventsState?.myRegistrations || [];
  const isLoading = eventsState?.isLoading || false;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMyRegistrations());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchMyRegistrations());
    setRefreshing(false);
  }, []);

  // Filter tickets
  const filteredTickets = myRegistrations.filter((t: any) => {
    const endDate = new Date(t.eventEndDate || t.eventStartDate);
    return activeTab === "UPCOMING"
      ? endDate >= new Date()
      : endDate < new Date();
  });

  const activeCount = myRegistrations.filter((t: any) => {
    const endDate = new Date(t.eventEndDate || t.eventStartDate);
    return (
      endDate >= new Date() &&
      (t.status === "APPROVED" || t.status === "CONFIRMED")
    );
  }).length;

  const renderTicketCard = ({ item }: { item: any }) => {
    const dateInfo = formatDate(item.eventStartDate);
    const statusColor = getStatusColor(item.status);
    const isApproved =
      item.status?.toUpperCase() === "APPROVED" ||
      item.status?.toUpperCase() === "CONFIRMED";
    const isExpired =
      new Date() > new Date(item.eventEndDate || item.eventStartDate);

    return (
      <TouchableOpacity
        style={[styles.ticketCard, isExpired && styles.ticketExpired]}
        onPress={() =>
          navigation.navigate("EventDetail", {
            slug: item.eventSlug || item.eventId,
          })
        }
        activeOpacity={0.9}
      >
        {/* Background Image */}
        <Image
          source={{
            uri:
              item.eventBanner ||
              "https://placehold.co/400x200/1a1a1a/666666?text=Event",
          }}
          style={styles.ticketBgImage}
        />
        <View style={styles.ticketOverlay} />

        {/* Content */}
        <View style={styles.ticketContent}>
          {/* Header */}
          <View style={styles.ticketHeader}>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <Text style={styles.ticketId}>#{item.registrationId}</Text>
          </View>

          {/* Event Name */}
          <Text style={styles.ticketTitle} numberOfLines={2}>
            {item.eventName}
          </Text>

          {/* Info */}
          <View style={styles.ticketInfoRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.ticketInfoText}>{dateInfo.time}</Text>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.primary}
              style={{ marginLeft: 12 }}
            />
            <Text style={styles.ticketInfoText} numberOfLines={1}>
              {item.location || "Online"}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerCircle} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerCircle} />
          </View>

          {/* Footer */}
          <View style={styles.ticketFooter}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{dateInfo.day}</Text>
              <Text style={styles.dateMonth}>{dateInfo.month}</Text>
            </View>

            <View style={styles.ticketButtons}>
              {isApproved && item.ticketCode && !isExpired && (
                <TouchableOpacity
                  style={styles.qrButton}
                  onPress={() => {
                    setSelectedTicket(item);
                    setShowQRModal(true);
                  }}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Gold Corners */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </TouchableOpacity>
    );
  };

  // QR Modal
  const renderQRModal = () => (
    <Modal visible={showQRModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalCorner} />

          <Text style={styles.modalTitle}>{selectedTicket?.eventName}</Text>
          <Text style={styles.modalDate}>
            {formatDate(selectedTicket?.eventStartDate).full}
          </Text>

          <View style={styles.qrContainer}>
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket?.ticketCode}&bgcolor=ffffff&color=000000`,
              }}
              style={styles.qrImage}
            />
          </View>

          <View style={styles.ticketCodeBox}>
            <Text style={styles.ticketCodeLabel}>MÃ VÉ</Text>
            <Text style={styles.ticketCode}>{selectedTicket?.ticketCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowQRModal(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vé của tôi</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} vé đang hoạt động
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Đang hoạt động</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: COLORS.textMuted }]}>
            {myRegistrations.length}
          </Text>
          <Text style={styles.statLabel}>Tổng số vé</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {["UPCOMING", "PAST"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "UPCOMING" ? "Sắp tới" : "Đã qua"}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets List */}
      {isLoading && myRegistrations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => `ticket-${item.registrationId}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="ticket-outline"
                size={60}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === "UPCOMING"
                  ? "Chưa có vé sắp tới"
                  : "Chưa có vé đã qua"}
              </Text>
              <TouchableOpacity
                style={styles.findEventButton}
                onPress={() => navigation.navigate("Events")}
              >
                <Text style={styles.findEventText}>Tìm sự kiện</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderQRModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: "rgba(216,201,123,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.1)",
  },
  statItem: { alignItems: "center", paddingHorizontal: 30 },
  statNumber: { color: COLORS.text, fontSize: 32, fontWeight: "bold" },
  statLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  tabsContainer: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20 },
  tab: { marginRight: 24, paddingBottom: 8 },
  tabActive: {},
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: COLORS.text },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20 },

  // Ticket Card
  ticketCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  ticketExpired: { opacity: 0.6 },
  ticketBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  ticketOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  ticketContent: { padding: 16 },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketId: { color: COLORS.textMuted, fontSize: 10 },
  ticketTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  ticketInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketInfoText: { color: COLORS.textSecondary, fontSize: 12, marginLeft: 4 },

  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
    marginHorizontal: -6,
  },

  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBox: {
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  dateDay: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  dateMonth: { color: COLORS.primary, fontSize: 10, fontWeight: "600" },
  ticketButtons: { flexDirection: "row" },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(216,201,123,0.1)",
  },

  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: COLORS.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  findEventButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  findEventText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  modalCorner: {},
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalDate: { color: COLORS.textMuted, fontSize: 12, marginBottom: 20 },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  qrImage: { width: 180, height: 180 },
  ticketCodeBox: {
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    alignItems: "center",
    marginBottom: 20,
  },
  ticketCodeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  ticketCode: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  closeButton: { paddingHorizontal: 40, paddingVertical: 12 },
  closeButtonText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
});
