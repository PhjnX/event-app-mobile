import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import PagerView from "react-native-pager-view";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  clearError,
  fetchCurrentUser,
} from "../../store/slices/authSlice";
import storageService from "../../services/storageService";
import { STORAGE_KEYS } from "../../constants";

const logo = require("../../../assets/Logo_EMS.webp");

const { width } = Dimensions.get("window");

const GOOGLE_LOGIN_URL =
  "https://event-app-y77p.onrender.com/oauth2/authorization/google";

// THEME TỐI VÀNG ĐEN - Giống EMS Desktop
const COLORS = {
  // Primary
  primary: "#D8C97B",
  primaryDark: "#b5a65f",

  // Background
  background: "#0a0a0a",
  backgroundLight: "#1a1a1a",
  backgroundCard: "#141414",

  // Text
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",

  // Input
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.1)",
  inputBorderFocus: "#D8C97B",

  // Others
  error: "#ef4444",
  success: "#22c55e",
  google: "#DB4437",

  // Wave
  waveTop: "#1a1a2e",
};

interface OnboardingScreenProps {
  onSkip: () => void;
}

export default function OnboardingScreen({ onSkip }: OnboardingScreenProps) {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const dispatch = useAppDispatch();
  const { isLoading, error, verificationEmail } = useAppSelector(
    (state) => state.auth,
  );

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register states
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "newPassword">(
    "email",
  );
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Verify Email states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");

  useEffect(() => {
    if (verificationEmail) {
      setShowVerifyModal(true);
    }
  }, [verificationEmail]);

  const goToPage = (page: number) => {
    pagerRef.current?.setPage(page);
  };

  // ===== LOGIN =====
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Thông báo", "Vui lòng nhập email và mật khẩu!");
      return;
    }
    dispatch(clearError());
    dispatch(loginUser({ email: loginEmail, password: loginPassword }));
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = Linking.createURL("/auth/callback");
      const result = await WebBrowser.openAuthSessionAsync(
        GOOGLE_LOGIN_URL,
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const token =
          url.searchParams.get("token") || url.searchParams.get("accessToken");

        if (token) {
          await storageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
          dispatch(fetchCurrentUser());
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đăng nhập Google thất bại. Vui lòng thử lại.");
    }
  };

  // ===== REGISTER - FIX: gửi confirmPassword =====
  const handleRegister = async () => {
    if (
      !registerUsername ||
      !registerEmail ||
      !registerPassword ||
      !registerConfirmPassword
    ) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp!");
      return;
    }
    if (registerPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    dispatch(clearError());
    dispatch(
      registerUser({
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
        confirmPassword: registerConfirmPassword, // FIX: thêm field này
      }),
    );
  };

  // ===== VERIFY EMAIL =====
  const handleVerifyEmail = async () => {
    if (!verifyOtp || verifyOtp.length < 4) {
      Alert.alert("Thông báo", "Vui lòng nhập mã xác thực!");
      return;
    }
    const result = await dispatch(
      verifyEmail({ email: verificationEmail!, verificationCode: verifyOtp }),
    );
    if (verifyEmail.fulfilled.match(result)) {
      Alert.alert(
        "Thành công",
        "Xác thực email thành công! Vui lòng đăng nhập.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowVerifyModal(false);
              setVerifyOtp("");
              setRegisterUsername("");
              setRegisterEmail("");
              setRegisterPassword("");
              setRegisterConfirmPassword("");
              goToPage(1);
            },
          },
        ],
      );
    }
  };

  const handleResendCode = async () => {
    Alert.alert("Thông báo", "Đã gửi lại mã xác thực đến email của bạn!");
  };

  // ===== FORGOT PASSWORD =====
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Thông báo", "Vui lòng nhập email!");
      return;
    }
    dispatch(clearError());
    const result = await dispatch(forgotPassword(forgotEmail));
    if (forgotPassword.fulfilled.match(result)) {
      setForgotStep("otp");
    }
  };

  const handleVerifyResetOtp = () => {
    if (!forgotOtp || forgotOtp.length < 4) {
      Alert.alert("Thông báo", "Vui lòng nhập mã xác thực!");
      return;
    }
    setForgotStep("newPassword");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu mới!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    const result = await dispatch(
      resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: newPassword,
        confirmPassword: confirmNewPassword,
      }),
    );

    if (resetPassword.fulfilled.match(result)) {
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công!", [
        {
          text: "OK",
          onPress: () => {
            setShowForgotModal(false);
            resetForgotState();
            goToPage(1);
          },
        },
      ]);
    }
  };

  const resetForgotState = () => {
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotStep("email");
    dispatch(clearError());
  };

  // ===== INPUT COMPONENT =====
  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      secureTextEntry?: boolean;
      showPassword?: boolean;
      onTogglePassword?: () => void;
      keyboardType?: "default" | "email-address" | "number-pad";
      autoCapitalize?: "none" | "sentences";
      maxLength?: number;
      textAlign?: "left" | "center";
      letterSpacing?: number; // Chỉ dùng cho OTP
    },
  ) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        paddingHorizontal: 14,
      }}
    >
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <TextInput
        style={{
          flex: 1,
          paddingVertical: 14,
          paddingHorizontal: 10,
          color: COLORS.text,
          fontSize: 15,
          textAlign: options?.textAlign || "left",
          letterSpacing: options?.letterSpacing || 0, // Mặc định là 0
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={options?.secureTextEntry && !options?.showPassword}
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize || "none"}
        maxLength={options?.maxLength}
      />
      {options?.secureTextEntry && options?.onTogglePassword && (
        <TouchableOpacity onPress={options.onTogglePassword}>
          <Ionicons
            name={options.showPassword ? "eye-outline" : "eye-off-outline"}
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // ===== FORGOT PASSWORD MODAL =====
  const renderForgotPasswordModal = () => (
    <Modal visible={showForgotModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.backgroundLight,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "80%",
              borderTopWidth: 1,
              borderTopColor: "rgba(216,201,123,0.3)",
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: "Inter_700Bold",
                    color: COLORS.text,
                  }}
                >
                  {forgotStep === "email" && "Quên mật khẩu"}
                  {forgotStep === "otp" && "Nhập mã xác thực"}
                  {forgotStep === "newPassword" && "Đặt mật khẩu mới"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowForgotModal(false);
                    resetForgotState();
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Gold line */}
              <View
                style={{
                  height: 2,
                  width: 50,
                  backgroundColor: COLORS.primary,
                  marginBottom: 20,
                  borderRadius: 1,
                }}
              />

              {/* Error */}
              {error && (
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.error,
                      textAlign: "center",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </Text>
                </View>
              )}

              {/* Step 1: Email */}
              {forgotStep === "email" && (
                <>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      marginBottom: 16,
                      lineHeight: 20,
                    }}
                  >
                    Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                  </Text>
                  <View style={{ marginBottom: 20 }}>
                    {renderInput(
                      "mail-outline",
                      "Nhập email của bạn",
                      forgotEmail,
                      setForgotEmail,
                      {
                        keyboardType: "email-address",
                      },
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <Text
                        style={{
                          color: COLORS.background,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 16,
                        }}
                      >
                        Gửi mã xác thực
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: OTP */}
              {forgotStep === "otp" && (
                <>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      marginBottom: 16,
                      lineHeight: 20,
                    }}
                  >
                    Mã xác thực đã được gửi đến{" "}
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: COLORS.primary,
                      }}
                    >
                      {forgotEmail}
                    </Text>
                  </Text>
                  <View style={{ marginBottom: 20 }}>
                    {renderInput(
                      "key-outline",
                      "• • • • • •",
                      forgotOtp,
                      setForgotOtp,
                      {
                        keyboardType: "number-pad",
                        maxLength: 6,
                        textAlign: "center",
                        letterSpacing: 8,
                      },
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleVerifyResetOtp}
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.background,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 16,
                      }}
                    >
                      Tiếp tục
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setForgotStep("email")}
                    style={{ marginTop: 16, alignItems: "center" }}
                  >
                    <Text style={{ color: COLORS.primary, fontSize: 14 }}>
                      ← Quay lại
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 3: New Password */}
              {forgotStep === "newPassword" && (
                <>
                  <View style={{ marginBottom: 14 }}>
                    {renderInput(
                      "lock-closed-outline",
                      "Mật khẩu mới",
                      newPassword,
                      setNewPassword,
                      {
                        secureTextEntry: true,
                      },
                    )}
                  </View>
                  <View style={{ marginBottom: 20 }}>
                    {renderInput(
                      "lock-closed-outline",
                      "Xác nhận mật khẩu mới",
                      confirmNewPassword,
                      setConfirmNewPassword,
                      { secureTextEntry: true },
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <Text
                        style={{
                          color: COLORS.background,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 16,
                        }}
                      >
                        Đặt lại mật khẩu
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setForgotStep("otp")}
                    style={{ marginTop: 16, alignItems: "center" }}
                  >
                    <Text style={{ color: COLORS.primary, fontSize: 14 }}>
                      ← Quay lại
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ===== VERIFY EMAIL MODAL =====
  const renderVerifyEmailModal = () => (
    <Modal visible={showVerifyModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.backgroundLight,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
              borderTopWidth: 1,
              borderTopColor: "rgba(216,201,123,0.3)",
            }}
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: "rgba(216,201,123,0.15)",
                  borderRadius: 35,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.3)",
                }}
              >
                <Ionicons
                  name="mail-open-outline"
                  size={35}
                  color={COLORS.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "Inter_700Bold",
                  color: COLORS.text,
                }}
              >
                Xác thực email
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  marginTop: 8,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Mã xác thực đã được gửi đến{"\n"}
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    color: COLORS.primary,
                  }}
                >
                  {verificationEmail}
                </Text>
              </Text>
            </View>

            {/* Error */}
            {error && (
              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: COLORS.error,
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* OTP Input */}
            <View style={{ marginBottom: 20 }}>
              {renderInput(
                "key-outline",
                "• • • • • •",
                verifyOtp,
                setVerifyOtp,
                {
                  keyboardType: "number-pad",
                  maxLength: 6,
                  textAlign: "center",
                  letterSpacing: 10,
                },
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyEmail}
              disabled={isLoading}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text
                  style={{
                    color: COLORS.background,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                  }}
                >
                  Xác thực
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Không nhận được mã?{" "}
              </Text>
              <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Gửi lại
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ===== MAIN RENDER =====
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      <View style={{ position: "absolute", top: 55, right: 20, zIndex: 999 }}>
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(216,201,123,0.15)",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.3)",
          }}
        >
          <Text
            style={{
              color: COLORS.primary,
              marginRight: 4,
              fontSize: 13,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Bỏ qua
          </Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => {
          setCurrentPage(e.nativeEvent.position);
          dispatch(clearError());
        }}
      >
        {/* ===== PAGE 1: WELCOME ===== */}
        <View key="1" style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
          >
            {/* Logo with glow effect */}
            <View
              style={{
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Image
                source={logo}
                style={{ width: 180, height: 180, marginBottom: 16 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontSize: 44,
                fontFamily: "Inter_700Bold",
                color: COLORS.text,
                letterSpacing: 8,
              }}
            >
              EMS
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                marginTop: 8,
                fontFamily: "Inter_500Medium",
                letterSpacing: 1,
              }}
            >
              Event Management System
            </Text>
          </View>

          {/* Wave */}
          <View style={{ height: 80 }}>
            <Svg height="80" width={width} viewBox={`0 0 ${width} 80`}>
              <Path
                d={`M0,40 Q${width * 0.25},80 ${width * 0.5},40 T${width},40 L${width},80 L0,80 Z`}
                fill={COLORS.backgroundLight}
              />
            </Svg>
          </View>

          {/* Bottom Content */}
          <View
            style={{
              backgroundColor: COLORS.backgroundLight,
              paddingHorizontal: 30,
              paddingBottom: 40,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontFamily: "Inter_700Bold",
                color: COLORS.text,
                marginBottom: 10,
              }}
            >
              Chào mừng! 👋
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: COLORS.textSecondary,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              Khám phá và đăng ký các sự kiện hấp dẫn.{"\n"}
              Quản lý vé dễ dàng ngay trên điện thoại.
            </Text>

            <TouchableOpacity
              onPress={() => goToPage(1)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 30,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Text
                style={{
                  color: COLORS.background,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  marginRight: 8,
                }}
              >
                Bắt đầu ngay
              </Text>
              <Ionicons
                name="arrow-forward-circle"
                size={22}
                color={COLORS.background}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== PAGE 2: LOGIN ===== */}
        <View
          key="2"
          style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}
        >
          {/* Header Wave */}
          <View
            style={{
              backgroundColor: COLORS.background,
              height: 180,
              position: "relative",
            }}
          >
            <View
              style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            >
              <Svg height="50" width={width} viewBox={`0 0 ${width} 50`}>
                <Path
                  d={`M0,25 Q${width * 0.25},50 ${width * 0.5},25 T${width},25 L${width},50 L0,50 Z`}
                  fill={COLORS.backgroundLight}
                />
              </Svg>
            </View>
          </View>

          {/* Form */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontSize: 28,
                fontFamily: "Inter_700Bold",
                color: COLORS.text,
                marginBottom: 6,
              }}
            >
              Đăng nhập
            </Text>
            <View
              style={{
                width: 50,
                height: 4,
                backgroundColor: COLORS.primary,
                borderRadius: 2,
                marginBottom: 20,
              }}
            />

            {/* Error */}
            {error && currentPage === 1 && (
              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    color: COLORS.error,
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Email
              </Text>
              {renderInput(
                "mail-outline",
                "Nhập email của bạn",
                loginEmail,
                setLoginEmail,
                {
                  keyboardType: "email-address",
                },
              )}
            </View>

            {/* Password */}
            <View style={{ marginBottom: 10 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Mật khẩu
              </Text>
              {renderInput(
                "lock-closed-outline",
                "Nhập mật khẩu",
                loginPassword,
                setLoginPassword,
                {
                  secureTextEntry: true,
                  showPassword: showLoginPassword,
                  onTogglePassword: () =>
                    setShowLoginPassword(!showLoginPassword),
                },
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 20 }}
              onPress={() => setShowForgotModal(true)}
            >
              <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text
                  style={{
                    color: COLORS.background,
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Đăng nhập
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: COLORS.inputBorder,
                }}
              />
              <Text
                style={{
                  marginHorizontal: 12,
                  color: COLORS.textMuted,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                hoặc
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: COLORS.inputBorder,
                }}
              />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.google} />
              <Text
                style={{
                  color: "#000",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  marginLeft: 10,
                }}
              >
                Đăng nhập với Google
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Chưa có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => goToPage(2)}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Đăng ký ngay
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ===== PAGE 3: REGISTER ===== */}
        <View
          key="3"
          style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}
        >
          {/* Header Wave */}
          <View
            style={{
              backgroundColor: COLORS.background,
              height: 140,
              position: "relative",
            }}
          >
            <View
              style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            >
              <Svg height="40" width={width} viewBox={`0 0 ${width} 40`}>
                <Path
                  d={`M0,20 Q${width * 0.25},40 ${width * 0.5},20 T${width},20 L${width},40 L0,40 Z`}
                  fill={COLORS.backgroundLight}
                />
              </Svg>
            </View>
          </View>

          {/* Form */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontSize: 28,
                fontFamily: "Inter_700Bold",
                color: COLORS.text,
                marginBottom: 6,
              }}
            >
              Đăng ký
            </Text>
            <View
              style={{
                width: 50,
                height: 4,
                backgroundColor: COLORS.primary,
                borderRadius: 2,
                marginBottom: 16,
              }}
            />

            {/* Error */}
            {error && currentPage === 2 && (
              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: COLORS.error,
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Username */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Tên người dùng
              </Text>
              {renderInput(
                "person-outline",
                "Nhập tên người dùng",
                registerUsername,
                setRegisterUsername,
              )}
            </View>

            {/* Email */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Email
              </Text>
              {renderInput(
                "mail-outline",
                "Nhập email của bạn",
                registerEmail,
                setRegisterEmail,
                {
                  keyboardType: "email-address",
                },
              )}
            </View>

            {/* Password */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Mật khẩu
              </Text>
              {renderInput(
                "lock-closed-outline",
                "Nhập mật khẩu",
                registerPassword,
                setRegisterPassword,
                {
                  secureTextEntry: true,
                  showPassword: showRegisterPassword,
                  onTogglePassword: () =>
                    setShowRegisterPassword(!showRegisterPassword),
                },
              )}
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: COLORS.primary,
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Xác nhận mật khẩu
              </Text>
              {renderInput(
                "lock-closed-outline",
                "Nhập lại mật khẩu",
                registerConfirmPassword,
                setRegisterConfirmPassword,
                {
                  secureTextEntry: true,
                  showPassword: showRegisterPassword,
                },
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text
                  style={{
                    color: COLORS.background,
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Đăng ký
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Đã có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => goToPage(1)}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </PagerView>

      {/* Modals */}
      {renderForgotPasswordModal()}
      {renderVerifyEmailModal()}
    </View>
  );
}
