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
  Dimensions,
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
  clearError,
} from "../../store/slices/authSlice";
import type { User } from "../../models/user";

const { width } = Dimensions.get("window");

const C = {
  gold: "#D8C97B",
  goldDark: "#b5a65f",
  goldFaint: "rgba(216,201,123,0.08)",
  goldBorder: "rgba(216,201,123,0.25)",
  goldBorderStrong: "rgba(216,201,123,0.5)",
  bg: "#0a0a0a",
  bgLight: "#1a1a1a",
  bgCard: "#111111",
  white: "#ffffff",
  gray: "#a0a0a0",
  muted: "#555555",
  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.08)",
  red: "#ef4444",
};

// ─── Input Field ─────────────────────────────────────────────────────────────
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
    <View className="mb-4">
      <Text
        className="mb-2 text-xs font-semibold tracking-widest uppercase"
        style={{ color: C.gold }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: C.inputBg,
          borderWidth: 1,
          borderColor: C.inputBorder,
        }}
      >
        <Ionicons name={icon} size={17} color={C.gold} />
        <TextInput
          className="flex-1 py-4 pl-3 text-base"
          style={{ color: editable ? C.white : C.muted }}
          placeholder={placeholder || label}
          placeholderTextColor={C.muted}
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

// ─── Menu Item ────────────────────────────────────────────────────────────────
const MenuItem = memo(
  ({
    icon,
    iconColor = C.gold,
    iconBg = C.goldFaint,
    title,
    subtitle,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center rounded-xl p-4 mb-3"
      style={{
        backgroundColor: danger ? "rgba(239,68,68,0.08)" : C.inputBg,
        borderWidth: 1,
        borderColor: danger ? "rgba(239,68,68,0.25)" : C.inputBorder,
      }}
      onPress={onPress}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className="text-base font-semibold"
          style={{ color: danger ? C.red : C.white }}
        >
          {title}
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: C.gray }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? C.red : C.muted}
      />
    </TouchableOpacity>
  ),
);

// ─── Main Component ───────────────────────────────────────────────────────────
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
    const result = await dispatch(
      updateUserProfile({ ...formData, avatarUrl: currentAvatarUrl }),
    );
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

  const handleNavigateToLogin = useCallback(() => {
    navigation.navigate("Auth", {
      screen: "Welcome",
      params: { targetPage: 1 },
    });
  }, [navigation]);

  const handleNavigateToRegister = useCallback(() => {
    navigation.navigate("Auth", {
      screen: "Welcome",
      params: { targetPage: 2 },
    });
  }, [navigation]);

  const displayAvatar = previewAvatar || formData.avatarUrl;
  const userInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  // ══════════════════════════════════════════════════════════════
  //  GUEST VIEW
  // ══════════════════════════════════════════════════════════════
  if (!isAuthenticated && skippedAuth) {
    const cardW = (width - 52) / 2;

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
            <Text
              className="text-base font-semibold"
              style={{ color: C.white }}
            >
              Tài khoản
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Hero — concentric rings */}
          <View
            className="items-center justify-center"
            style={{ height: 220, marginTop: 10 }}
          >
            <View
              className="absolute items-center justify-center"
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.12)",
              }}
            />
            <View
              className="absolute items-center justify-center"
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.2)",
              }}
            />
            <View
              className="items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "rgba(216,201,123,0.1)",
                borderWidth: 1.5,
                borderColor: "rgba(216,201,123,0.4)",
              }}
            >
              <Ionicons name="person-outline" size={48} color={C.gold} />
            </View>

            {[
              { icon: "ticket-outline", top: 10, right: width * 0.15 - 16 },
              { icon: "qr-code-outline", top: 50, left: width * 0.1 - 16 },
              { icon: "star-outline", bottom: 20, right: width * 0.12 - 16 },
              { icon: "calendar-outline", bottom: 30, left: width * 0.15 - 16 },
            ].map((f, i) => (
              <View
                key={i}
                className="absolute items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(216,201,123,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.2)",
                  top: f.top,
                  bottom: f.bottom,
                  left: f.left,
                  right: f.right,
                }}
              >
                <Ionicons name={f.icon as any} size={15} color={C.gold} />
              </View>
            ))}
          </View>

          {/* Text */}
          <View className="px-7 mt-6 items-center">
            <Text
              className="font-black text-center leading-tight"
              style={{ fontSize: 26, color: C.white, letterSpacing: -0.5 }}
            >
              Đăng nhập để khám phá{"\n"}
              <Text style={{ color: C.gold }}>thế giới sự kiện</Text>
            </Text>
            <Text
              className="text-sm text-center leading-relaxed mt-3 px-4"
              style={{ color: C.gray }}
            >
              Hàng nghìn sự kiện đang chờ bạn. Đặt vé, check-in và lưu giữ những
              khoảnh khắc đáng nhớ chỉ trong một ứng dụng.
            </Text>
          </View>

          {/* Feature grid 2×2 */}
          <View className="flex-row flex-wrap px-5 mt-7">
            {[
              {
                icon: "ticket-outline",
                title: "Đặt vé dễ dàng",
                desc: "Chọn sự kiện & thanh toán nhanh",
              },
              {
                icon: "qr-code-outline",
                title: "Check-in QR",
                desc: "Vào cổng chỉ 1 chạm",
              },
              {
                icon: "notifications-outline",
                title: "Thông báo",
                desc: "Không bỏ lỡ sự kiện nào",
              },
              {
                icon: "camera-outline",
                title: "Khoảnh khắc",
                desc: "Chia sẻ ảnh & kỷ niệm",
              },
            ].map((item, i) => (
              <View
                key={i}
                className="rounded-2xl p-4"
                style={{
                  width: cardW,
                  backgroundColor: C.bgCard,
                  borderWidth: 1,
                  borderColor: C.inputBorder,
                }}
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mb-3"
                  style={{
                    backgroundColor: C.goldFaint,
                    borderWidth: 1,
                    borderColor: C.goldBorder,
                  }}
                >
                  <Ionicons name={item.icon as any} size={22} color={C.gold} />
                </View>
                <Text
                  className="text-sm font-bold mb-1"
                  style={{ color: C.white }}
                >
                  {item.title}
                </Text>
                <Text className="text-xs leading-5" style={{ color: C.muted }}>
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View className="px-6 mt-8">
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-2xl py-4 mb-3"
              style={{ backgroundColor: C.gold }}
              onPress={handleNavigateToLogin}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={19} color={C.bg} />
              <Text
                className="ml-2 text-base font-bold tracking-wide"
                style={{ color: C.bg }}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-2xl py-4 mb-6"
              style={{ borderWidth: 1.5, borderColor: C.goldBorderStrong }}
              onPress={handleNavigateToRegister}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={19} color={C.gold} />
              <Text
                className="ml-2 text-base font-semibold"
                style={{ color: C.gold }}
              >
                Tạo tài khoản mới
              </Text>
            </TouchableOpacity>

            {/* Trust badges */}
            <View className="flex-row justify-center">
              {[
                { icon: "shield-checkmark-outline", label: "Bảo mật" },
                { icon: "gift-outline", label: "Miễn phí" },
                { icon: "ban-outline", label: "Không quảng cáo" },
              ].map((b, i) => (
                <View
                  key={i}
                  className="flex-row items-center"
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons name={b.icon as any} size={12} color={C.muted} />
                  <Text className="text-xs ml-1" style={{ color: C.muted }}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  AUTHENTICATED VIEW
  // ══════════════════════════════════════════════════════════════
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={C.white} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: C.white }}>
            Hồ sơ cá nhân
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar */}
        <View className="items-center py-5">
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View
              className="w-28 h-28 rounded-full overflow-hidden items-center justify-center"
              style={{
                backgroundColor: C.bgCard,
                borderWidth: 3,
                borderColor: C.gold,
              }}
            >
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-5xl font-bold" style={{ color: C.gold }}>
                  {userInitial}
                </Text>
              )}
              <View
                className="absolute bottom-0 left-0 right-0 h-9 items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              >
                <Ionicons name="camera" size={17} color={C.white} />
              </View>
            </View>
            {isUploading && (
              <View
                className="absolute inset-0 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <ActivityIndicator color={C.gold} />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-xl font-bold mt-3" style={{ color: C.white }}>
            {user?.username || "Người dùng"}
          </Text>
          <Text className="text-sm mt-1" style={{ color: C.gray }}>
            {user?.email}
          </Text>
          {user?.role ? (
            <View
              className="px-3 py-1 rounded-xl mt-2"
              style={{
                backgroundColor: C.goldFaint,
                borderWidth: 1,
                borderColor: C.goldBorder,
              }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.gold }}
              >
                {user.role}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Form */}
        <View className="px-5 mt-2">
          <Text className="text-base font-bold mb-4" style={{ color: C.white }}>
            Thông tin cá nhân
          </Text>

          <InputField
            label="Tên người dùng"
            icon="person-outline"
            value={formData.username || ""}
            onChangeText={(t) => setFormData({ ...formData, username: t })}
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
            onChangeText={(t) => setFormData({ ...formData, phoneNumber: t })}
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
          />
          <InputField
            label="Địa chỉ"
            icon="location-outline"
            value={formData.address || ""}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
          />

          {/* Gender */}
          <View className="mb-4">
            <Text
              className="mb-2 text-xs font-semibold tracking-widest uppercase"
              style={{ color: C.gold }}
            >
              Giới tính
            </Text>
            <TouchableOpacity
              className="flex-row items-center rounded-xl px-4 py-4"
              style={{
                backgroundColor: C.inputBg,
                borderWidth: 1,
                borderColor: C.inputBorder,
              }}
              onPress={() => setShowGenderPicker(true)}
            >
              <Ionicons name="male-female-outline" size={17} color={C.gold} />
              <Text
                className="flex-1 pl-3 text-base"
                style={{ color: formData.gender ? C.white : C.muted }}
              >
                {formData.gender === "MALE"
                  ? "Nam"
                  : formData.gender === "FEMALE"
                    ? "Nữ"
                    : formData.gender === "OTHER"
                      ? "Khác"
                      : "Chọn giới tính"}
              </Text>
              <Ionicons name="chevron-down" size={17} color={C.muted} />
            </TouchableOpacity>
          </View>

          <InputField
            label="Ngày sinh"
            icon="calendar-outline"
            value={formData.dateOfBirth || ""}
            onChangeText={(t) => setFormData({ ...formData, dateOfBirth: t })}
            placeholder="YYYY-MM-DD"
          />

          <TouchableOpacity
            className="flex-row items-center justify-center rounded-xl py-4 mt-2"
            style={{ backgroundColor: C.gold }}
            onPress={handleSaveProfile}
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <ActivityIndicator color={C.bg} />
            ) : (
              <>
                <Ionicons name="save-outline" size={19} color={C.bg} />
                <Text
                  className="ml-2 font-bold text-base uppercase tracking-widest"
                  style={{ color: C.bg }}
                >
                  Lưu thay đổi
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security — chỉ còn Đổi mật khẩu */}
        <View className="px-5 mt-8">
          <Text className="text-base font-bold mb-4" style={{ color: C.white }}>
            Bảo mật
          </Text>
          <MenuItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu đăng nhập"
            onPress={() => setShowPasswordModal(true)}
          />
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          >
            <View
              className="rounded-t-3xl p-6 pb-10"
              style={{
                backgroundColor: C.bgLight,
                borderTopWidth: 1,
                borderTopColor: C.goldBorder,
              }}
            >
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-xl font-bold" style={{ color: C.white }}>
                  Đổi mật khẩu
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordModal(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    dispatch(clearError());
                  }}
                >
                  <Ionicons name="close" size={24} color={C.muted} />
                </TouchableOpacity>
              </View>
              <View
                className="w-12 h-1 rounded-full mb-5"
                style={{ backgroundColor: C.gold }}
              />
              {error ? (
                <View
                  className="rounded-xl p-3 mb-4"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.25)",
                  }}
                >
                  <Text
                    className="text-center text-sm"
                    style={{ color: C.red }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}
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
                className="rounded-xl py-4 items-center mt-2"
                style={{ backgroundColor: C.gold }}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={C.bg} />
                ) : (
                  <Text
                    className="font-bold text-base uppercase tracking-widest"
                    style={{ color: C.bg }}
                  >
                    Đổi mật khẩu
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Gender Picker */}
      <Modal visible={showGenderPicker} animationType="fade" transparent>
        <TouchableOpacity
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          activeOpacity={1}
          onPress={() => setShowGenderPicker(false)}
        >
          <View
            className="rounded-2xl p-5 w-4/5"
            style={{
              backgroundColor: C.bgLight,
              borderWidth: 1,
              borderColor: C.goldBorder,
            }}
          >
            <Text
              className="text-lg font-bold text-center mb-4"
              style={{ color: C.white }}
            >
              Chọn giới tính
            </Text>
            {[
              { value: "MALE", label: "Nam" },
              { value: "FEMALE", label: "Nữ" },
              { value: "OTHER", label: "Khác" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                className="flex-row items-center justify-between py-4"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: C.inputBorder,
                }}
                onPress={() => {
                  setFormData({ ...formData, gender: item.value });
                  setShowGenderPicker(false);
                }}
              >
                <Text className="text-base" style={{ color: C.white }}>
                  {item.label}
                </Text>
                {formData.gender === item.value && (
                  <Ionicons name="checkmark-circle" size={22} color={C.gold} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
