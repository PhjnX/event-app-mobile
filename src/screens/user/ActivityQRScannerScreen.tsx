import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import apiService from "../../services/apiService";
import { fetchMyRegistrations } from "../../store/slices/eventSlice";
import type {
  ActivityItem,
  MyRegistration,
} from "../../store/slices/eventSlice";

// ─── install: npx expo install expo-camera ───────────────────────────────────
//
// API flow:
//   Organizer tạo QR cho mỗi activity → GET /api/activities/{activityId}/qr-code
//   User quét QR tại phòng → POST /api/checkin/activity
//   Body: { ticketCode, activityQrCode, latitude, longitude }
//   Response: string message

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_W * 0.68;

const C = {
  gold: "#D8C97B",
  goldDim: "rgba(216,201,123,0.12)",
  goldBorder: "rgba(216,201,123,0.35)",
  bg: "#0a0a0a",
  success: "#22c55e",
  error: "#ef4444",
};

type ScanState = "scanning" | "loading" | "success" | "error";

// ─── Corner Frame ─────────────────────────────────────────────────────────────
const CornerFrame = ({
  size,
  color = C.gold,
}: {
  size: number;
  color?: string;
}) => {
  const len = size * 0.12;
  const w = 3;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderWidth: 1,
          borderColor: "rgba(216,201,123,0.18)",
          borderRadius: 4,
        }}
      />
      {[
        { top: 0, left: 0, borderTopWidth: w, borderLeftWidth: w },
        { top: 0, right: 0, borderTopWidth: w, borderRightWidth: w },
        { bottom: 0, left: 0, borderBottomWidth: w, borderLeftWidth: w },
        { bottom: 0, right: 0, borderBottomWidth: w, borderRightWidth: w },
      ].map((style, i) => (
        <View
          key={i}
          style={[
            ss.corner,
            { ...style, borderColor: color, width: len, height: len },
          ]}
        />
      ))}
    </View>
  );
};

// ─── Scan Line ────────────────────────────────────────────────────────────────
const ScanLine = ({ size }: { size: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size - 4],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transform: [{ translateY }],
      }}
    >
      <LinearGradient
        colors={["transparent", C.gold, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
};

// ─── Result Card ──────────────────────────────────────────────────────────────
const ResultCard = ({
  state,
  message,
  onRetry,
  onDone,
}: {
  state: "success" | "error";
  message: string;
  onRetry: () => void;
  onDone: () => void;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 160,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isOk = state === "success";

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: "rgba(0,0,0,0.9)",
          justifyContent: "center",
          alignItems: "center",
          opacity: fade,
        },
      ]}
    >
      <Animated.View
        style={{
          width: SCREEN_W - 56,
          backgroundColor: "#111",
          borderRadius: 28,
          padding: 32,
          alignItems: "center",
          borderWidth: 1,
          borderColor: isOk ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.22)",
          transform: [{ scale }],
        }}
      >
        {/* Gold corner accents trên card */}
        {[
          { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
          { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
          { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
          { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
        ].map((style, i) => (
          <View
            key={i}
            style={[
              ss.corner,
              { ...style, borderColor: C.gold, width: 16, height: 16 },
            ]}
          />
        ))}

        {/* Icon vòng tròn */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: isOk
              ? "rgba(34,197,94,0.1)"
              : "rgba(239,68,68,0.1)",
            borderWidth: 1,
            borderColor: isOk ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons
            name={isOk ? "checkmark-circle" : "close-circle"}
            size={38}
            color={isOk ? C.success : C.error}
          />
        </View>

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 10,
            letterSpacing: -0.3,
          }}
        >
          {isOk ? "Check-in thành công!" : "Check-in thất bại"}
        </Text>
        <Text
          style={{
            color: "#666",
            fontSize: 13,
            textAlign: "center",
            lineHeight: 21,
            marginBottom: 28,
          }}
        >
          {message}
        </Text>

        <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
          {!isOk && (
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                backgroundColor: C.goldDim,
                borderWidth: 1,
                borderColor: C.goldBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: C.gold, fontSize: 13, fontWeight: "700" }}>
                Quét lại
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.8}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              backgroundColor: isOk ? C.success : "#1a1a1a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: isOk ? "#000" : "#aaa",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {isOk ? "Hoàn tất" : "Đóng"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Ticket Selector ──────────────────────────────────────────────────────────
const TicketSelector = ({
  tickets,
  onSelect,
  onBack,
}: {
  tickets: MyRegistration[];
  onSelect: (t: MyRegistration) => void;
  onBack: () => void;
}) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 12,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#161616",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text
        style={{
          color: C.gold,
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 2,
        }}
      >
        QUÉT QR CHECK-IN
      </Text>
    </View>

    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
      <Text
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "800",
          marginBottom: 6,
        }}
      >
        Chọn sự kiện
      </Text>
      <Text style={{ color: "#555", fontSize: 13 }}>
        Bạn có {tickets.length} vé đang hoạt động
      </Text>
    </View>

    <ScrollView showsVerticalScrollIndicator={false}>
      {tickets.map((t) => (
        <TouchableOpacity
          key={t.registrationId}
          onPress={() => onSelect(t)}
          activeOpacity={0.82}
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            backgroundColor: "#111",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.18)",
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: C.goldDim,
              borderWidth: 1,
              borderColor: C.goldBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="ticket-outline" size={20} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 3,
              }}
              numberOfLines={1}
            >
              {t.eventName}
            </Text>
            <Text style={{ color: "#555", fontSize: 11 }}>
              Mã vé: {t.ticketCode}
            </Text>
            {t.activities.length > 0 && (
              <Text style={{ color: "#444", fontSize: 11, marginTop: 2 }}>
                {t.activities.length} hoạt động đã đăng ký
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#333" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// ─── Activity Selector ────────────────────────────────────────────────────────
const ActivitySelector = ({
  ticket,
  onSelect,
  onBack,
}: {
  ticket: MyRegistration;
  onSelect: (a: ActivityItem) => void;
  onBack: () => void;
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#161616",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: C.gold,
              fontSize: 10,
              fontWeight: "800",
              letterSpacing: 2,
            }}
          >
            QUÉT QR CHECK-IN
          </Text>
          <Text
            style={{ color: "#555", fontSize: 11, marginTop: 2 }}
            numberOfLines={1}
          >
            {ticket.eventName}
          </Text>
        </View>
      </View>

      <View
        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          Chọn hoạt động
        </Text>
        <Text style={{ color: "#555", fontSize: 13 }}>
          Bạn đã đăng ký {ticket.activities.length} hoạt động trong sự kiện này
        </Text>
      </View>

      {ticket.activities.length === 0 ? (
        // Không có activity nào — hiển thị empty state
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            marginTop: -60,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: C.goldDim,
              borderWidth: 1,
              borderColor: C.goldBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="calendar-outline" size={32} color={C.gold} />
          </View>
          <Text
            style={{
              color: "#fff",
              fontSize: 17,
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Không có hoạt động
          </Text>
          <Text
            style={{
              color: "#555",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Không tìm thấy hoạt động nào bạn đã đăng ký trong sự kiện này.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {ticket.activities.map((act) => {
            const startTime = formatTime(act.startTime);
            const endTime = formatTime(act.endTime);
            const timeLabel =
              startTime && endTime
                ? `${startTime} – ${endTime}`
                : startTime
                  ? startTime
                  : null;

            return (
              <TouchableOpacity
                key={act.activityId}
                onPress={() => onSelect(act)}
                activeOpacity={0.82}
                style={{
                  marginHorizontal: 20,
                  marginBottom: 12,
                  backgroundColor: "#111",
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.18)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: C.goldDim,
                    borderWidth: 1,
                    borderColor: C.goldBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="bookmark-outline" size={20} color={C.gold} />
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                    numberOfLines={2}
                  >
                    {act.activityName}
                  </Text>
                  {timeLabel && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="time-outline" size={11} color="#555" />
                      <Text style={{ color: "#555", fontSize: 11 }}>
                        {timeLabel}
                      </Text>
                    </View>
                  )}
                  {act.location && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={11}
                        color="#555"
                      />
                      <Text
                        style={{ color: "#555", fontSize: 11 }}
                        numberOfLines={1}
                      >
                        {act.location}
                      </Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={16} color="#333" />
              </TouchableOpacity>
            );
          })}
          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ActivityQRScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const [permission, requestPermission] = useCameraPermissions();

  // ticketCode pass từ MyTickets (optional)
  const routeTicketCode: string | undefined = route.params?.ticketCode;

  const myRegistrations: MyRegistration[] = useAppSelector(
    (s: any) => s.events?.myRegistrations || [],
  );
  const isLoadingRegistrations: boolean = useAppSelector(
    (s: any) => s.events?.isLoading ?? false,
  );

  // Luôn fetch mới khi mở màn hình để tránh stale/chưa load kịp
  useEffect(() => {
    dispatch(fetchMyRegistrations());
  }, []);

  // Lọc vé hợp lệ: đã duyệt + sự kiện chưa kết thúc + có ticketCode
  const activeTickets = myRegistrations.filter((t) => {
    const ok =
      t.status?.toUpperCase() === "APPROVED" ||
      t.status?.toUpperCase() === "CONFIRMED";
    const live =
      new Date() <= new Date(t.eventEndDate || t.eventStartDate || "");
    return ok && live && !!t.ticketCode;
  });

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedTicket, setSelectedTicket] = useState<MyRegistration | null>(
    () => {
      if (routeTicketCode) {
        return (
          activeTickets.find((t) => t.ticketCode === routeTicketCode) ??
          activeTickets[0] ??
          null
        );
      }
      // Auto-select nếu chỉ có đúng 1 vé
      return activeTickets.length === 1 ? activeTickets[0] : null;
    },
  );

  // Auto-select activity nếu ticket đó chỉ có đúng 1 activity
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    () => {
      const ticket = routeTicketCode
        ? (activeTickets.find((t) => t.ticketCode === routeTicketCode) ??
          activeTickets[0] ??
          null)
        : activeTickets.length === 1
          ? activeTickets[0]
          : null;
      return ticket?.activities.length === 1 ? ticket.activities[0] : null;
    },
  );

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [resultMsg, setResultMsg] = useState("");
  const [torch, setTorch] = useState(false);

  const processing = useRef(false);
  const lastQr = useRef("");

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Khi chọn ticket mới → reset activity (trừ khi ticket đó chỉ có 1 activity)
  const handleSelectTicket = (ticket: MyRegistration) => {
    setSelectedTicket(ticket);
    setSelectedActivity(
      ticket.activities.length === 1 ? ticket.activities[0] : null,
    );
  };

  // Khi tap badge activity ở màn camera → quay về chọn activity
  const handleChangeActivity = () => {
    processing.current = false;
    lastQr.current = "";
    setScanState("scanning");
    setResultMsg("");
    setSelectedActivity(null);
  };

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (
        processing.current ||
        data === lastQr.current ||
        !selectedTicket?.ticketCode ||
        !selectedActivity
      )
        return;
      processing.current = true;
      lastQr.current = data;
      Vibration.vibrate(80);
      setScanState("loading");

      try {
        const res: any = await apiService.post("/checkin/activity", {
          ticketCode: selectedTicket.ticketCode,
          activityQrCode: data,
          latitude: 0,
          longitude: 0,
        });
        setResultMsg(
          typeof res === "string"
            ? res
            : res?.message || "Đã ghi nhận tham gia hoạt động.",
        );
        setScanState("success");
      } catch (err: any) {
        setResultMsg(
          err?.response?.data?.message ||
            (typeof err?.response?.data === "string"
              ? err.response.data
              : null) ||
            "Mã QR không hợp lệ, đã sử dụng, hoặc bạn chưa đăng ký hoạt động này.",
        );
        setScanState("error");
      }
    },
    [selectedTicket, selectedActivity],
  );

  const handleRetry = () => {
    processing.current = false;
    lastQr.current = "";
    setScanState("scanning");
    setResultMsg("");
  };

  // ── Render: No permission ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            margin: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#161616",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            marginTop: -60,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: C.goldDim,
              borderWidth: 1,
              borderColor: C.goldBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Ionicons name="camera-outline" size={36} color={C.gold} />
          </View>
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Cần quyền Camera
          </Text>
          <Text
            style={{
              color: "#555",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            Ứng dụng cần quyền camera để quét mã QR check-in hoạt động.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            activeOpacity={0.85}
            style={{
              backgroundColor: C.gold,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>
              Cấp quyền Camera
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Loading registrations ───────────────────────────────────────
  if (isLoadingRegistrations && myRegistrations.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            margin: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#161616",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -60,
            gap: 16,
          }}
        >
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={{ color: "#555", fontSize: 13 }}>
            Đang tải vé của bạn...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: No active tickets ─────────────────────────────────────────────
  if (activeTickets.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            margin: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#161616",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            marginTop: -60,
          }}
        >
          <Ionicons name="ticket-outline" size={60} color="#333" />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "800",
              marginTop: 20,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Không có vé hợp lệ
          </Text>
          <Text
            style={{
              color: "#555",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 28,
            }}
          >
            Bạn chưa có vé được duyệt hoặc tất cả sự kiện đã kết thúc.
          </Text>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
              navigation.navigate("UserMain", { screen: "Events" });
            }}
            style={{
              borderWidth: 1,
              borderColor: C.goldBorder,
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: C.gold, fontSize: 13, fontWeight: "700" }}>
              Tìm sự kiện
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Ticket selector (nhiều vé, chưa chọn) ─────────────────────────
  if (!selectedTicket) {
    return (
      <TicketSelector
        tickets={activeTickets}
        onSelect={handleSelectTicket}
        onBack={() => navigation.goBack()}
      />
    );
  }

  // ── Render: Activity selector (chưa chọn activity) ────────────────────────
  if (!selectedActivity) {
    return (
      <ActivitySelector
        ticket={selectedTicket}
        onSelect={setSelectedActivity}
        onBack={() => {
          // Nếu chỉ có 1 vé → goBack ra ngoài hẳn
          // Nếu nhiều vé → quay về ticket selector
          if (activeTickets.length > 1) {
            setSelectedTicket(null);
          } else {
            navigation.goBack();
          }
        }}
      />
    );
  }

  // ── Render: Camera scan ───────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          scanState === "scanning" ? handleBarCodeScanned : undefined
        }
      />

      {/* Dimmed mask */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View
          style={{
            height: (SCREEN_H - FRAME_SIZE) / 2.4,
            backgroundColor: "rgba(0,0,0,0.75)",
          }}
        />
        <View style={{ flexDirection: "row", height: FRAME_SIZE }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }} />
          <View style={{ width: FRAME_SIZE }} />
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }} />
        </View>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.55)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              Quét QR Check-in
            </Text>
            <Text
              style={{
                color: C.gold,
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 1.5,
                marginTop: 1,
              }}
            >
              HOẠT ĐỘNG
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setTorch((v) => !v)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: torch ? C.goldDim : "rgba(0,0,0,0.55)",
              borderWidth: 1,
              borderColor: torch ? C.goldBorder : "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={torch ? "flash" : "flash-outline"}
              size={18}
              color={torch ? C.gold : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Frame */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -16,
          }}
        >
          {scanState === "loading" ? (
            <View
              style={{
                width: FRAME_SIZE,
                height: FRAME_SIZE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CornerFrame size={FRAME_SIZE} />
              <View style={{ position: "absolute", alignItems: "center" }}>
                <ActivityIndicator size="large" color={C.gold} />
                <Text
                  style={{
                    color: C.gold,
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 12,
                  }}
                >
                  Đang xác thực...
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }}>
              <CornerFrame size={FRAME_SIZE} />
              {scanState === "scanning" && <ScanLine size={FRAME_SIZE} />}
            </View>
          )}
        </View>

        {/* Bottom info */}
        <View
          style={{
            paddingHorizontal: 28,
            paddingBottom: 44,
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Activity badge — tap để đổi activity */}
          <TouchableOpacity
            onPress={handleChangeActivity}
            activeOpacity={0.75}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.goldDim,
              borderWidth: 1,
              borderColor: C.goldBorder,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 8,
            }}
          >
            <Ionicons name="bookmark-outline" size={13} color={C.gold} />
            <Text
              style={{
                color: C.gold,
                fontSize: 12,
                fontWeight: "700",
                maxWidth: SCREEN_W - 140,
              }}
              numberOfLines={1}
            >
              {selectedActivity.activityName}
            </Text>
            <Ionicons name="chevron-down" size={12} color={C.gold} />
          </TouchableOpacity>

          {/* Event badge — tap để đổi ticket (nếu nhiều vé) */}
          <TouchableOpacity
            onPress={() => {
              if (activeTickets.length > 1) {
                setSelectedTicket(null);
                setSelectedActivity(null);
              }
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
            activeOpacity={activeTickets.length > 1 ? 0.7 : 1}
          >
            <Ionicons name="ticket-outline" size={11} color="#555" />
            <Text
              style={{
                color: "#555",
                fontSize: 11,
                maxWidth: SCREEN_W - 100,
              }}
              numberOfLines={1}
            >
              {selectedTicket.eventName}
            </Text>
            {activeTickets.length > 1 && (
              <Ionicons name="chevron-down" size={10} color="#555" />
            )}
          </TouchableOpacity>

          {/* Hint */}
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.65)",
              borderWidth: 1,
              borderColor: "rgba(216,201,123,0.15)",
              borderRadius: 16,
              paddingHorizontal: 18,
              paddingVertical: 12,
              alignItems: "center",
              gap: 4,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: scanState === "scanning" ? C.gold : "#555",
                }}
              />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                {scanState === "scanning"
                  ? "Hướng camera vào mã QR hoạt động"
                  : "Đang xử lý..."}
              </Text>
            </View>
            <Text
              style={{
                color: "#555",
                fontSize: 11,
                textAlign: "center",
                lineHeight: 15,
              }}
            >
              Mã QR được đặt tại địa điểm từng hoạt động
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Result overlay */}
      {(scanState === "success" || scanState === "error") && (
        <ResultCard
          state={scanState}
          message={resultMsg}
          onRetry={handleRetry}
          onDone={() => navigation.goBack()}
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  corner: { position: "absolute", borderRadius: 2 },
});
