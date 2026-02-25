import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppSelector } from "../../hooks/useRedux";
import apiService from "../../services/apiService";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundLight: "#1a1a1a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  success: "#22c55e",
  error: "#ef4444",
  cardBorder: "rgba(255,255,255,0.05)",
};

const formatDate = (dateString: string) => {
  if (!dateString) return { full: "TBA", time: "", dayName: "" };
  const date = new Date(dateString);
  return {
    full: date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dayName: date.toLocaleDateString("vi-VN", { weekday: "long" }),
  };
};

const formatTime = (isoTime: string) => {
  if (!isoTime) return "--:--";
  return isoTime.split("T")[1]?.substring(0, 5) || "--:--";
};

export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { slug } = route.params || {};
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // States
  const [event, setEvent] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Activity states
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [registeredActivityIds, setRegisteredActivityIds] = useState<number[]>(
    [],
  );

  // Đã tham gia event hay chưa
  const hasJoinedEvent = registeredActivityIds.length > 0;

  useEffect(() => {
    if (slug) {
      fetchEventData();
    }
  }, [slug, user]);

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy thông tin event
      const eventRes: any = await apiService.get(`/events/${slug}`);
      setEvent(eventRes);

      if (eventRes?.eventId) {
        // 2. Lấy tất cả activities của event
        const actRes: any = await apiService.get(
          `/activities/by-event/${eventRes.eventId}`,
        );
        const sortedActs = Array.isArray(actRes)
          ? actRes.sort(
              (a: any, b: any) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
            )
          : [];
        setActivities(sortedActs);

        // 3. Nếu user đã đăng nhập, lấy activities đã đăng ký
        if (user) {
          try {
            const myRegisteredActs: any = await apiService.get(
              `/activities/by-event/${eventRes.eventId}/registered`,
            );
            if (Array.isArray(myRegisteredActs)) {
              const myRegisteredIds = myRegisteredActs.map(
                (a: any) => a.activityId,
              );
              setRegisteredActivityIds(myRegisteredIds);
            }
          } catch (err) {
            console.log("User chưa tham gia sự kiện này");
            setRegisteredActivityIds([]);
          }
        }
      }
    } catch (error) {
      console.log("Error fetching event:", error);
      Alert.alert("Lỗi", "Không tìm thấy sự kiện");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle chọn activity
  const toggleActivity = (activityId: number, isFull: boolean) => {
    if (registeredActivityIds.includes(activityId)) return;

    if (isFull) {
      Alert.alert("Thông báo", "Hoạt động này đã đầy!");
      return;
    }

    setSelectedActivityIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId],
    );
  };

  // Check activity có đầy không
  const checkIsFull = (act: any) => {
    if (!act.maxAttendees || act.maxAttendees === 0) return false;
    return (act.currentAttendees || 0) >= act.maxAttendees;
  };

  // Đăng ký
  const handleRegister = async () => {
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để đăng ký sự kiện!", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng nhập", onPress: () => navigation.navigate("Auth") },
      ]);
      return;
    }

    if (selectedActivityIds.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một hoạt động!");
      return;
    }

    setIsRegistering(true);
    try {
      if (hasJoinedEvent) {
        await apiService.post(
          `/events/${event.eventId}/add-activities`,
          selectedActivityIds,
        );
        Alert.alert("Thành công", "Đã thêm hoạt động mới!");
      } else {
        await apiService.post("/events/register", {
          eventId: event.eventId,
          activityIds: selectedActivityIds,
        });
        Alert.alert(
          "Thành công",
          "Đăng ký sự kiện thành công! Vui lòng chờ duyệt.",
          [{ text: "OK", onPress: () => navigation.navigate("MyTickets") }],
        );
      }

      setRegisteredActivityIds((prev) => [...prev, ...selectedActivityIds]);
      setSelectedActivityIds([]);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Error
  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={COLORS.textMuted}
          />
          <Text style={styles.errorText}>Không tìm thấy sự kiện</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = formatDate(event.startDate);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri:
                event.bannerImageUrl ||
                "https://placehold.co/600x400/1a1a1a/666666?text=Event",
            }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", COLORS.background]}
            style={styles.heroGradient}
          />

          <SafeAreaView style={styles.heroHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.heroBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <Text style={styles.eventTitle}>{event.eventName}</Text>
            <View style={styles.organizerRow}>
              <Ionicons
                name="business-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.organizerText}>
                {event.organizerName || "EMS"}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.infoLabel}>NGÀY BẮT ĐẦU</Text>
              <Text style={styles.infoValue}>{startDate.full}</Text>
              <Text style={styles.infoSubValue}>
                {startDate.dayName} • {startDate.time}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>ĐỊA ĐIỂM</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {event.location || "Online"}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Card - Nếu đã tham gia */}
        {hasJoinedEvent && (
          <View style={styles.statusCard}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
            <Text style={styles.statusText}>
              Bạn đã đăng ký {registeredActivityIds.length} hoạt động
            </Text>
          </View>
        )}

        {/* Moments Button - Nếu đã tham gia event */}
        {hasJoinedEvent && (
          <TouchableOpacity
            style={styles.momentsButton}
            onPress={() =>
              navigation.navigate("EventMoments", {
                eventId: event.eventId,
                eventName: event.eventName,
              })
            }
          >
            <View style={styles.momentsIconBox}>
              <Ionicons
                name="images-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.momentsContent}>
              <Text style={styles.momentsTitle}>Moments</Text>
              <Text style={styles.momentsSubtitle}>
                Xem & chia sẻ khoảnh khắc
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Hoạt động{" "}
                <Text style={styles.activityCount}>({activities.length})</Text>
              </Text>
              {hasJoinedEvent && (
                <View style={styles.registeredCountBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={COLORS.success}
                  />
                  <Text style={styles.registeredCountText}>
                    {registeredActivityIds.length} đã đăng ký
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              {hasJoinedEvent
                ? "Chọn thêm hoạt động bạn muốn tham gia"
                : "Chọn hoạt động bạn muốn tham gia"}
            </Text>

            {activities.map((activity: any) => {
              const isSelected = selectedActivityIds.includes(
                activity.activityId,
              );
              const isRegistered = registeredActivityIds.includes(
                activity.activityId,
              );
              const isFull = checkIsFull(activity);
              const isUnlimited =
                !activity.maxAttendees || activity.maxAttendees === 0;
              const actTime = formatTime(activity.startTime);
              const actEndTime = formatTime(activity.endTime);

              return (
                <TouchableOpacity
                  key={activity.activityId}
                  style={[
                    styles.activityCard,
                    isSelected && styles.activityCardSelected,
                    isRegistered && styles.activityCardRegistered,
                    isFull && !isRegistered && styles.activityCardFull,
                  ]}
                  onPress={() => toggleActivity(activity.activityId, isFull)}
                  activeOpacity={isRegistered ? 1 : 0.8}
                  disabled={isRegistered}
                >
                  {/* Checkbox / Status Icon */}
                  <View style={styles.activityCheckbox}>
                    {isRegistered ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.success}
                      />
                    ) : isFull ? (
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={COLORS.error}
                      />
                    ) : isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={24}
                        color={COLORS.textMuted}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text
                        style={[
                          styles.activityName,
                          isRegistered && styles.activityNameRegistered,
                        ]}
                        numberOfLines={2}
                      >
                        {activity.activityName}
                      </Text>

                      {isRegistered && (
                        <View style={styles.registeredBadge}>
                          <Text style={styles.registeredBadgeText}>
                            ĐÃ ĐĂNG KÝ
                          </Text>
                        </View>
                      )}

                      {isFull && !isRegistered && (
                        <View style={styles.fullBadge}>
                          <Text style={styles.fullBadgeText}>HẾT CHỖ</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.activityInfoRow}>
                      <View style={styles.activityInfo}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.activityInfoText}>
                          {actTime} - {actEndTime}
                        </Text>
                      </View>

                      <View style={styles.activityInfo}>
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.activityInfoText}>
                          {isUnlimited
                            ? "∞"
                            : `${activity.currentAttendees || 0}/${activity.maxAttendees}`}
                        </Text>
                      </View>
                    </View>

                    {activity.roomOrVenue && (
                      <View style={styles.activityInfo}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.activityInfoText} numberOfLines={1}>
                          {activity.roomOrVenue}
                        </Text>
                      </View>
                    )}

                    {/* Presenter */}
                    {activity.presenter && (
                      <View style={styles.presenterRow}>
                        <Image
                          source={{
                            uri:
                              activity.presenter.avatarUrl ||
                              "https://placehold.co/24x24/1a1a1a/666666?text=P",
                          }}
                          style={styles.presenterAvatar}
                        />
                        <Text style={styles.presenterName} numberOfLines={1}>
                          {activity.presenter.fullName}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom Register Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedLabel}>
            {hasJoinedEvent ? "Đã đăng ký" : "Đã chọn"}
          </Text>
          <Text style={styles.selectedCount}>
            {hasJoinedEvent
              ? `${registeredActivityIds.length} hoạt động`
              : `${selectedActivityIds.length} hoạt động`}
          </Text>
          {selectedActivityIds.length > 0 && (
            <Text style={styles.selectedNew}>
              +{selectedActivityIds.length} mới
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            selectedActivityIds.length === 0 && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={isRegistering || selectedActivityIds.length === 0}
        >
          {isRegistering ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons
                name="ticket-outline"
                size={18}
                color={COLORS.background}
              />
              <Text style={styles.registerButtonText}>
                {hasJoinedEvent ? "THÊM HOẠT ĐỘNG" : "ĐĂNG KÝ NGAY"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: COLORS.textMuted, fontSize: 16, marginTop: 16 },

  header: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero
  heroBanner: { height: 320, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: { position: "absolute", bottom: 20, left: 20, right: 20 },
  eventTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  organizerRow: { flexDirection: "row", alignItems: "center" },
  organizerText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 6 },

  // Info Cards
  infoCards: { padding: 20 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(216,201,123,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  infoSubValue: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  // Status Card
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    marginBottom: 10,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 10,
  },

  // Moments Button
  momentsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    marginBottom: 10,
  },
  momentsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(216,201,123,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  momentsContent: { flex: 1 },
  momentsTitle: { color: COLORS.text, fontSize: 15, fontWeight: "bold" },
  momentsSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  // Section
  section: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 16 },
  activityCount: { color: COLORS.primary },
  registeredCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  registeredCountText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  description: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },

  // Activity Card
  activityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activityCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(216,201,123,0.05)",
  },
  activityCardRegistered: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  activityCardFull: { opacity: 0.6 },
  activityCheckbox: { marginRight: 12, marginTop: 2 },
  activityContent: { flex: 1 },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  activityName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  activityNameRegistered: { color: COLORS.success },
  registeredBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  registeredBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  fullBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fullBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  activityInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  activityInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  activityInfoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  presenterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  presenterAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  presenterName: { color: COLORS.textMuted, fontSize: 11, flex: 1 },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  selectedInfo: {},
  selectedLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  selectedCount: { color: COLORS.text, fontSize: 16, fontWeight: "bold" },
  selectedNew: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerButtonDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.5 },
  registerButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 8,
    letterSpacing: 1,
  },
});
