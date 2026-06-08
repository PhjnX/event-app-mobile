import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchOrganizerNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from "../../store/slices/notificationSlice";

const GOLD = "#D8C97B";
const BG = "#060606";
const CARD = "#0F0F0F";
const BORDER = "rgba(255,255,255,0.08)";
const GREEN = "#22c55e";
const RED = "#ef4444";

const ACTION_TYPES = [
  "ORGANIZER_PENDING",
  "UNLOCK_REQUEST",
  "EVENT_PENDING",
  "EDIT_REQUEST_PENDING",
];

// ─── Format Time ───
const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Vừa xong";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

// ─── Icon Mapping ───
const getIcon = (type: string) => {
  switch (type) {
    case "EDIT_REQUEST_PENDING":
      return {
        name: "document-text",
        color: "#eab308",
        bg: "rgba(234,179,8,0.15)",
      };
    case "EDIT_REQUEST_REJECTED":
      return { name: "alert-circle", color: RED, bg: "rgba(239,68,68,0.15)" };
    case "EVENT_PENDING":
      return {
        name: "calendar",
        color: "#a855f7",
        bg: "rgba(168,85,247,0.15)",
      };
    case "NEW_REGISTRATION":
      return { name: "person-add", color: GREEN, bg: "rgba(34,197,94,0.15)" };
    case "EVENT_APPROVED":
      return {
        name: "checkmark-circle",
        color: GREEN,
        bg: "rgba(34,197,94,0.15)",
      };
    case "EVENT_REJECTED":
      return { name: "close-circle", color: RED, bg: "rgba(239,68,68,0.15)" };
    default:
      return { name: "notifications", color: "#aaa", bg: "#222" };
  }
};

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { items, isLoading, unreadCount } = useAppSelector(
    (s) => s.notifications,
  );

  const [activeTab, setActiveTab] = useState<"ALL" | "ACTION" | "INFO">("ALL");

  useEffect(() => {
    dispatch(fetchOrganizerNotifications());
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeTab === "ACTION")
      result = result.filter((n) => ACTION_TYPES.includes(n.type));
    else if (activeTab === "INFO")
      result = result.filter((n) => !ACTION_TYPES.includes(n.type));
    return result;
  }, [items, activeTab]);

  const handlePress = (notif: Notification) => {
    dispatch(markAsRead(notif.id));
    // Dựa vào type để navigate (bạn thay đổi tên Screen cho khớp với App của bạn)
    if (notif.type.includes("EVENT_") || notif.type.includes("EDIT_")) {
      // navigation.navigate("OrgEvents");
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const { name, color, bg } = getIcon(item.type);
    const reason =
      item.data?.rejectionReason ||
      item.data?.reason ||
      item.data?.editRequestReason;
    const hasReason = reason && reason.trim() !== "";
    const isError = item.type.includes("REJECTED");

    return (
      <TouchableOpacity
        style={[ss.card, !item.read && ss.cardUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[ss.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={name as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={ss.headerRow}>
            <Text
              style={[ss.title, !item.read && { color: "#fff" }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={ss.time}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={ss.msg} numberOfLines={2}>
            {item.message}
          </Text>

          {/* Lý do (nếu có) */}
          {hasReason && (
            <View
              style={[ss.reasonBox, isError ? ss.reasonError : ss.reasonInfo]}
            >
              <Text
                style={[
                  ss.reasonTxt,
                  isError ? { color: RED } : { color: GOLD },
                ]}
              >
                <Text style={{ fontWeight: "800" }}>LÝ DO: </Text>
                {reason}
              </Text>
            </View>
          )}
        </View>
        {!item.read && <View style={ss.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={ss.safe}>
      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={ss.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Thông báo</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => dispatch(markAllAsRead())}>
            <Ionicons name="checkmark-done" size={24} color={GOLD} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={ss.tabRow}>
        {[
          { id: "ALL", label: "Tất cả" },
          { id: "ACTION", label: "Cần xử lý" },
          { id: "INFO", label: "Hệ thống" },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id as any)}
            style={[ss.tab, activeTab === t.id && ss.tabActive]}
          >
            <Text style={[ss.tabTxt, activeTab === t.id && ss.tabTxtActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={ss.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => dispatch(fetchOrganizerNotifications())}
            tintColor={GOLD}
          />
        }
        ListEmptyComponent={
          <View style={ss.empty}>
            <View style={ss.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={32}
                color="#444"
              />
            </View>
            <Text style={ss.emptyTitle}>Chưa có thông báo</Text>
            <Text style={ss.emptySub}>
              Các thông báo về vé, sự kiện và hoạt động sẽ hiện ở đây.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { fontSize: 18, color: "#fff", fontWeight: "700" },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  tabActive: { backgroundColor: GOLD + "20", borderColor: GOLD },
  tabTxt: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTxtActive: { color: GOLD, fontWeight: "800" },

  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardUnread: { backgroundColor: GOLD + "08", borderColor: GOLD + "30" },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#ccc",
    marginRight: 10,
  },
  time: { fontSize: 11, color: "#666", fontWeight: "500", marginTop: 2 },
  msg: { fontSize: 13, color: "#888", lineHeight: 20 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginTop: 4,
    shadowColor: GOLD,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  reasonBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  reasonInfo: { backgroundColor: GOLD + "10", borderColor: GOLD + "30" },
  reasonError: { backgroundColor: RED + "10", borderColor: RED + "30" },
  reasonTxt: { fontSize: 12, fontStyle: "italic" },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: "40%" },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
