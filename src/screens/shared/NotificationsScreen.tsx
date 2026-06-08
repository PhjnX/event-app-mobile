import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  LocalNotification,
  NOTIF_META,
  timeAgo,
} from "../../services/notificationservice";
import { useNotifications } from "../../context/NotificationContext";

// ─── Notification Item ────────────────────────────────────────────────────────
const NotifItem = ({
  item,
  onPress,
  onDelete,
}: {
  item: LocalNotification;
  onPress: (n: LocalNotification) => void;
  onDelete: (id: string) => void;
}) => {
  const meta = NOTIF_META[item.type] || NOTIF_META.GENERAL;

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.04)",
        backgroundColor: item.read ? "transparent" : "rgba(216,201,123,0.03)",
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: meta.bg,
          borderWidth: 1,
          borderColor: meta.color + "33",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          flexShrink: 0,
        }}
      >
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 3,
          }}
        >
          <Text
            style={{
              color: item.read ? "#aaa" : "#fff",
              fontSize: 14,
              fontWeight: item.read ? "500" : "700",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: "#D8C97B",
                marginLeft: 8,
                flexShrink: 0,
              }}
            />
          )}
        </View>
        <Text
          style={{
            color: "#666",
            fontSize: 13,
            lineHeight: 18,
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={{ color: "#444", fontSize: 11 }}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        style={{ padding: 6, marginLeft: 8, flexShrink: 0 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color="#333" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { refreshBadge } = useNotifications();

  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = useCallback(
    async (notif: LocalNotification) => {
      if (!notif.read) {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        );
        await refreshBadge();
      }
      // Navigate nếu có screen
      if (notif.screen) {
        navigation.navigate(notif.screen, notif.params || {});
      }
    },
    [navigation, refreshBadge],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await refreshBadge();
    },
    [refreshBadge],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await refreshBadge();
  }, [refreshBadge]);

  const handleClearAll = useCallback(() => {
    Alert.alert("Xóa tất cả", "Bạn có chắc muốn xóa tất cả thông báo?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await clearAllNotifications();
          setNotifications([]);
          await refreshBadge();
        },
      },
    ]);
  }, [refreshBadge]);

  const unread = notifications.filter((n) => !n.read).length;

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#0a0a0a" }}
        edges={["top"]}
      >
        <StatusBar barStyle="light-content" />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#D8C97B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#161616",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Thông báo
          </Text>
          {unread > 0 && (
            <Text style={{ color: "#D8C97B", fontSize: 11, marginTop: 1 }}>
              {unread} chưa đọc
            </Text>
          )}
        </View>

        {/* Actions */}
        {notifications.length > 0 && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {unread > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: "rgba(216,201,123,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.25)",
                }}
              >
                <Text
                  style={{ color: "#D8C97B", fontSize: 11, fontWeight: "700" }}
                >
                  Đọc hết
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                backgroundColor: "#161616",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#555" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotifItem
            item={item}
            onPress={handlePress}
            onDelete={handleDelete}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D8C97B"
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingTop: 80,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#111",
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons
                name="notifications-off-outline"
                size={34}
                color="#333"
              />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Chưa có thông báo
            </Text>
            <Text
              style={{
                color: "#555",
                fontSize: 13,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Các thông báo về vé, sự kiện và hoạt động sẽ hiện ở đây.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
