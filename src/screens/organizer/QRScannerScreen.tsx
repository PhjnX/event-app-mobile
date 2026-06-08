// OrganizerQRScannerScreen.tsx
// LOGIC: Organizer scans USER's ticket QR for GATE check-in only.
// Activity check-in = user scans organizer's QR (handled in EventDetailScreen).
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  checkInByQR,
  clearCheckInResult,
} from "../../store/slices/organizerSlice";

const GOLD = "#D8C97B";
const GOLD2 = "#B5A65F";
const BG = "#000";
const GREEN = "#22c55e";
const RED = "#f87171";
const { width: SW, height: SH } = Dimensions.get("window");
const FRAME = SW * 0.72;

// ── Animated scan line ─────────────────────────────────────────────────────
function ScanLine({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
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
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  if (!active) return null;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME - 3],
  });
  return (
    <Animated.View style={[sf.line, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={["transparent", GOLD + "cc", GOLD, GOLD + "cc", "transparent"]}
        style={{ height: 2, flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────
function ResultCard({
  result,
  error,
  onScanAgain,
}: {
  result: any;
  error: string | null;
  onScanAgain: () => void;
}) {
  const ok = !!result;
  const color = ok ? GREEN : RED;
  const icon = ok ? "checkmark-circle" : "close-circle";

  return (
    <View style={rc.overlay}>
      <View style={[rc.card, { borderColor: color + "30" }]}>
        {/* Icon */}
        <View style={[rc.iconCircle, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={72} color={color} />
        </View>

        <Text style={[rc.title, { color }]}>
          {ok ? "Check-in thành công!" : "Check-in thất bại"}
        </Text>

        {/* Attendee info */}
        {ok && result?.attendee && (
          <View style={rc.userCard}>
            {result.attendee.avatarUrl ? (
              <Image
                source={{ uri: result.attendee.avatarUrl }}
                style={rc.avatar}
              />
            ) : (
              <View style={[rc.avatar, rc.avatarFb]}>
                <Text style={rc.avatarInitial}>
                  {(result.attendee.username || "?")[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={rc.userName}>{result.attendee.username}</Text>
              <Text style={rc.userEmail} numberOfLines={1}>
                {result.attendee.email}
              </Text>
              <View style={rc.ticketChip}>
                <Ionicons name="ticket-outline" size={11} color="#a78bfa" />
                <Text style={rc.ticketCode}>{result.attendee.ticketCode}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Event */}
        {ok && result?.event && (
          <View style={rc.eventRow}>
            <Ionicons name="calendar-outline" size={14} color="#444" />
            <Text style={rc.eventName} numberOfLines={1}>
              {result.event.eventName}
            </Text>
          </View>
        )}

        {/* Error */}
        {!ok && error && (
          <View style={rc.errBox}>
            <Ionicons name="warning-outline" size={18} color={RED} />
            <Text style={rc.errText}>{error}</Text>
          </View>
        )}

        {/* Scan again */}
        <TouchableOpacity
          style={rc.btn}
          onPress={onScanAgain}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[GOLD, GOLD2]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="scan-outline" size={18} color="#000" />
          <Text style={rc.btnText}>Quét khách tiếp theo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function OrganizerQRScannerScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, eventName } = route.params || {};

  const [perm, requestPerm] = useCameraPermissions();
  const { checkInResult, checkInError, isCheckInLoading } = useAppSelector(
    (s) => s.organizer,
  );

  const [scanned, setScanned] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!perm?.granted) requestPerm();
    return () => {
      dispatch(clearCheckInResult());
    };
  }, []);

  useEffect(() => {
    if (checkInResult || checkInError) setShowResult(true);
  }, [checkInResult, checkInError]);

  const handleScan = async ({ data: ticketCode }: { data: string }) => {
    if (scanned || isCheckInLoading) return;
    setScanned(true);

    // Get location for check-in
    let lat = 0,
      lng = 0;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {}

    // Gate check-in: only ticketCode + location needed
    // activityQrCode is NOT used here — activity check-in is handled by user scanning organizer's QR
    dispatch(checkInByQR({ ticketCode, latitude: lat, longitude: lng } as any));
  };

  const handleScanAgain = () => {
    setScanned(false);
    setShowResult(false);
    dispatch(clearCheckInResult());
  };

  // ── No permission ──
  if (!perm?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={np.wrap}>
          <View style={np.iconWrap}>
            <Ionicons name="camera-outline" size={48} color="#2a2a2a" />
          </View>
          <Text style={np.title}>Cần quyền camera</Text>
          <Text style={np.sub}>Cho phép camera để quét QR vé khách</Text>
          <TouchableOpacity style={np.btn} onPress={requestPerm}>
            <LinearGradient
              colors={[GOLD, GOLD2]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={np.btnText}>Cấp quyền camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: "#444", fontSize: 15 }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={!scanned ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Dark overlay */}
      <View style={ss.overlay} pointerEvents="none" />

      <SafeAreaView style={ss.safeLayer}>
        {/* Top bar */}
        <View style={ss.topBar}>
          <TouchableOpacity
            style={ss.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ss.topTitle}>Check-in Vào Cổng</Text>
            {eventName ? (
              <Text style={ss.topSub} numberOfLines={1}>
                {eventName}
              </Text>
            ) : (
              <Text style={ss.topSub}>Quét vé QR của khách</Text>
            )}
          </View>
        </View>

        {/* Instructions card */}
        {!scanned && !showResult && (
          <View style={ss.instructCard}>
            <LinearGradient
              colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.75)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={ss.instructRow}>
              <View
                style={[
                  ss.instructStep,
                  { borderColor: GOLD + "50", backgroundColor: GOLD + "15" },
                ]}
              >
                <Ionicons name="ticket-outline" size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.instructTitle}>Hướng dẫn check-in cổng</Text>
                <Text style={ss.instructSub}>
                  Yêu cầu khách mở QR vé trong app → Đưa vào khung quét bên dưới
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Scanner frame */}
        <View style={ss.frameArea}>
          <View style={[sf.frame, { width: FRAME, height: FRAME }]}>
            {/* 4 corners */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              {
                bottom: 0,
                right: 0,
                borderBottomWidth: 3,
                borderRightWidth: 3,
              },
            ].map((style, i) => (
              <View key={i} style={[sf.corner, style]} />
            ))}
            <ScanLine active={!scanned} />
          </View>

          {/* Frame label */}
          <View style={ss.frameLabelWrap}>
            <Text style={ss.frameLabel}>
              {scanned && !showResult
                ? "⏳  Đang xác thực vé..."
                : "Đưa mã QR vé vào khung"}
            </Text>
          </View>
        </View>

        {/* Bottom hint */}
        {!scanned && !showResult && (
          <View style={ss.bottomHint}>
            <Ionicons name="pulse-outline" size={16} color={GOLD} />
            <Text style={ss.bottomHintText}>Camera đang sẵn sàng quét</Text>
          </View>
        )}

        {/* Loading */}
        {isCheckInLoading && (
          <View style={ss.loadingOverlay}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={ss.loadingText}>Đang xác nhận check-in...</Text>
          </View>
        )}

        {/* Result */}
        {showResult && (
          <ResultCard
            result={checkInResult}
            error={checkInError}
            onScanAgain={handleScanAgain}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const CORNER = 24;
const sf = StyleSheet.create({
  frame: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: GOLD,
  },
  line: { position: "absolute", left: 8, right: 8, height: 2 },
});

const rc = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#0d0d0d",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  avatar: { width: 52, height: 52, borderRadius: 14 },
  avatarFb: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 22, color: "#444", fontFamily: "Inter_700Bold" },
  userName: { fontSize: 17, color: "#fff", fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 12, color: "#555", marginTop: 2 },
  ticketChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#a78bfa12",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  ticketCode: { fontSize: 11, color: "#a78bfa", fontFamily: "Inter_500Medium" },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  eventName: { fontSize: 13, color: "#555", flex: 1 },
  errBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: RED + "12",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: RED + "30",
  },
  errText: { fontSize: 14, color: RED, flex: 1, lineHeight: 20 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
    overflow: "hidden",
    marginTop: 4,
  },
  btnText: { fontSize: 16, color: "#000", fontFamily: "Inter_700Bold" },
});

const np = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, color: "#fff", fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 44,
    overflow: "hidden",
    marginTop: 6,
  },
  btnText: { fontSize: 16, color: "#000", fontFamily: "Inter_700Bold" },
});

const ss = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  safeLayer: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  topTitle: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold" },
  topSub: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  instructCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD + "25",
    overflow: "hidden",
    marginBottom: 16,
  },
  instructRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  instructStep: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  instructTitle: {
    fontSize: 14,
    color: "#e0e0e0",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  instructSub: { fontSize: 12, color: "#555", lineHeight: 18 },
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  frameLabelWrap: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  frameLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  bottomHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 32,
  },
  bottomHintText: { fontSize: 14, color: GOLD + "88" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  loadingText: { color: GOLD, fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
