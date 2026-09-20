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
import AppHeader from "../../components/common/Appheader";
import SectionHeader from "../../components/common/SectionHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchMyRegistrations } from "../../store/slices/eventSlice";
import { TicketCardSkeleton } from "../../components/common/Skeleton";
import { COLORS } from "../../constants/theme";
import { anhNguon } from "../../utils/image";

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
      statusColor: isExpired ? "#555" : isOngoing ? "#4ade80" : COLORS.primary,
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
      // Sự kiện đã qua mà đơn vẫn chưa được duyệt thì sẽ không bao giờ được
      // duyệt nữa — đừng để nó nằm mãi ở "chờ duyệt" như một việc còn dang dở.
      isPending: !isExpired,
      isExpired,
      isHistory: isExpired,
      statusLabel: isExpired ? "Quá hạn duyệt" : "Chờ duyệt",
      statusColor: isExpired ? "#888" : "#f59e0b",
      statusBg: isExpired
        ? "rgba(255,255,255,0.06)"
        : "rgba(245,158,11,0.1)",
      statusBorder: isExpired
        ? "rgba(255,255,255,0.15)"
        : "rgba(245,158,11,0.25)",
    };
  }
  // Vé bị huỷ (sự kiện bị huỷ, hoặc chủ vé đã xoá tài khoản) — trước đây rơi
  // vào nhánh cuối nên hiện nhầm thành "Từ chối".
  if (s === "CANCELLED") {
    return {
      canEnter: false,
      canPost: false,
      isPending: false,
      isExpired,
      isHistory: true,
      statusLabel: "Đã huỷ",
      statusColor: "#9ca3af",
      statusBg: "rgba(156,163,175,0.12)",
      statusBorder: "rgba(156,163,175,0.25)",
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
      <Ionicons name={icon} size={40} color={COLORS.primary} />
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
        style={{ backgroundColor: COLORS.primary }}
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
          source={anhNguon(item.eventBanner)}
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

        {/* Nhãn trạng thái.
            Trước đây nền dùng meta.statusBg — một màu chỉ 10% độ đục — nên đè
            lên ảnh sáng là chữ tan vào ảnh, không đọc nổi. Nay nền đen đặc,
            còn màu trạng thái giữ ở viền và chữ. */}
        <View
          className="absolute top-3 right-3 flex-row items-center px-2.5 py-1 rounded-2xl"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
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

        {/* Nhãn "Đang chờ duyệt" ở góc trái đã bỏ: nhãn trạng thái góc phải đã
            nói đúng điều đó, và nút ở góc dưới nói lần thứ ba nữa — một thẻ ba
            nhãn giống nhau chỉ làm rối mắt. */}

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
            <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
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
              color={COLORS.primary}
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
                color={meta.canPost ? COLORS.primary : "#888"}
              />
              <Text
                className="text-xs font-bold ml-1.5"
                style={{ color: meta.canPost ? COLORS.primary : "#888" }}
              >
                {meta.canPost ? "Vào Moments" : "Xem lại"}
              </Text>
            </View>
          ) : (
            /* Trước đây nhánh này luôn hiện "Chờ duyệt" màu cam cho mọi vé
               không vào được — kể cả vé đã bị từ chối hay đơn đã quá hạn duyệt.
               Nay lấy thẳng trạng thái thật của vé. */
            <View
              className="flex-row items-center px-3.5 py-2 rounded-2xl"
              style={{
                backgroundColor: meta.statusBg,
                borderWidth: 1,
                borderColor: meta.statusBorder,
              }}
            >
              <Ionicons
                name={meta.isPending ? "hourglass-outline" : "alert-circle-outline"}
                size={14}
                color={meta.statusColor}
              />
              <Text
                className="text-xs font-bold ml-1.5"
                style={{ color: meta.statusColor }}
              >
                {meta.statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
type MomentTabKey = "upcoming" | "pending" | "history";

const MOMENT_TABS: { key: MomentTabKey; label: string }[] = [
  { key: "upcoming", label: "Sắp tới" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "history", label: "Đã kết thúc" },
];

export default function MomentsTabScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s: any) => s.auth);
  const { myRegistrations, isLoading } = useAppSelector((s: any) => s.events);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<MomentTabKey>("upcoming");

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
            Khoảnh <Text style={{ color: COLORS.primary }}>khắc</Text>
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
        {/* Khung chờ giữ nguyên đầu trang và tiêu đề, chỉ phần danh sách là
            khung xám — chuyển sang nội dung thật sẽ êm hơn màn xoay trống. */}
        <AppHeader />
        <SectionHeader white="Khoảnh" gold="khắc" />
        <TicketCardSkeleton />
        <TicketCardSkeleton />
      </SafeAreaView>
    );
  }

  const daKetThuc = (r: any) =>
    new Date() > new Date(r.eventEndDate || r.eventStartDate);

  const upcomingTickets = myRegistrations.filter((r: any) => {
    const s = r.status?.toUpperCase();
    if (s !== "APPROVED" && s !== "CONFIRMED") return false;
    return !daKetThuc(r);
  });

  // Chỉ những đơn còn thật sự chờ được xử lý. Đơn của sự kiện đã qua thì ban tổ
  // chức không còn duyệt nữa, để ở đây chỉ làm người dùng tưởng còn việc treo.
  const pendingTickets = myRegistrations.filter(
    (r: any) => r.status?.toUpperCase() === "PENDING" && !daKetThuc(r),
  );

  const historyTickets = myRegistrations.filter((r: any) => {
    const s = r.status?.toUpperCase();
    // Đơn chờ duyệt đã quá hạn cũng thuộc về đây, kèm nhãn "Quá hạn duyệt"
    if (s === "PENDING") return daKetThuc(r);
    if (s === "APPROVED" || s === "CONFIRMED") return daKetThuc(r);
    return true;
  });
  const tabCounts = {
    upcoming: upcomingTickets.length,
    pending: pendingTickets.length,
    history: historyTickets.length,
  };
  const displayList =
    activeTab === "upcoming"
      ? upcomingTickets
      : activeTab === "pending"
        ? pendingTickets
        : historyTickets;
  // Sắp tới và chờ duyệt: gần nhất lên đầu. Đã kết thúc: mới nhất lên đầu.
  const sortedList = [...displayList].sort((a: any, b: any) =>
    activeTab === "history"
      ? new Date(b.eventStartDate).getTime() -
        new Date(a.eventStartDate).getTime()
      : new Date(a.eventStartDate).getTime() -
        new Date(b.eventStartDate).getTime(),
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      {/* Dùng chung AppHeader với Trang chủ, Sự kiện và Tin tức.
          Trước đây màn này tự vẽ đầu trang riêng nên là màn user duy nhất
          không có chuông thông báo, và avatar thì nhảy thẳng vào Hồ sơ thay vì
          mở menu tài khoản như ba màn kia. */}
      <AppHeader />

      <SectionHeader
        white="Khoảnh"
        gold="khắc"
        count={myRegistrations.length}
      />

      {/* Ba tab bằng nhau: nhãn ở trên, số đếm ở dưới.

          Bản cũ xếp hai pill và một chip trong một hàng justify-between, không
          giới hạn bề rộng — khi chật chỗ chữ bị xén, "Lịch sử" hiện ra thành
          "Lịch" (hai nghĩa khác hẳn nhau). Chia đều flex-1 thì không bao giờ xén.

          Ngoài ra "chờ duyệt" trước đây là một <View> không bấm được nhưng nằm
          cạnh hai pill bấm được và trông y hệt, nên ai cũng tưởng bấm được mà
          chẳng xem được gì. Nay nó là tab thật. */}
      <View
        className="flex-row mx-5 mb-3 rounded-2xl p-1"
        style={{
          backgroundColor: "#111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {MOMENT_TABS.map((t) => {
          const count = tabCounts[t.key];
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              className="flex-1 items-center py-2 rounded-xl"
              style={active ? { backgroundColor: COLORS.primary } : {}}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
            >
              <Text
                numberOfLines={1}
                className="text-xs font-bold"
                style={{ color: active ? "#0a0a0a" : "#888" }}
              >
                {t.label}
              </Text>
              <Text
                className="text-sm font-extrabold mt-0.5"
                style={{
                  color: active ? "#0a0a0a" : count > 0 ? COLORS.primary : "#444",
                }}
              >
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint */}
      {activeTab !== "history" && sortedList.length > 0 && (
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
            color={COLORS.primary}
          />
          <Text className="text-xs flex-1 ml-2" style={{ color: "#888" }}>
            {activeTab === "upcoming"
              ? "Chọn sự kiện để xem và đăng khoảnh khắc của bạn"
              : "Các đơn này đang chờ ban tổ chức duyệt. Được duyệt và check-in tại sự kiện rồi bạn mới đăng khoảnh khắc được."}
          </Text>
        </View>
      )}

      {/* List */}
      {sortedList.length === 0 ? (
        <EmptyState
          icon={
            activeTab === "upcoming"
              ? "calendar-outline"
              : activeTab === "pending"
                ? "hourglass-outline"
                : "time-outline"
          }
          title={
            activeTab === "upcoming"
              ? "Chưa có sự kiện nào để đăng"
              : activeTab === "pending"
                ? "Không có đơn nào chờ duyệt"
                : "Chưa có sự kiện đã kết thúc"
          }
          subtitle={
            activeTab === "upcoming"
              ? "Khoảnh khắc chỉ đăng được ở sự kiện bạn đã đăng ký, được ban tổ chức duyệt và đã check-in tại chỗ."
              : activeTab === "pending"
                ? "Mọi đơn đăng ký của bạn đều đã được xử lý."
                : "Sự kiện đã diễn ra xong sẽ được lưu lại ở đây."
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
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
