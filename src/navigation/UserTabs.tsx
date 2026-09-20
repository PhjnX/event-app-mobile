import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/user/HomeScreen";
import EventsScreen from "../screens/user/EventsScreen";
import MomentsTabScreen from "../screens/user/Momentstabscreen";
import NewsScreen from "../screens/user/NewsScreen";
import { COLORS } from "../constants/theme";

import { TabBarProvider, useTabBar } from "../context/TabBarContext"; // ← adjust path

export type UserTabParamList = {
  Home: undefined;
  Events: undefined;
  Moments: undefined;
  News: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

/* ─── Custom Tab Bar ─── */
/**
 * Nút tab có phản hồi chạm.
 *
 * Chuyển tab vẫn tức thì — không chờ hiệu ứng nào, không có khung hình trống.
 * Cảm giác mượt đến từ chính cái nút: nhún xuống khi ngón tay chạm, nảy về khi
 * thả, và chấm chỉ báo bung ra ở tab vừa chọn. Toàn bộ chạy bằng transform và
 * opacity với useNativeDriver nên nằm trên luồng UI, không bị JS làm giật.
 *
 * Màu icon vẫn đổi tức thì (màu không chạy được trên luồng native) — và như vậy
 * lại đúng: màu đổi ngay khẳng định thao tác đã được ghi nhận.
 */
function TabButton({
  icon,
  iconFocused,
  label,
  isFocused,
  onPress,
  accessibilityLabel,
}: {
  icon: string;
  iconFocused: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const dot = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dot, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();

    if (isFocused) {
      scale.setValue(0.86);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 12,
      }).start();
    }
  }, [isFocused, dot, scale]);

  const nhanXuong = () =>
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const thaRa = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 12,
    }).start();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={nhanXuong}
      onPressOut={thaRa}
      style={ss.tabBtn}
      activeOpacity={1}
    >
      <Animated.View
        style={{ alignItems: "center", transform: [{ scale }] }}
      >
        <Ionicons
          name={(isFocused ? iconFocused : icon) as any}
          size={22}
          color={isFocused ? COLORS.primary : "#444"}
        />
        <Text
          style={[
            ss.label,
            { color: isFocused ? COLORS.primary : "#444", marginTop: 3 },
          ]}
        >
          {label}
        </Text>
        <Animated.View
          style={[ss.activeDot, { opacity: dot, transform: [{ scale: dot }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation: tabNav }: any) {
  const rootNav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { translateY } = useTabBar(); // ← lấy animated value

  const slots = [
    {
      type: "tab",
      index: 0,
      icon: "home-outline",
      iconFocused: "home",
      label: "Trang chủ",
    },
    {
      type: "tab",
      index: 1,
      icon: "calendar-outline",
      iconFocused: "calendar",
      label: "Sự kiện",
    },
    { type: "center" },
    {
      type: "tab",
      index: 2,
      icon: "images-outline",
      iconFocused: "images",
      label: "Moments",
    },
    {
      type: "tab",
      index: 3,
      icon: "newspaper-outline",
      iconFocused: "newspaper",
      label: "Tin tức",
    },
  ];

  const tabBarHeight = 64 + insets.bottom;

  return (
    <Animated.View
      style={[
        ss.wrapper,
        { paddingBottom: insets.bottom },
        { transform: [{ translateY }] }, // ← animate show/hide
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, ss.androidBg]} />
      )}

      <View style={ss.topBorder} />

      <View style={ss.row}>
        {slots.map((slot, slotIdx) => {
          /* ── CENTER QR BUTTON ── */
          if (slot.type === "center") {
            return (
              <View key="center" style={ss.centerSlot}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => rootNav.navigate("ActivityQRScanner")}
                  style={ss.centerBtn}
                >
                  <View style={ss.centerGlow} />
                  <Ionicons name="qr-code-outline" size={26} color="#000" />
                </TouchableOpacity>
              </View>
            );
          }

          /* ── NORMAL TAB ── */
          const tabIndex = slot.index!;
          const isFocused = state.index === tabIndex;
          const route = state.routes[tabIndex];
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = tabNav.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented)
              tabNav.navigate(route.name);
          };

          return (
            <TabButton
              key={slotIdx}
              icon={slot.icon as string}
              iconFocused={slot.iconFocused as string}
              label={slot.label as string}
              isFocused={isFocused}
              onPress={onPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

/* ─── Tab Navigator ─── */
function UserTabsInner() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Đã thử animation: "fade" cho thanh tab và bị chớp màn hình: màn cũ mờ
        // đi trong khi màn mới chưa kịp vẽ, lộ nền đen một khung hình. Bottom
        // tabs mặc định tháo màn không hoạt động khỏi cây nên crossfade không
        // có gì để hoà vào. Giữ chuyển tab tức thì; hiệu ứng để dành cho
        // chuyển màn trong stack, nơi nó chạy đúng.
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Moments" component={MomentsTabScreen} />
      <Tab.Screen name="News" component={NewsScreen} />
    </Tab.Navigator>
  );
}

// Wrap với Provider để các screen con dùng được useTabBar()
export default function UserTabs() {
  return (
    <TabBarProvider>
      <UserTabsInner />
    </TabBarProvider>
  );
}

const ss = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  androidBg: {
    backgroundColor: "rgba(10,10,10,0.97)",
  },
  topBorder: {
    height: 1,
    backgroundColor: "rgba(216,201,123,0.12)",
  },
  row: {
    flexDirection: "row",
    height: 64,
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    position: "relative",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 4,
  },
  centerGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(216,201,123,0.18)",
  },
});
