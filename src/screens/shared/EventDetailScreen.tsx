import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Share,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { useAppSelector } from "../../hooks/useRedux";
import apiService from "../../services/apiService";
import {
  registerForEvent,
  addActivitiesToEvent,
} from "../../store/slices/eventSlice";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = 300;

const C = {
  gold: "#D8C97B",
  goldDim: "rgba(216,201,123,0.1)",
  goldBorder: "rgba(216,201,123,0.25)",
  bg: "#0a0a0a",
  card: "#111111",
  cardBorder: "rgba(255,255,255,0.06)",
  white: "#ffffff",
  body: "#bbbbbb",
  muted: "#555555",
  dim: "#333333",
};

const formatDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  return iso.split("T")[1]?.substring(0, 5) ?? "";
};

// Check user role
const getUserRole = (user: any): "guest" | "organizer" | "attendee" => {
  if (!user) return "guest";
  const role = JSON.stringify(user.role || user.roles || "").toUpperCase();
  if (role.includes("ORGANIZER")) return "organizer";
  return "attendee";
};

// ─── Reading progress bar ─────────────────────────────────────────────────────
const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={ss.progressBg}>
    <View style={[ss.progressFill, { width: `${progress * 100}%` }]} />
  </View>
);

// ─── Activity Card ────────────────────────────────────────────────────────────
const ActivityCard = ({
  activity,
  isSelected,
  isRegistered,
  isFull,
  onPressCard,
  userRole,
}: {
  activity: any;
  isSelected: boolean;
  isRegistered: boolean;
  isFull: boolean;
  onPressCard: () => void;
  userRole: "guest" | "organizer" | "attendee";
}) => {
  const disabled = isFull && !isRegistered;

  return (
    <TouchableOpacity
      onPress={onPressCard}
      activeOpacity={0.82}
      style={[
        ss.actCard,
        isSelected && ss.actCardSelected,
        isRegistered && ss.actCardRegistered,
        disabled && ss.actCardFull,
      ]}
    >
      {/* Activity image */}
      {activity.activityImageUrl ? (
        <View style={ss.actImg}>
          <Image
            source={{ uri: activity.activityImageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {disabled && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.55)" },
              ]}
            />
          )}
          {disabled && (
            <View style={ss.fullStamp}>
              <Text style={ss.fullStampText}>ĐẦY</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={{ flex: 1, padding: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: isSelected
                ? "rgba(216,201,123,0.12)"
                : "rgba(255,255,255,0.05)",
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isSelected
                ? "rgba(216,201,123,0.25)"
                : "rgba(255,255,255,0.07)",
            }}
          >
            <Ionicons
              name="time-outline"
              size={11}
              color={isSelected ? C.gold : C.muted}
            />
            <Text
              style={{
                color: isSelected ? C.gold : C.muted,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {formatTime(activity.startTime)}
              {activity.endTime ? ` – ${formatTime(activity.endTime)}` : ""}
            </Text>
          </View>

          {/* Status icon */}
          {isRegistered ? (
            <View style={ss.registeredBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
              <Text style={ss.registeredText}>Đã đăng ký</Text>
            </View>
          ) : isFull ? (
            <View style={ss.fullBadge}>
              <Ionicons name="ban-outline" size={14} color="#ef4444" />
              <Text style={ss.fullText}>Hết chỗ</Text>
            </View>
          ) : userRole === "attendee" ? (
            <View
              style={[
                ss.selectCircle,
                isSelected && { backgroundColor: C.gold, borderColor: C.gold },
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="#000" />
              )}
            </View>
          ) : null}
        </View>

        <Text
          style={[
            ss.actTitle,
            isSelected && { color: C.white },
            isRegistered && { color: "#888" },
            disabled && { color: "#555" },
          ]}
          numberOfLines={2}
        >
          {activity.activityName}
        </Text>

        {/* Info Tags (Room + Spots) */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          {activity.maxAttendees > 0 ? (
            <View style={ss.attendeesTag}>
              <Ionicons name="ticket" size={12} color={C.gold} />
              <Text style={ss.attendeesText}>
                Còn{" "}
                {Math.max(
                  0,
                  activity.maxAttendees - (activity.currentAttendees || 0),
                )}{" "}
                chỗ
              </Text>
            </View>
          ) : (
            <View style={ss.attendeesTag}>
              <Ionicons name="infinite" size={12} color={C.gold} />
              <Text style={ss.attendeesText}>Không giới hạn chỗ</Text>
            </View>
          )}

          {activity.roomOrVenue ? (
            <View
              style={[
                ss.attendeesTag,
                {
                  backgroundColor: "transparent",
                  borderColor: "rgba(255,255,255,0.1)",
                },
              ]}
            >
              <Ionicons name="location-outline" size={12} color={C.muted} />
              <Text
                style={[ss.attendeesText, { color: C.muted }]}
                numberOfLines={1}
              >
                {activity.roomOrVenue}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Presenter */}
        {activity.presenter && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                overflow: "hidden",
                backgroundColor: "#222",
                borderWidth: 1,
                borderColor: C.goldBorder,
              }}
            >
              {activity.presenter.avatarUrl ? (
                <Image
                  source={{ uri: activity.presenter.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: C.gold, fontSize: 12, fontWeight: "700" }}
                numberOfLines={1}
              >
                {activity.presenter.fullName}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Presenter chip ───────────────────────────────────────────────────────────
const PresenterChip = ({ presenter }: { presenter: any }) => (
  <View style={{ alignItems: "center", marginRight: 16, width: 80 }}>
    <View style={ss.presenterAvatar}>
      <Image
        source={{ uri: presenter.avatarUrl || "https://placehold.co/100" }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
    <Text style={ss.presenterName} numberOfLines={2}>
      {presenter.fullName}
    </Text>
    {presenter.title && (
      <Text style={ss.presenterTitle} numberOfLines={1}>
        {presenter.title}
      </Text>
    )}
  </View>
);

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={ss.infoRow}>
    <View style={ss.infoIcon}>
      <Ionicons name={icon} size={16} color={C.gold} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={ss.infoLabel}>{label}</Text>
      <Text style={ss.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const { user } = useAppSelector((s: any) => s.auth);
  const { slug } = route.params || {};

  const userRole = getUserRole(user);

  const [event, setEvent] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [presenters, setPresenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);

  // State quản lý hiển thị Modal chi tiết hoạt động
  const [detailAct, setDetailAct] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);
  const contentHeight = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const evt = await apiService.get<any>(`/events/${slug}`);
        setEvent(evt);

        if (evt.eventId) {
          const acts = await apiService.get<any[]>(
            `/activities/by-event/${evt.eventId}`,
          );
          if (Array.isArray(acts)) {
            const sorted = [...acts].sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
            );
            setActivities(sorted);

            // Collect unique presenters
            const map = new Map<number, any>();
            sorted.forEach((act) => {
              if (act.presenter)
                map.set(act.presenter.presenterId, act.presenter);
            });
            setPresenters(Array.from(map.values()));
          }

          if (user) {
            try {
              const myActs = await apiService.get<any[]>(
                `/activities/by-event/${evt.eventId}/registered`,
              );
              setRegisteredIds(myActs.map((a) => a.activityId || a.id));
            } catch (_) {}
          }
        }
      } catch (e) {
        Toast.show({ type: "error", text1: "Không tìm thấy sự kiện" });
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, user]);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const visible = e.nativeEvent.layoutMeasurement.height;
    const total = contentHeight.current - visible;
    if (total > 0) setScrollProgress(Math.min(y / total, 1));

    // Animate header background
    const headerVal = Math.min(y / HERO_HEIGHT, 1);
    headerAnim.setValue(headerVal);
  }, []);

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.eventName,
        message: `${event.eventName}\nhttps://ems.webie.com.vn/events/${slug}`,
      });
    } catch (_) {}
  }, [event, slug]);

  const checkIsFull = (act: any) => {
    if (!act.maxAttendees || act.maxAttendees === 0) return false;
    return (act.currentAttendees || 0) >= act.maxAttendees;
  };

  // Hàm xử lý khi ấn chọn trong Modal
  const handleModalAction = () => {
    if (!detailAct) return;

    if (userRole === "guest") {
      setDetailAct(null);
      navigation.navigate("Auth", {
        screen: "Welcome",
        params: { targetPage: 1 },
      });
      return;
    }

    const isActSelected = selectedIds.includes(detailAct.activityId);

    if (isActSelected) {
      // Bỏ chọn
      setSelectedIds((prev) =>
        prev.filter((id) => id !== detailAct.activityId),
      );
    } else {
      // Chọn thêm
      setSelectedIds((prev) => [...prev, detailAct.activityId]);
    }
    setDetailAct(null);
  };

  const handleRegister = async () => {
    if (userRole === "guest") {
      navigation.navigate("Auth", {
        screen: "Welcome",
        params: { targetPage: 1 },
      });
      return;
    }
    if (!event || selectedIds.length === 0) {
      Toast.show({
        type: "warning",
        text1: "Chưa chọn hoạt động",
      });
      return;
    }

    setIsRegistering(true);
    try {
      const hasJoined = registeredIds.length > 0;

      if (hasJoined) {
        await dispatch(
          addActivitiesToEvent({
            eventId: event.eventId,
            activityIds: selectedIds,
          }),
        ).unwrap();
        Toast.show({ type: "success", text1: "Thêm hoạt động thành công!" });
      } else {
        await dispatch(
          registerForEvent({
            eventId: event.eventId,
            activityIds: selectedIds,
          }),
        ).unwrap();
        Toast.show({ type: "success", text1: "Đăng ký thành công! 🎉" });
      }

      setRegisteredIds((prev) => [...prev, ...selectedIds]);
      setSelectedIds([]);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Thất bại",
        text2: err || "Vui lòng thử lại.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const hasJoined = registeredIds.length > 0;
  const isButtonDisabled = isRegistering || selectedIds.length === 0;

  // Tính toán trạng thái cho hoạt động đang mở trong Modal
  const isDetailSelected = detailAct
    ? selectedIds.includes(detailAct.activityId)
    : false;
  const isDetailRegistered = detailAct
    ? registeredIds.includes(detailAct.activityId)
    : false;
  const isDetailFull = detailAct ? checkIsFull(detailAct) : false;
  const isModalBtnDisabled =
    userRole === "organizer" ||
    isDetailRegistered ||
    (isDetailFull && !isDetailSelected);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  if (!event) return null;

  const headerBg = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(10,10,10,0)", "rgba(10,10,10,0.98)"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Progress */}
      <ProgressBar progress={scrollProgress} />

      {/* Floating header */}
      <Animated.View style={[ss.floatingHeader, { backgroundColor: headerBg }]}>
        <SafeAreaView edges={["top"]}>
          <View style={ss.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={ss.headerBtn}
            >
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>
            <Text style={ss.headerTitle} numberOfLines={1}>
              {event.eventName}
            </Text>
            <TouchableOpacity onPress={handleShare} style={ss.headerBtn}>
              <Ionicons name="share-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(_, h) => {
          contentHeight.current = h;
        }}
      >
        {/* ── HERO ── */}
        <View style={{ height: HERO_HEIGHT }}>
          <Image
            source={{
              uri: event.bannerImageUrl || "https://placehold.co/600x300",
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)", C.bg]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* ── CONTENT ── */}
        <View style={{ paddingHorizontal: 20, marginTop: -16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <View style={ss.categoryBadge}>
              <Text style={ss.categoryText}>SỰ KIỆN</Text>
            </View>
            {event.status === "PUBLISHED" && (
              <View style={ss.openBadge}>
                <View style={ss.greenDot} />
                <Text style={ss.openText}>Mở đăng ký</Text>
              </View>
            )}
          </View>

          <Text style={ss.eventTitle}>{event.eventName}</Text>

          <View style={ss.infoGrid}>
            {event.startDate && (
              <InfoRow
                icon="calendar-outline"
                label="Ngày tổ chức"
                value={formatDate(event.startDate)}
              />
            )}
            {event.location && (
              <InfoRow
                icon="location-outline"
                label="Địa điểm"
                value={event.location}
              />
            )}
            {event.endDate && (
              <InfoRow
                icon="time-outline"
                label="Kết thúc"
                value={formatDate(event.endDate)}
              />
            )}
          </View>

          {event.description && (
            <View style={ss.descBlock}>
              <View style={ss.descAccent} />
              <Text style={ss.descText}>{event.description}</Text>
            </View>
          )}

          {userRole === "organizer" && (
            <View style={ss.noticeBanner}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#fbbf24"
              />
              <Text style={ss.noticeText}>
                Tài khoản Organizer không thể đăng ký tham dự sự kiện.
              </Text>
            </View>
          )}

          {/* ── ACTIVITIES ── */}
          {activities.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <View style={ss.sectionHeader}>
                <View>
                  <Text style={ss.sectionTitle}>
                    Chương trình <Text style={{ color: C.gold }}>sự kiện</Text>
                  </Text>
                  {userRole === "attendee" && (
                    <Text style={ss.sectionSub}>
                      {hasJoined
                        ? "Chọn thêm hoạt động để tham gia"
                        : "Chọn hoạt động bạn muốn tham gia"}
                    </Text>
                  )}
                </View>
                <View style={ss.countBadge}>
                  <Text style={ss.countText}>{activities.length}</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {activities.map((act) => {
                  const isFull = checkIsFull(act);
                  const isSelected = selectedIds.includes(act.activityId);
                  const isRegistered = registeredIds.includes(act.activityId);
                  return (
                    <ActivityCard
                      key={act.activityId}
                      activity={act}
                      isSelected={isSelected}
                      isRegistered={isRegistered}
                      isFull={isFull}
                      onPressCard={() => setDetailAct(act)} // Mở popup thay vì chọn luôn
                      userRole={userRole}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* ── PRESENTERS ── */}
          {presenters.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <View style={ss.sectionHeader}>
                <Text style={ss.sectionTitle}>
                  Diễn giả <Text style={{ color: C.gold }}>tham dự</Text>
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {presenters.map((p) => (
                  <PresenterChip key={p.presenterId} presenter={p} />
                ))}
              </ScrollView>
            </View>
          )}

          <View
            style={{
              height:
                userRole === "guest" || userRole === "attendee" ? 120 : 40,
            }}
          />
        </View>
      </ScrollView>

      {/* ── STICKY REGISTER BUTTON ── */}
      {userRole === "attendee" && (
        <View style={ss.stickyBar}>
          <View style={ss.stickyInner}>
            <View>
              <Text style={ss.stickyLabel}>
                {selectedIds.length > 0
                  ? `${selectedIds.length} hoạt động đã chọn`
                  : hasJoined
                    ? "Đã tham gia"
                    : "Chưa chọn hoạt động"}
              </Text>
              <Text style={ss.stickyMeta}>
                {hasJoined
                  ? `${registeredIds.length} hoạt động đang đăng ký`
                  : "Nhấn vào hoạt động để chọn"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isButtonDisabled}
              style={[
                ss.registerBtn,
                isButtonDisabled && ss.registerBtnDisabled,
              ]}
              activeOpacity={0.85}
            >
              {isRegistering ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text
                    style={[
                      ss.registerBtnText,
                      isButtonDisabled && { color: "#666" },
                    ]}
                  >
                    {hasJoined ? "Thêm hoạt động" : "Đăng ký ngay"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={isButtonDisabled ? "#666" : "#000"}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {userRole === "guest" && (
        <View style={ss.stickyBar}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Auth", {
                screen: "Welcome",
                params: { targetPage: 1 },
              })
            }
            style={ss.loginCta}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color="#000" />
            <Text style={ss.loginCtaText}>Đăng nhập để đăng ký sự kiện</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── ACTIVITY DETAIL MODAL (BOTTOM SHEET) ── */}
      <Modal
        visible={!!detailAct}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailAct(null)}
      >
        <View style={ss.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setDetailAct(null)}
          />
          <View style={ss.modalContent}>
            {/* Nút tắt */}
            <TouchableOpacity
              style={ss.modalClose}
              onPress={() => setDetailAct(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {detailAct && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {detailAct.activityImageUrl ? (
                  <Image
                    source={{ uri: detailAct.activityImageUrl }}
                    style={ss.modalImg}
                  />
                ) : (
                  <View style={{ height: 24 }} />
                )}

                <View
                  style={{
                    padding: 24,
                    paddingTop: detailAct.activityImageUrl ? 20 : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <View style={ss.modalTag}>
                      <Ionicons name="time" size={14} color={C.gold} />
                      <Text style={ss.modalTagText}>
                        {formatTime(detailAct.startTime)} -{" "}
                        {formatTime(detailAct.endTime)}
                      </Text>
                    </View>
                    <View style={ss.modalTag}>
                      <Ionicons
                        name={
                          detailAct.maxAttendees > 0 ? "ticket" : "infinite"
                        }
                        size={14}
                        color={C.gold}
                      />
                      <Text style={ss.modalTagText}>
                        {detailAct.maxAttendees > 0
                          ? `Còn ${Math.max(0, detailAct.maxAttendees - (detailAct.currentAttendees || 0))} chỗ`
                          : "Không giới hạn"}
                      </Text>
                    </View>
                  </View>

                  <Text style={ss.modalTitle}>{detailAct.activityName}</Text>

                  {detailAct.description ? (
                    <Text style={ss.modalDesc}>{detailAct.description}</Text>
                  ) : null}

                  {detailAct.presenter && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 10,
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            detailAct.presenter.avatarUrl ||
                            "https://placehold.co/100",
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          borderWidth: 1,
                          borderColor: C.goldBorder,
                        }}
                      />
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {detailAct.presenter.fullName}
                        </Text>
                        <Text style={{ color: C.muted, fontSize: 12 }}>
                          {detailAct.presenter.title || "Diễn giả"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* ACTION BUTTON TRONG MODAL */}
            <View style={ss.modalFooter}>
              <TouchableOpacity
                style={[
                  ss.modalBtn,
                  isModalBtnDisabled && ss.modalBtnDisabled,
                  isDetailSelected &&
                    !isDetailRegistered && { backgroundColor: "#fff" }, // Màu trắng khi ở chế độ "Bỏ chọn"
                ]}
                disabled={isModalBtnDisabled}
                onPress={handleModalAction}
              >
                <Text
                  style={[
                    ss.modalBtnText,
                    isModalBtnDisabled && { color: "#888" },
                  ]}
                >
                  {userRole === "guest"
                    ? "Đăng nhập để chọn"
                    : userRole === "organizer"
                      ? "Organizer không thể tham gia"
                      : isDetailRegistered
                        ? "Bạn đã đăng ký hoạt động này"
                        : isDetailSelected
                          ? "Bỏ chọn hoạt động này"
                          : isDetailFull
                            ? "Đã hết chỗ"
                            : "Chọn hoạt động này"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  progressBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 999,
    backgroundColor: "rgba(216,201,123,0.15)",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#D8C97B",
    shadowColor: "#D8C97B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(216,201,123,0.12)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.25)",
  },
  categoryText: {
    color: "#D8C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(74,222,128,0.08)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)",
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  openText: { color: "#4ade80", fontSize: 11, fontWeight: "700" },

  eventTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 20,
  },
  infoGrid: {
    backgroundColor: "#111",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(216,201,123,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: { color: "#ddd", fontSize: 13, fontWeight: "700" },

  descBlock: { flexDirection: "row", gap: 12, marginBottom: 8 },
  descAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#D8C97B",
    alignSelf: "stretch",
  },
  descText: { flex: 1, color: "#999", fontSize: 15, lineHeight: 24 },

  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(251,191,36,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.18)",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  noticeText: { flex: 1, color: "#fbbf24", fontSize: 13, lineHeight: 19 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sectionSub: { color: "#555", fontSize: 12, marginTop: 2 },
  countBadge: {
    backgroundColor: "rgba(216,201,123,0.1)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: { color: "#D8C97B", fontSize: 12, fontWeight: "700" },

  actCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  actCardSelected: {
    borderColor: "rgba(216,201,123,0.5)",
    backgroundColor: "#141400",
  },
  actCardRegistered: { borderColor: "rgba(74,222,128,0.2)", opacity: 0.75 },
  actCardFull: { opacity: 0.55 },
  actImg: { width: "100%", height: 140, backgroundColor: "#1e1e1e" },
  fullStamp: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -36 }, { translateY: -16 }, { rotate: "-12deg" }],
    borderWidth: 3,
    borderColor: "rgba(239,68,68,0.8)",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  fullStampText: {
    color: "rgba(239,68,68,0.9)",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 2,
  },
  actTitle: { color: "#ccc", fontSize: 15, fontWeight: "800", lineHeight: 21 },

  attendeesTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    alignSelf: "flex-start",
  },
  attendeesText: { color: C.gold, fontSize: 11, fontWeight: "700" },

  registeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74,222,128,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  registeredText: { color: "#4ade80", fontSize: 11, fontWeight: "700" },
  fullBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239,68,68,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fullText: { color: "#ef4444", fontSize: 11, fontWeight: "700" },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  presenterAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(216,201,123,0.35)",
    backgroundColor: "#1a1a1a",
  },
  presenterName: {
    color: "#ddd",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 16,
  },
  presenterTitle: {
    color: "#D8C97B",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },

  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickyLabel: { color: "#fff", fontSize: 14, fontWeight: "800" },
  stickyMeta: { color: "#555", fontSize: 12, marginTop: 2 },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D8C97B",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  registerBtnDisabled: { backgroundColor: "#ffffff" },
  registerBtnText: { color: "#000", fontWeight: "900", fontSize: 14 },
  loginCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D8C97B",
    borderRadius: 18,
    paddingVertical: 16,
  },
  loginCtaText: { color: "#000", fontWeight: "900", fontSize: 15 },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 30,
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalImg: {
    width: "100%",
    height: 220,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  modalTagText: { color: C.gold, fontSize: 12, fontWeight: "700" },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
    lineHeight: 30,
  },
  modalDesc: { color: "#999", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  modalBtn: {
    backgroundColor: C.gold,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalBtnDisabled: { backgroundColor: "#222" },
  modalBtnText: { color: "#000", fontSize: 15, fontWeight: "900" },
});
