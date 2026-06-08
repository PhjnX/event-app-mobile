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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchMyRegistrations } from "../../store/slices/eventSlice";

const TAB_BAR_HEIGHT = 80;

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTicketMeta = (
  status: string,
  eventStartDate: string,
  eventEndDate: string,
) => {
  const now = new Date();
  const end = new Date(eventEndDate || eventStartDate);
  const start = new Date(eventStartDate);
  const isExpired = now > end;
  const isOngoing = now >= start && now <= end;
  const s = status?.toUpperCase();

  if (s === "APPROVED" || s === "CONFIRMED") {
    return {
      canEnter: true,
      canPost: !isExpired,
      isPending: false,
      isExpired,
      isHistory: isExpired,
      statusLabel: isExpired
        ? "Đã kết thúc"
        : isOngoing
          ? "Đang diễn ra"
          : "Sắp diễn ra",
      statusColor: isExpired ? "#555" : isOngoing ? "#4ade80" : "#D8C97B",
      statusBg: isExpired
        ? "rgba(255,255,255,0.04)"
        : isOngoing
          ? "rgba(74,222,128,0.1)"
          : "rgba(216,201,123,0.1)",
      statusBorder: isExpired
        ? "rgba(255,255,255,0.08)"
        : isOngoing
          ? "rgba(74,222,128,0.25)"
          : "rgba(216,201,123,0.25)",
    };
  }
  if (s === "CHECKED_IN") {
    return {
      canEnter: true,
      canPost: false,
      isPending: false,
      isExpired,
      isHistory: true,
      statusLabel: "Đã check-in",
      statusColor: "#34d399",
      statusBg: "rgba(52,211,153,0.1)",
      statusBorder: "rgba(52,211,153,0.25)",
    };
  }
  if (s === "PENDING") {
    return {
      canEnter: false,
      canPost: false,
      isPending: true,
      isExpired,
      isHistory: false,
      statusLabel: "Chờ duyệt",
      statusColor: "#f59e0b",
      statusBg: "rgba(245,158,11,0.1)",
      statusBorder: "rgba(245,158,11,0.25)",
    };
  }
  return {
    canEnter: false,
    canPost: false,
    isPending: false,
    isExpired,
    isHistory: true,
    statusLabel: "Từ chối",
    statusColor: "#ef4444",
    statusBg: "rgba(239,68,68,0.1)",
    statusBorder: "rgba(239,68,68,0.25)",
  };
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }: any) => (
  <View className="flex-1 items-center justify-center px-10 pb-20">
    <View
      className="w-22 h-22 rounded-full items-center justify-center mb-6"
      style={{
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "rgba(216,201,123,0.2)",
      }}
    >
      <Ionicons name={icon} size={40} color="#D8C97B" />
    </View>
    <Text className="text-white text-xl font-extrabold mb-2 text-center">
      {title}
    </Text>
    <Text
      className="text-center text-sm leading-5"
      style={{ color: "#555", marginBottom: actionLabel ? 28 : 0 }}
    >
      {subtitle}
    </Text>
    {actionLabel && onAction ? (
      <TouchableOpacity
        onPress={onAction}
        className="px-8 py-4 rounded-3xl"
        style={{ backgroundColor: "#D8C97B" }}
      >
        <Text className="font-extrabold text-sm" style={{ color: "#000" }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── Ticket Card ──────────────────────────────────────────────────────────────
const TicketCard = ({ item, onPress }: { item: any; onPress: () => void }) => {
  const meta = getTicketMeta(
    item.status,
    item.eventStartDate,
    item.eventEndDate,
  );

  return (
    <TouchableOpacity
      activeOpacity={meta.canEnter ? 0.85 : 1}
      onPress={onPress}
      className="mx-5 mb-4 rounded-3xl overflow-hidden"
      style={{ opacity: meta.isPending ? 0.7 : 1 }}
    >
      {/* Banner */}
      <View className="h-36 relative">
        <Image
          source={{
            uri:
              item.eventBanner ||
              "https://placehold.co/400x200/1a1a1a/333?text=Event",
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {meta.isHistory && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(0,0,0,0.35)" },
            ]}
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.92)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 90,
          }}
        />

        {/* Status badge */}
        <View
          className="absolute top-3 right-3 flex-row items-center px-2.5 py-1 rounded-2xl"
          style={{
            backgroundColor: meta.statusBg,
            borderWidth: 1,
            borderColor: meta.statusBorder,
          }}
        >
          <View
            className="w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ backgroundColor: meta.statusColor }}
          />
          <Text
            className="text-xs font-bold"
            style={{ color: meta.statusColor }}
          >
            {meta.statusLabel}
          </Text>
        </View>

        {meta.isPending && (
          <View
            className="absolute top-3 left-3 flex-row items-center px-2.5 py-1 rounded-2xl"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
          >
            <Ionicons name="time-outline" size={10} color="#f59e0b" />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: "#f59e0b" }}
            >
              Đang chờ duyệt
            </Text>
          </View>
        )}

        <View className="absolute bottom-3 left-3.5 right-3.5">
          <Text
            numberOfLines={1}
            className="text-white text-base font-extrabold"
          >
            {item.eventName}
          </Text>
        </View>
      </View>

      {/* Bottom row */}
      <View
        className="flex-row items-center px-4 py-3.5"
        style={{
          backgroundColor: "#111",
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: "rgba(255,255,255,0.06)",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        {/* Left info — flex:1 minWidth:0 để text không đẩy CTA */}
        <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <View className="flex-row items-center mb-1">
            <Ionicons name="calendar-outline" size={12} color="#D8C97B" />
            <Text
              className="text-xs ml-1.5"
              style={{ color: "#888" }}
              numberOfLines={1}
            >
              {formatDate(item.eventStartDate)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons
              name="location-outline"
              size={12}
              color="#D8C97B"
              style={{ flexShrink: 0 }}
            />
            <Text
              className="text-xs ml-1.5"
              style={{ color: "#888", flexShrink: 1 }}
              numberOfLines={1}
            >
              {item.location || "Online"}
            </Text>
          </View>
        </View>

        {/* CTA — flexShrink:0 không bị ép nhỏ */}
        <View style={{ flexShrink: 0 }}>
          {meta.canEnter ? (
            <View
              className="flex-row items-center px-3.5 py-2 rounded-2xl"
              style={{
                backgroundColor: meta.canPost
                  ? "rgba(216,201,123,0.15)"
                  : "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: meta.canPost
                  ? "rgba(216,201,123,0.35)"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <Ionicons
                name={meta.canPost ? "images-outline" : "eye-outline"}
                size={14}
                color={meta.canPost ? "#D8C97B" : "#888"}
              />
              <Text
                className="text-xs font-bold ml-1.5"
                style={{ color: meta.canPost ? "#D8C97B" : "#888" }}
              >
                {meta.canPost ? "Vào Moments" : "Xem lại"}
              </Text>
            </View>
          ) : (
            <View
              className="flex-row items-center px-3.5 py-2 rounded-2xl"
              style={{
                backgroundColor: "rgba(245,158,11,0.08)",
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <Ionicons name="hourglass-outline" size={14} color="#f59e0b" />
              <Text
                className="text-xs font-bold ml-1.5"
                style={{ color: "#f59e0b" }}
              >
                Chờ duyệt
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MomentsTabScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s: any) => s.auth);
  const { myRegistrations, isLoading } = useAppSelector((s: any) => s.events);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming",
  );

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyRegistrations());
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await dispatch(fetchMyRegistrations());
    setRefreshing(false);
  }, [isAuthenticated]);

  const handleCardPress = (item: any) => {
    const meta = getTicketMeta(
      item.status,
      item.eventStartDate,
      item.eventEndDate,
    );
    if (!meta.canEnter) return;
    navigation.navigate("EventMoments", {
      eventId: item.eventId,
      eventName: item.eventName,
      canPost: meta.canPost,
      ticketStatus: item.status,
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "#0a0a0a" }}
        edges={["top"]}
      >
        <View className="px-5 pt-4 pb-3">
          <Text className="text-white text-2xl font-extrabold">
            Khoảnh <Text style={{ color: "#D8C97B" }}>khắc</Text>
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: "#555" }}>
            Chia sẻ khoảnh khắc sự kiện của bạn
          </Text>
        </View>
        <EmptyState
          icon="images-outline"
          title="Bạn chưa đăng nhập"
          subtitle="Đăng nhập để xem và chia sẻ khoảnh khắc từ các sự kiện bạn tham gia."
          actionLabel="Đăng nhập ngay"
          onAction={() =>
            navigation.navigate("Auth", {
              screen: "Welcome",
              params: { targetPage: 1 },
            })
          }
        />
      </SafeAreaView>
    );
  }

  if (isLoading && myRegistrations.length === 0) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "#0a0a0a" }}
        edges={["top"]}
      >
        <View className="px-5 pt-4 pb-3">
          <Text className="text-white text-2xl font-extrabold">
            Khoảnh <Text style={{ color: "#D8C97B" }}>khắc</Text>
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: "#555" }}>
            Đang tải...
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D8C97B" />
        </View>
      </SafeAreaView>
    );
  }

  const upcomingTickets = myRegistrations.filter((r: any) => {
    const s = r.status?.toUpperCase();
    if (s !== "APPROVED" && s !== "CONFIRMED") return false;
    return new Date() <= new Date(r.eventEndDate || r.eventStartDate);
  });

  const historyTickets = myRegistrations.filter((r: any) => {
    const s = r.status?.toUpperCase();
    if (s === "PENDING") return false;
    if (s === "APPROVED" || s === "CONFIRMED")
      return new Date() > new Date(r.eventEndDate || r.eventStartDate);
    return true;
  });

  const pendingTickets = myRegistrations.filter(
    (r: any) => r.status?.toUpperCase() === "PENDING",
  );
  const displayList =
    activeTab === "upcoming" ? upcomingTickets : historyTickets;
  const sortedList = [...displayList].sort((a: any, b: any) =>
    activeTab === "upcoming"
      ? new Date(a.eventStartDate).getTime() -
        new Date(b.eventStartDate).getTime()
      : new Date(b.eventStartDate).getTime() -
        new Date(a.eventStartDate).getTime(),
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View>
          <Text className="text-white text-2xl font-extrabold">
            Khoảnh <Text style={{ color: "#D8C97B" }}>khắc</Text>
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: "#555" }}>
            {myRegistrations.length > 0
              ? `${myRegistrations.length} sự kiện đã đăng ký`
              : "Chia sẻ khoảnh khắc sự kiện"}
          </Text>
        </View>
        {user && (
          <TouchableOpacity
            className="w-10 h-10 rounded-full overflow-hidden"
            style={{ borderWidth: 1.5, borderColor: "#D8C97B" }}
            onPress={() => navigation.navigate("Profile")}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                className="w-full h-full"
              />
            ) : (
              <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: "#1e1c0a" }}
              >
                <Text
                  className="font-extrabold text-base"
                  style={{ color: "#D8C97B" }}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Segment tabs */}
      <View className="flex-row items-center justify-between px-5 mb-3">
        <View
          className="flex-row rounded-2xl p-0.5"
          style={{
            backgroundColor: "#111",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {(["upcoming", "history"] as const).map((tab) => {
            const count =
              tab === "upcoming"
                ? upcomingTickets.length
                : historyTickets.length;
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                className="flex-row items-center px-3.5 py-2 rounded-2xl"
                style={active ? { backgroundColor: "#D8C97B" } : {}}
                onPress={() => setActiveTab(tab)}
              >
                <Ionicons
                  name={
                    tab === "upcoming" ? "calendar-outline" : "time-outline"
                  }
                  size={13}
                  color={active ? "#0a0a0a" : "#555"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? "#0a0a0a" : "#555" }}
                >
                  {tab === "upcoming" ? "Sắp diễn ra" : "Lịch sử"}
                </Text>
                {count > 0 && (
                  <View
                    className="ml-1.5 rounded-full items-center justify-center px-1"
                    style={{
                      minWidth: 18,
                      height: 18,
                      backgroundColor: active
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(216,201,123,0.15)",
                    }}
                  >
                    <Text
                      className="text-xs font-extrabold"
                      style={{ color: active ? "#0a0a0a" : "#D8C97B" }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {pendingTickets.length > 0 && (
          <View
            className="flex-row items-center px-2.5 py-1.5 rounded-2xl"
            style={{
              backgroundColor: "rgba(245,158,11,0.1)",
              borderWidth: 1,
              borderColor: "rgba(245,158,11,0.25)",
            }}
          >
            <Ionicons name="hourglass-outline" size={11} color="#f59e0b" />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: "#f59e0b" }}
            >
              {`${pendingTickets.length} chờ duyệt`}
            </Text>
          </View>
        )}
      </View>

      {/* Hint */}
      {activeTab === "upcoming" && sortedList.length > 0 && (
        <View
          className="flex-row items-center mx-5 mb-3 px-3.5 py-2.5 rounded-2xl"
          style={{
            backgroundColor: "rgba(216,201,123,0.06)",
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.15)",
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={14}
            color="#D8C97B"
          />
          <Text className="text-xs flex-1 ml-2" style={{ color: "#888" }}>
            Chọn sự kiện để xem và đăng khoảnh khắc của bạn
          </Text>
        </View>
      )}

      {/* List */}
      {sortedList.length === 0 ? (
        <EmptyState
          icon={activeTab === "upcoming" ? "calendar-outline" : "time-outline"}
          title={
            activeTab === "upcoming"
              ? "Không có sự kiện sắp tới"
              : "Chưa có lịch sử"
          }
          subtitle={
            activeTab === "upcoming"
              ? "Bạn chưa có vé nào được duyệt cho sự kiện sắp diễn ra."
              : "Các sự kiện đã kết thúc hoặc đã check-in sẽ hiển thị ở đây."
          }
          actionLabel={
            activeTab === "upcoming" ? "Khám phá sự kiện" : undefined
          }
          onAction={
            activeTab === "upcoming"
              ? () => navigation.navigate("Events")
              : undefined
          }
        />
      ) : (
        <FlatList
          data={sortedList}
          renderItem={({ item }) => (
            <TicketCard item={item} onPress={() => handleCardPress(item)} />
          )}
          keyExtractor={(item) => `reg-${item.registrationId}`}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: TAB_BAR_HEIGHT + 16,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D8C97B"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
