import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// Nhớ kiểm tra lại đường dẫn import hooks của bạn
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchMyRegistrations } from "../../store/slices/eventSlice";

const { width } = Dimensions.get("window");

// Giữ lại hàm format vì nó là logic JS thuần
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
      return "#22c55e"; // success
    case "PENDING":
      return "#f59e0b"; // warning
    case "REJECTED":
      return "#ef4444"; // error
    default:
      return "#666666"; // muted
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

  // Lấy state từ Redux (Thay đổi state.auth cho đúng với cấu trúc của bạn)
  const isAuthenticated = useAppSelector(
    (state) => state.auth?.isAuthenticated,
  );
  const eventsState = useAppSelector((state) => state.events);
  const myRegistrations = eventsState?.myRegistrations || [];
  const isLoading = eventsState?.isLoading || false;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Hàm chuyển hướng đến trang Login
  const handleNavigateToLogin = useCallback(() => {
    navigation.navigate("Auth", {
      screen: "Welcome",
      params: { targetPage: 1 },
    });
  }, [navigation]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyRegistrations());
    }
  }, [isAuthenticated, dispatch]);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await dispatch(fetchMyRegistrations());
    setRefreshing(false);
  }, [isAuthenticated, dispatch]);

  // Lọc vé
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

  // Render từng Thẻ vé
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
        className={`mb-4 rounded-[20px] overflow-hidden bg-[#111111] border border-[#D8C97B]/20 ${
          isExpired ? "opacity-60" : ""
        }`}
        onPress={() =>
          navigation.navigate("EventDetail", {
            slug: item.eventSlug || item.eventId,
          })
        }
        activeOpacity={0.9}
      >
        {/* Background Image & Overlay */}
        <Image
          source={{
            uri:
              item.eventBanner ||
              "https://placehold.co/400x200/1a1a1a/666666?text=Event",
          }}
          className="absolute inset-0 w-full h-full opacity-30"
        />
        <View className="absolute inset-0 bg-black/70" />

        {/* Content */}
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full border bg-white/5"
              style={{ borderColor: statusColor }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: statusColor }}
              />
              <Text
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: statusColor }}
              >
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <Text className="text-[#666666] text-[10px]">
              #{item.registrationId}
            </Text>
          </View>

          {/* Event Name */}
          <Text
            className="text-white text-lg font-bold mb-3 uppercase tracking-tight"
            numberOfLines={2}
          >
            {item.eventName}
          </Text>

          {/* Info */}
          <View className="flex-row items-center mb-4">
            <Ionicons name="time-outline" size={14} color="#D8C97B" />
            <Text className="text-[#a0a0a0] text-xs ml-1">{dateInfo.time}</Text>
            <Ionicons
              name="location-outline"
              size={14}
              color="#D8C97B"
              style={{ marginLeft: 12 }}
            />
            <Text
              className="text-[#a0a0a0] text-xs ml-1 flex-1"
              numberOfLines={1}
            >
              {item.location || "Online"}
            </Text>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View className="w-3 h-3 rounded-full bg-[#0a0a0a]" />
            <View className="flex-1 h-0 border-t border-dashed border-[#D8C97B]/30 mx-[-6px]" />
            <View className="w-3 h-3 rounded-full bg-[#0a0a0a]" />
          </View>

          {/* Footer */}
          <View className="flex-row justify-between items-center">
            <View className="bg-[#D8C97B]/10 px-3 py-2 rounded-xl items-center border border-[#D8C97B]/20">
              <Text className="text-white text-xl font-bold">
                {dateInfo.day}
              </Text>
              <Text className="text-[#D8C97B] text-[10px] font-semibold">
                {dateInfo.month}
              </Text>
            </View>

            {isApproved && !!item.ticketCode && !isExpired && (
              <TouchableOpacity
                className="w-11 h-11 rounded-xl border border-[#D8C97B]/30 justify-center items-center bg-[#D8C97B]/10"
                onPress={() => {
                  setSelectedTicket(item);
                  setShowQRModal(true);
                }}
              >
                <Ionicons name="qr-code-outline" size={20} color="#D8C97B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Gold Corners */}
        <View className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8C97B]" />
        <View className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8C97B]" />
        <View className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D8C97B]" />
        <View className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D8C97B]" />
      </TouchableOpacity>
    );
  };

  // Render Modal QR
  const renderQRModal = () => (
    <Modal visible={showQRModal} transparent animationType="fade">
      <View className="flex-1 bg-black/90 justify-center items-center p-5">
        <View className="bg-[#111111] rounded-[24px] p-6 w-full max-w-[320px] items-center border border-[#D8C97B]/20">
          <Text className="text-white text-lg font-bold text-center mb-1">
            {selectedTicket?.eventName}
          </Text>
          <Text className="text-[#666666] text-xs mb-5">
            {formatDate(selectedTicket?.eventStartDate).full}
          </Text>

          <View className="bg-white p-4 rounded-2xl mb-5">
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket?.ticketCode}&bgcolor=ffffff&color=000000`,
              }}
              className="w-[180px] h-[180px]"
            />
          </View>

          <View className="bg-[#D8C97B]/10 px-5 py-3 rounded-xl border border-[#D8C97B]/20 items-center mb-5">
            <Text className="text-[#666666] text-[10px] font-semibold tracking-widest mb-1">
              MÃ VÉ
            </Text>
            <Text className="text-[#D8C97B] text-base font-bold tracking-[2px]">
              {selectedTicket?.ticketCode}
            </Text>
          </View>

          <TouchableOpacity
            className="px-10 py-3"
            onPress={() => setShowQRModal(false)}
          >
            <Text className="text-[#666666] text-sm font-semibold">Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // MÀN HÌNH GUEST (CHƯA ĐĂNG NHẬP)
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-[#0a0a0a]">
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-white text-xl font-bold">Vé của tôi</Text>
          </View>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center px-8 pb-12">
          <Ionicons
            name="lock-closed-outline"
            size={80}
            color="#D8C97B"
            className="opacity-50"
          />
          <Text className="text-white text-[22px] font-bold mt-6 mb-3">
            Bạn chưa đăng nhập
          </Text>
          <Text className="text-[#666666] text-sm text-center leading-[22px] mb-8">
            Vui lòng đăng nhập hoặc tạo tài khoản để quản lý vé sự kiện của bạn.
          </Text>
          <TouchableOpacity
            className="bg-[#D8C97B] px-8 py-3.5 rounded-[24px] shadow-lg shadow-[#D8C97B]/30 elevation-5"
            onPress={handleNavigateToLogin}
          >
            <Text className="text-[#0a0a0a] text-base font-bold">
              Đăng nhập ngay
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH ĐÃ ĐĂNG NHẬP
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 justify-center items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-white text-xl font-bold">Vé của tôi</Text>
          <Text className="text-[#666666] text-xs mt-0.5">
            {activeCount} vé đang hoạt động
          </Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Stats */}
      <View className="flex-row justify-center items-center py-5 mx-5 bg-[#D8C97B]/5 rounded-2xl border border-[#D8C97B]/10">
        <View className="items-center px-8">
          <Text className="text-white text-[32px] font-bold">
            {activeCount}
          </Text>
          <Text className="text-[#D8C97B] text-[10px] font-semibold uppercase tracking-widest mt-1">
            Đang hoạt động
          </Text>
        </View>
        <View className="w-[1px] h-10 bg-white/10" />
        <View className="items-center px-8">
          <Text className="text-[#666666] text-[32px] font-bold">
            {myRegistrations.length}
          </Text>
          <Text className="text-[#D8C97B] text-[10px] font-semibold uppercase tracking-widest mt-1">
            Tổng số vé
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-5 mt-5">
        {["UPCOMING", "PAST"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="mr-6 pb-2 relative"
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              className={`text-sm font-semibold ${activeTab === tab ? "text-white" : "text-[#666666]"}`}
            >
              {tab === "UPCOMING" ? "Sắp tới" : "Đã qua"}
            </Text>
            {activeTab === tab && (
              <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8C97B]" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets List */}
      {isLoading && myRegistrations.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#D8C97B" />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => `ticket-${item.registrationId}`}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D8C97B"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-20">
              <Ionicons name="ticket-outline" size={60} color="#666666" />
              <Text className="text-[#666666] text-base font-semibold mt-4">
                {activeTab === "UPCOMING"
                  ? "Chưa có vé sắp tới"
                  : "Chưa có vé đã qua"}
              </Text>
              <TouchableOpacity
                className="mt-4 px-5 py-2.5 rounded-full border border-[#D8C97B]"
                onPress={() => navigation.navigate("Events")}
              >
                <Text className="text-[#D8C97B] text-[13px] font-semibold">
                  Tìm sự kiện
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderQRModal()}
    </SafeAreaView>
  );
}
