import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import imageService from "../../services/imageService";
import {
  uploadAvatar,
  updateUserProfile,
  changePassword,
  logoutUser,
  resetToLogin,
  clearError,
} from "../../store/slices/authSlice";
import type { User } from "../../models/user";

const COLORS = {
  primary: "#D8C97B",
  primaryDark: "#b5a65f",
  background: "#0a0a0a",
  backgroundLight: "#1a1a1a",
  backgroundCard: "#141414",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.1)",
  error: "#ef4444",
  success: "#22c55e",
};

// Memoized Input Component
const InputField = memo(
  ({
    label,
    icon,
    value,
    onChangeText,
    editable = true,
    keyboardType = "default",
    placeholder,
    secureTextEntry = false,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (text: string) => void;
    editable?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
    placeholder?: string;
    secureTextEntry?: boolean;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          placeholder={placeholder || label}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  ),
);

// Memoized Menu Item Component
const MenuItem = memo(
  ({
    icon,
    iconColor = COLORS.primary,
    iconBgColor = "rgba(216,201,123,0.15)",
    title,
    subtitle,
    onPress,
    containerStyle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    containerStyle?: any;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, containerStyle]}
      onPress={onPress}
    >
      <View style={[styles.menuIconBox, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text
          style={[
            styles.menuTitle,
            { color: iconColor === COLORS.error ? COLORS.error : COLORS.text },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={iconColor === COLORS.error ? COLORS.error : COLORS.textMuted}
      />
    </TouchableOpacity>
  ),
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user, isLoading, isUploading, error, isAuthenticated, skippedAuth } =
    useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    avatarUrl: "",
  });

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handlePickImage = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Thông báo", "Cần cấp quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreviewAvatar(asset.uri);
      setSelectedFile(imageService.createImageFile(asset.uri, "avatar.jpg"));
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    let currentAvatarUrl = formData.avatarUrl;

    if (selectedFile) {
      const uploadResult = await dispatch(uploadAvatar(selectedFile));
      if (uploadAvatar.fulfilled.match(uploadResult)) {
        currentAvatarUrl = uploadResult.payload as string;
      } else {
        Alert.alert("Lỗi", "Upload ảnh thất bại. Vui lòng thử lại.");
        return;
      }
    }

    const updatePayload = { ...formData, avatarUrl: currentAvatarUrl };
    const result = await dispatch(updateUserProfile(updatePayload));

    if (updateUserProfile.fulfilled.match(result)) {
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      setSelectedFile(null);
      setPreviewAvatar(null);
    } else {
      Alert.alert("Lỗi", error || "Cập nhật thất bại. Vui lòng thử lại.");
    }
  }, [dispatch, formData, selectedFile, error]);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    dispatch(clearError());
    const result = await dispatch(
      changePassword({ oldPassword, newPassword, confirmPassword }),
    );

    if (changePassword.fulfilled.match(result)) {
      Alert.alert("Thành công", "Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      Alert.alert("Lỗi", error || "Đổi mật khẩu thất bại!");
    }
  }, [dispatch, oldPassword, newPassword, confirmPassword, error]);

  const handleLogout = useCallback(() => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  }, [dispatch]);

  // Guest muốn đăng nhập
  const handleGuestLogin = useCallback(() => {
    dispatch(resetToLogin());
  }, [dispatch]);

  const displayAvatar = previewAvatar || formData.avatarUrl;
  const userInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "K";

  // ===== GUEST VIEW =====
  if (!isAuthenticated && skippedAuth) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Guest Content */}
        <View style={styles.guestContainer}>
          <View style={styles.guestIconBox}>
            <Ionicons
              name="person-circle-outline"
              size={80}
              color={COLORS.textMuted}
            />
          </View>
          <Text style={styles.guestTitle}>Chào Khách!</Text>
          <Text style={styles.guestText}>
            Đăng nhập để sử dụng đầy đủ tính năng như đăng ký sự kiện, quản lý
            vé và chia sẻ khoảnh khắc.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGuestLogin}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color={COLORS.background}
            />
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={handleGuestLogin}
          >
            <Text style={styles.registerLinkText}>
              Chưa có tài khoản?{" "}
              <Text style={{ color: COLORS.primary }}>Đăng ký</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Tính năng khi đăng nhập</Text>
          {[
            { icon: "ticket-outline", text: "Đăng ký và quản lý vé sự kiện" },
            { icon: "camera-outline", text: "Chia sẻ khoảnh khắc" },
            { icon: "qr-code-outline", text: "Check-in bằng QR code" },
            { icon: "notifications-outline", text: "Nhận thông báo sự kiện" },
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ===== AUTHENTICATED VIEW =====
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              )}
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={18} color={COLORS.text} />
              </View>
            </View>
            {isUploading && (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.username || "Người dùng"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <InputField
            label="Tên người dùng"
            icon="person-outline"
            value={formData.username || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, username: text })
            }
          />

          <InputField
            label="Email"
            icon="mail-outline"
            value={formData.email || ""}
            onChangeText={() => {}}
            editable={false}
            keyboardType="email-address"
          />

          <InputField
            label="Số điện thoại"
            icon="call-outline"
            value={formData.phoneNumber || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneNumber: text })
            }
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
          />

          <InputField
            label="Địa chỉ"
            icon="location-outline"
            value={formData.address || ""}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Giới tính</Text>
            <TouchableOpacity
              onPress={() => setShowGenderPicker(true)}
              style={styles.selectWrapper}
            >
              <Ionicons
                name="male-female-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text
                style={[
                  styles.selectText,
                  !formData.gender && { color: COLORS.textMuted },
                ]}
              >
                {formData.gender === "MALE"
                  ? "Nam"
                  : formData.gender === "FEMALE"
                    ? "Nữ"
                    : formData.gender === "OTHER"
                      ? "Khác"
                      : "Chọn giới tính"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <InputField
            label="Ngày sinh"
            icon="calendar-outline"
            value={formData.dateOfBirth || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, dateOfBirth: text })
            }
            placeholder="YYYY-MM-DD"
          />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isLoading || isUploading}
            style={styles.saveButton}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={COLORS.background}
                />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>Bảo mật</Text>

          <MenuItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu đăng nhập"
            onPress={() => setShowPasswordModal(true)}
          />

          <MenuItem
            icon="log-out-outline"
            iconColor={COLORS.error}
            iconBgColor="rgba(239, 68, 68, 0.15)"
            title="Đăng xuất"
            subtitle="Thoát khỏi tài khoản"
            onPress={handleLogout}
            containerStyle={styles.logoutItem}
          />
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordModal(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    dispatch(clearError());
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <InputField
                label="Mật khẩu hiện tại"
                icon="lock-closed-outline"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Nhập mật khẩu hiện tại"
              />

              <InputField
                label="Mật khẩu mới"
                icon="lock-open-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
              />

              <InputField
                label="Xác nhận mật khẩu"
                icon="checkmark-circle-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
              />

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isLoading}
                style={styles.modalButton}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.modalButtonText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal visible={showGenderPicker} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Chọn giới tính</Text>
            {[
              { value: "MALE", label: "Nam" },
              { value: "FEMALE", label: "Nữ" },
              { value: "OTHER", label: "Khác" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => {
                  setFormData({ ...formData, gender: item.value });
                  setShowGenderPicker(false);
                }}
                style={styles.pickerItem}
              >
                <Text style={styles.pickerItemText}>{item.label}</Text>
                {formData.gender === item.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 12,
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "rgba(216,201,123,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.primary,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 15,
  },
  inputDisabled: {
    color: COLORS.textMuted,
  },
  selectWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: {
    flex: 1,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 15,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 8,
  },

  // Security Section
  securitySection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 16,
    marginBottom: 12,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  menuSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  logoutItem: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },

  // Guest View
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  guestIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  guestText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
  },
  loginButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  registerLink: {
    marginTop: 16,
  },
  registerLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  featuresContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  featuresTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(216,201,123,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(216,201,123,0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalDivider: {
    height: 2,
    width: 50,
    backgroundColor: COLORS.primary,
    marginBottom: 20,
    borderRadius: 1,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    fontSize: 13,
  },

  // Gender Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContent: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
    textAlign: "center",
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerItemText: {
    color: COLORS.text,
    fontSize: 16,
  },
});
