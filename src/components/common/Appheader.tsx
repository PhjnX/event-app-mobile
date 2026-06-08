import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { logoutUser } from "../../store/slices/authSlice";
import { useNotifications } from "../../context/NotificationContext";

const LOGO = require("../../../assets/Logo_EMS.webp");

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sub?: string;
  screen?: string;
  params?: object;
  dividerAfter?: boolean;
  accent?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s: any) => s.auth);
  const { unreadCount } = useNotifications(); // ✅ badge thật từ context

  const isLoggedIn = !!user && !user.isGuest;

  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (screen?: string, params?: object) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      if (screen) navigation.navigate(screen, params);
    });
  };

  const handleLogout = () => {
    closeMenu();
    setTimeout(() => {
      Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => dispatch(logoutUser()),
        },
      ]);
    }, 200);
  };

  const MENU_ITEMS: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        icon: "person-circle-outline",
        label: "Hồ sơ của tôi",
        sub: "Xem và chỉnh sửa thông tin",
        screen: "Profile",
      },
      {
        icon: "ticket-outline",
        label: "Vé của tôi",
        sub: "Lịch sử đặt vé & check-in",
        screen: "MyTickets",
        dividerAfter: true,
      },
      {
        icon: "briefcase-outline",
        label: "Đăng ký Organizer",
        sub: "Trở thành nhà tổ chức sự kiện",
        screen: "RegisterOrganizer",
        accent: true,
        dividerAfter: isLoggedIn,
      },
    ];

    if (isLoggedIn) {
      items.push({
        icon: "log-out-outline",
        label: "Đăng xuất",
        sub: "Thoát khỏi tài khoản",
        danger: true,
        onPress: handleLogout,
      });
    } else {
      items.push({
        icon: "log-in-outline",
        label: "Đăng nhập",
        sub: "Đăng nhập để sử dụng đầy đủ tính năng",
        accent: true,
        onPress: () => {
          closeMenu();
          setTimeout(() => {
            navigation.navigate("Auth", {
              screen: "Welcome",
              params: { targetPage: 1 },
            });
          }, 150);
        },
      });
    }

    return items;
  }, [isLoggedIn]);

  const avatarUri = user?.avatarUrl || user?.profilePictureUrl;
  const displayName = user?.fullName || user?.username || "Tài khoản";
  const displayEmail = user?.email || "";

  return (
    <>
      {/* ── HEADER BAR ── */}
      <View style={ss.header}>
        {title ? (
          <View>
            <Text style={ss.titleText}>{title}</Text>
            {subtitle ? <Text style={ss.subtitleText}>{subtitle}</Text> : null}
          </View>
        ) : (
          <Image source={LOGO} style={ss.logo} resizeMode="contain" />
        )}

        <View style={ss.rightRow}>
          {/* ✅ Notification bell với badge thật */}
          <TouchableOpacity
            style={[ss.iconBtn, { marginRight: 10 }]}
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#ccc" />
            {unreadCount > 0 && (
              <View style={ss.notifBadge}>
                <Text style={ss.notifBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openMenu}
            activeOpacity={0.8}
            style={ss.avatarWrap}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={ss.avatar} />
            ) : (
              <View style={ss.avatarFallback}>
                <Text style={ss.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={ss.onlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── DROPDOWN MODAL ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeMenu()}
      >
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <View style={ss.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            ss.dropdown,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
          pointerEvents="box-none"
        >
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, ss.dropdownAndroidBg]} />
          )}

          {/* User info */}
          <View style={ss.menuUserRow}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[ss.menuAvatar, { marginRight: 12 }]}
              />
            ) : (
              <View style={[ss.menuAvatarFallback, { marginRight: 12 }]}>
                <Text style={ss.menuAvatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={ss.menuName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={ss.menuEmail} numberOfLines={1}>
                {displayEmail}
              </Text>
            </View>
          </View>

          <View style={ss.menuDivider} />

          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={idx}>
              <TouchableOpacity
                style={ss.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.onPress) item.onPress();
                  else closeMenu(item.screen, item.params);
                }}
              >
                <View
                  style={[
                    ss.menuIconBox,
                    item.accent && ss.menuIconBoxAccent,
                    item.danger && ss.menuIconBoxDanger,
                    { marginRight: 12 },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={
                      item.danger ? "#ef4444" : item.accent ? "#D8C97B" : "#aaa"
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      ss.menuLabel,
                      item.accent && ss.menuLabelAccent,
                      item.danger && ss.menuLabelDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.sub ? <Text style={ss.menuSub}>{item.sub}</Text> : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={item.danger ? "rgba(239,68,68,0.4)" : "#333"}
                />
              </TouchableOpacity>
              {item.dividerAfter ? <View style={ss.menuDivider} /> : null}
            </React.Fragment>
          ))}
        </Animated.View>
      </Modal>
    </>
  );
}

const DROPDOWN_WIDTH = 280;

const ss = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logo: { width: 110, height: 36 },
  titleText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  subtitleText: { color: "#555", fontSize: 12, marginTop: 2 },
  rightRow: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  // ✅ Badge mới — hiển thị số thay vì dot cứng
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D8C97B",
    borderWidth: 1.5,
    borderColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: "#0a0a0a",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#D8C97B",
    position: "relative",
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1e1c0a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#D8C97B", fontSize: 15, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#4ade80",
    borderWidth: 1.5,
    borderColor: "#0a0a0a",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dropdown: {
    position: "absolute",
    top: 88,
    right: 16,
    width: DROPDOWN_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  dropdownAndroidBg: { backgroundColor: "#141414" },
  menuUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  menuAvatar: { width: 42, height: 42, borderRadius: 21 },
  menuAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1e1c0a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
  },
  menuAvatarInitial: { color: "#D8C97B", fontSize: 18, fontWeight: "800" },
  menuName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  menuEmail: { color: "#555", fontSize: 11, marginTop: 2 },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconBoxAccent: {
    backgroundColor: "rgba(216,201,123,0.12)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.25)",
  },
  menuIconBoxDanger: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  menuLabel: { color: "#ddd", fontSize: 13, fontWeight: "600" },
  menuLabelAccent: { color: "#D8C97B" },
  menuLabelDanger: { color: "#ef4444" },
  menuSub: { color: "#444", fontSize: 10, marginTop: 2 },
});
