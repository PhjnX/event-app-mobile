// screens/user/RegisterOrganizerScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { registerOrganizer } from "../../store/slices/organizerSlice";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  gold: "#D8C97B",
  goldDim: "rgba(216,201,123,0.10)",
  goldBorder: "rgba(216,201,123,0.22)",
  bg: "#060606",
  surface: "#0f0f0f",
  surfaceHigh: "#161616",
  border: "rgba(255,255,255,0.08)",
  borderFocus: "rgba(216,201,123,0.5)",
  textPrimary: "#f0f0f0",
  textSecondary: "#777",
  textMuted: "#3a3a3a",
};

// ─── Animated Field ───────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: any;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = "sentences",
  required = false,
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.borderFocus],
  });
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.surface, "#131208"],
  });

  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {required && <Text style={f.required}>*</Text>}
      </View>
      <Animated.View style={[f.box, { borderColor, backgroundColor: bgColor }]}>
        <View style={f.iconWrap}>
          <Ionicons
            name={icon}
            size={16}
            color={focused ? C.gold : C.textSecondary}
          />
        </View>
        <TextInput
          style={[
            f.input,
            multiline && {
              minHeight: 80,
              textAlignVertical: "top",
              paddingTop: 14,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          autoCapitalize={autoCapitalize}
          selectionColor={C.gold}
        />
      </Animated.View>
    </View>
  );
};

const f = StyleSheet.create({
  wrap: { marginBottom: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  required: { color: C.gold, fontSize: 12, marginLeft: 3, fontWeight: "700" },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  iconWrap: { marginRight: 10 },
  input: { flex: 1, color: C.textPrimary, fontSize: 15, paddingVertical: 14 },
});

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}> = ({ title, icon }) => (
  <View style={sh.row}>
    <View style={sh.iconBox}>
      <Ionicons name={icon} size={14} color={C.gold} />
    </View>
    <Text style={sh.title}>{title}</Text>
    <View style={sh.line} />
  </View>
);

const sh = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: C.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  line: { flex: 1, height: 1, backgroundColor: C.border, marginLeft: 12 },
});

// ─── Success View ─────────────────────────────────────────────────────────────
const SuccessView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 160,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[sv.wrap, { opacity: fade }]}>
      <View style={sv.ring1} />
      <View style={sv.ring2} />
      <Animated.View style={[sv.iconCircle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={44} color={C.bg} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: slideY }] }}>
        <Text style={sv.title}>Đã gửi thành công!</Text>
        <Text style={sv.desc}>
          Chúng tôi đã nhận được đơn của bạn.{"\n"}
          Đội ngũ EMS sẽ phản hồi trong{" "}
          <Text style={{ color: C.gold }}>1–3 ngày làm việc</Text>.
        </Text>
        <View style={sv.badge}>
          <Ionicons
            name="time-outline"
            size={13}
            color={C.gold}
            style={{ marginRight: 6 }}
          />
          <Text style={sv.badgeText}>Đang chờ xét duyệt</Text>
        </View>
        <TouchableOpacity style={sv.btn} onPress={onClose} activeOpacity={0.85}>
          <Ionicons
            name="home-outline"
            size={15}
            color={C.bg}
            style={{ marginRight: 8 }}
          />
          <Text style={sv.btnText}>Về trang chính</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const sv = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ring1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  ring2: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.07)",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "center",
    marginBottom: 32,
  },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: "700" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 32,
  },
  btnText: { color: C.bg, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
});

// ─── Auth Prompt ──────────────────────────────────────────────────────────────
const AuthPrompt: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <View style={ap.wrap}>
    <View style={ap.left}>
      <Ionicons name="shield-checkmark-outline" size={22} color={C.gold} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={ap.title}>Yêu cầu đăng nhập</Text>
      <Text style={ap.sub}>Đăng nhập để gửi đơn đăng ký</Text>
    </View>
    <TouchableOpacity style={ap.btn} onPress={onLogin} activeOpacity={0.8}>
      <Text style={ap.btnText}>Đăng nhập</Text>
      <Ionicons name="chevron-forward" size={13} color={C.bg} />
    </TouchableOpacity>
  </View>
);

const ap = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  left: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(216,201,123,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { color: C.textPrimary, fontSize: 13, fontWeight: "700" },
  sub: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  btnText: { color: C.bg, fontSize: 11, fontWeight: "800" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RegisterOrganizerScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAppSelector((s: any) => s.auth);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    orgName: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        name: user.fullName || user.username || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      }));
    }
  }, [isAuthenticated, user]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Auth", {
        screen: "Welcome",
        params: { targetPage: 1 },
      });
      return;
    }
    const { name, email, phone, orgName, message } = form;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ họ tên, email và số điện thoại.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      // ✅ Field names khớp với web (representative, email, phoneNumber)
      await dispatch(
        registerOrganizer({
          name: orgName.trim() || name.trim(),
          representative: name.trim(),
          email: email.trim(),
          phoneNumber: phone.trim(),
          description: message.trim() || undefined,
        }),
      ).unwrap();
      setIsSuccess(true);
    } catch (err: any) {
      // ✅ unwrap() throw string vì rejectWithValue trả về string
      const msg =
        typeof err === "string" ? err : err?.message || "Vui lòng thử lại sau.";
      Alert.alert("Gửi thất bại", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("UserMain");
  };

  return (
    <View style={ss.root}>
      {/* Ambient glows */}
      <View style={ss.glowTop} />
      <View style={ss.glowBottom} />

      {/* ── Header ── */}
      <Animated.View
        style={[ss.header, { paddingTop: insets.top + 8, opacity: headerFade }]}
      >
        <TouchableOpacity
          style={ss.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={ss.headerCenter}>
          <Text style={ss.headerTitle}>Đăng ký Organizer</Text>
        </View>
        <View style={ss.stepChip}>
          <Text style={ss.stepText}>EMS</Text>
        </View>
      </Animated.View>

      {/* ── Body ── */}
      {isSuccess ? (
        <SuccessView onClose={handleGoBack} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              ss.scroll,
              { paddingBottom: insets.bottom + 32 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{ transform: [{ translateY: contentSlide }] }}
            >
              {/* Hero */}
              <View style={ss.hero}>
                <View style={ss.heroBadge}>
                  <Ionicons
                    name="briefcase-outline"
                    size={12}
                    color={C.gold}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={ss.heroBadgeText}>EVENT MANAGEMENT SYSTEM</Text>
                </View>
                <Text style={ss.heroTitle}>
                  Trở thành{"\n"}
                  <Text style={ss.heroTitleGold}>Nhà tổ chức</Text>
                </Text>
                <Text style={ss.heroDesc}>
                  Điền thông tin và đội ngũ EMS sẽ liên hệ bạn trong 1–3 ngày
                  làm việc.
                </Text>
              </View>

              {/* Stats */}
              <View style={ss.statsRow}>
                {[
                  { val: "500+", label: "Sự kiện" },
                  { val: "50K+", label: "Người dùng" },
                  { val: "98%", label: "Hài lòng" },
                ].map((s, i) => (
                  <View
                    key={i}
                    style={[
                      ss.statItem,
                      i < 2 && {
                        borderRightWidth: 1,
                        borderRightColor: C.border,
                      },
                    ]}
                  >
                    <Text style={ss.statVal}>{s.val}</Text>
                    <Text style={ss.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Auth prompt */}
              {!isAuthenticated && (
                <AuthPrompt
                  onLogin={() =>
                    navigation.navigate("Auth", {
                      screen: "Welcome",
                      params: { targetPage: 1 },
                    })
                  }
                />
              )}

              {/* Form card */}
              <View style={ss.card}>
                <SectionHeader
                  title="Thông tin cá nhân"
                  icon="person-outline"
                />
                <Field
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChangeText={set("name")}
                  icon="person-outline"
                  required
                />
                <Field
                  label="Số điện thoại"
                  placeholder="+84 9xx xxx xxx"
                  value={form.phone}
                  onChangeText={set("phone")}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  required
                />
                <Field
                  label="Email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChangeText={set("email")}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />

                <View style={ss.divider} />

                <SectionHeader
                  title="Thông tin tổ chức"
                  icon="business-outline"
                />
                <Field
                  label="Tên tổ chức / công ty"
                  placeholder="Không bắt buộc"
                  value={form.orgName}
                  onChangeText={set("orgName")}
                  icon="business-outline"
                />
                <Field
                  label="Giới thiệu & kinh nghiệm"
                  placeholder="Chia sẻ thêm về bạn hoặc tổ chức..."
                  value={form.message}
                  onChangeText={set("message")}
                  icon="document-text-outline"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Contact strip */}
              <View style={ss.contactCard}>
                <Text style={ss.contactTitle}>Liên hệ trực tiếp</Text>
                {[
                  { icon: "call-outline" as const, text: "+84 969 838 467" },
                  {
                    icon: "mail-outline" as const,
                    text: "Huyen.dang@webie.com.vn",
                  },
                  {
                    icon: "location-outline" as const,
                    text: "Tầng 6, 68 Nguyễn Huệ, Q.1, TP.HCM",
                  },
                ].map((item, i) => (
                  <View key={i} style={ss.contactRow}>
                    <View style={ss.contactIcon}>
                      <Ionicons name={item.icon} size={13} color={C.gold} />
                    </View>
                    <Text style={ss.contactText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[ss.submitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                activeOpacity={0.88}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={C.bg} />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane"
                      size={16}
                      color={C.bg}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={ss.submitText}>Gửi đơn đăng ký</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={ss.footnote}>
                Bằng cách gửi, bạn đồng ý với{" "}
                <Text style={{ color: C.gold }}>Điều khoản sử dụng</Text> của
                EMS
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  glowTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(216,201,123,0.05)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(216,201,123,0.04)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.goldDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  stepText: { color: C.gold, fontSize: 10, fontWeight: "700" },

  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  hero: { paddingTop: 28, paddingBottom: 20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: C.goldDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: C.textPrimary,
    lineHeight: 44,
    marginBottom: 10,
  },
  heroTitleGold: { color: C.gold },
  heroDesc: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
    maxWidth: "88%",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statVal: { color: C.gold, fontSize: 18, fontWeight: "800" },
  statLabel: {
    color: C.textSecondary,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

  contactCard: {
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  contactTitle: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(216,201,123,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  contactText: { color: "#999", fontSize: 13, flex: 1 },

  submitBtn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  submitText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  footnote: {
    textAlign: "center",
    fontSize: 11,
    color: C.textSecondary,
    lineHeight: 18,
  },
});
