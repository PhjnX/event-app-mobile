import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIX: Import đúng đường dẫn các screen của bạn
import OrganizerHomeScreen from "../screens/organizer/HomeScreen";
import { OrganizerEventsScreen } from "../screens/organizer/EventsScreen";
import { OrganizerProfileScreen } from "../screens/organizer/ProfileScreen";

export type OrganizerTabParamList = {
  OrgHome: undefined;
  OrgEvents: undefined;
  OrgProfile: undefined;
};

const Tab = createBottomTabNavigator<OrganizerTabParamList>();

const GOLD = "#D8C97B";
const INACTIVE = "#666666"; // Để màu xám sáng lên 1 chút cho sang trọng
const BG_BAR = "rgba(8,8,8,0.95)";

// ─── Cấu hình 3 Tab ───────────────────────────────────────────────────────────
const SLOTS = [
  {
    name: "OrgHome",
    icon: "home-outline" as const,
    iconFocused: "home" as const,
    label: "Tổng quan",
  },
  {
    name: "OrgEvents",
    icon: "calendar-outline" as const,
    iconFocused: "calendar" as const,
    label: "Sự kiện",
  },
  {
    name: "OrgProfile",
    icon: "person-outline" as const,
    iconFocused: "person" as const,
    label: "Hồ sơ",
  },
];

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomOrganizerTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[ss.wrapper, { paddingBottom: insets.bottom || 16 }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, ss.androidBg]} />
      )}

      {/* Viền vàng mỏng ở trên cùng */}
      <View style={ss.topLine} />

      <View style={ss.row}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const slot = SLOTS[index];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={ss.tabBtn}
              activeOpacity={0.7}
            >
              {/* Thanh gạch ngang nhỏ khi đang active */}
              {isFocused && <View style={ss.activeIndicator} />}

              <Ionicons
                name={isFocused ? slot.iconFocused : slot.icon}
                size={24} // Tăng size icon lên 24 nhìn cho rõ ràng vì không còn nút QR chen giữa
                color={isFocused ? GOLD : INACTIVE}
              />
              <Text style={[ss.label, { color: isFocused ? GOLD : INACTIVE }]}>
                {slot.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Inner Navigator ──────────────────────────────────────────────────────────
export default function OrganizerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomOrganizerTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="OrgHome" component={OrganizerHomeScreen} />
      <Tab.Screen name="OrgEvents" component={OrganizerEventsScreen} />
      <Tab.Screen name="OrgProfile" component={OrganizerProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  androidBg: {
    backgroundColor: BG_BAR,
  },
  topLine: {
    height: 1,
    backgroundColor: "rgba(216,201,123,0.15)", // Vàng nhạt tạo viền phát sáng nhẹ
  },
  row: {
    flexDirection: "row",
    height: 65, // Chiều cao thoải mái
    alignItems: "center",
  },
  tabBtn: {
    flex: 1, // Chia đều 3 phần bằng nhau
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 4,
    position: "relative",
    height: "100%",
  },
  activeIndicator: {
    position: "absolute",
    top: -1, // Đẩy lên chạm viền trên
    width: 32,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
