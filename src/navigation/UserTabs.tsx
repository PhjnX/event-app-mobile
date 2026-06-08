import React from "react";
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

import { TabBarProvider, useTabBar } from "../context/TabBarContext"; // ← adjust path

export type UserTabParamList = {
  Home: undefined;
  Events: undefined;
  Moments: undefined;
  News: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

/* ─── Custom Tab Bar ─── */
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
            <TouchableOpacity
              key={slotIdx}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={ss.tabBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(isFocused ? slot.iconFocused : slot.icon) as any}
                size={22}
                color={isFocused ? "#D8C97B" : "#444"}
              />
              <Text
                style={[
                  ss.label,
                  { color: isFocused ? "#D8C97B" : "#444", marginTop: 3 },
                ]}
              >
                {slot.label}
              </Text>
              {isFocused && <View style={ss.activeDot} />}
            </TouchableOpacity>
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
      screenOptions={{ headerShown: false }}
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
    backgroundColor: "#D8C97B",
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
    backgroundColor: "#D8C97B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D8C97B",
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
