// AppHeader.tsx — Shared header component
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // Thêm navigation
import { useAppSelector } from "../../hooks/useRedux"; // Thêm Redux

const LOGO = require("../../../assets/Logo_EMS.webp");

const GOLD = "#D8C97B";
const BG = "#060606";
const CARD = "#0F0F0F";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN = "#22c55e";

interface AppHeaderProps {
  avatarUri?: string;
  initial: string;
  liveCount?: number;
  onAvatarPress?: () => void;
  // Đã xóa notifCount và onNotifPress ra khỏi Props vì Header sẽ tự lo việc này
}

export function AppHeader({
  avatarUri,
  initial,
  liveCount = 0,
  onAvatarPress,
}: AppHeaderProps) {
  const navigation = useNavigation<any>();

  // AppHeader tự động lấy số đếm thông báo chưa đọc từ Redux
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.header,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />

      <View style={styles.right}>
        {/* Notification bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("NotificationsOrganizerScreen")}
          activeOpacity={0.72}
        >
          <Ionicons name="notifications-outline" size={20} color="#bbb" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={onAvatarPress}
          activeOpacity={0.78}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: liveCount > 0 ? GREEN : "#2a2a2a" },
            ]}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  logo: { width: 110, height: 38 },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeTxt: { color: "#000", fontSize: 8, fontWeight: "800" },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GOLD + "80",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarImg: { width: 36, height: 36, borderRadius: 10 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a180a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: GOLD, fontSize: 15, fontWeight: "800" },
  statusDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: BG,
  },
});
