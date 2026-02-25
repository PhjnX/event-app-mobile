import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { OrganizerTabParamList } from "./types";

// Screens
import HomeScreen from "../screens/organizer/HomeScreen";
import QRScannerScreen from "../screens/organizer/QRScannerScreen";
import ProfileScreen from "../screens/organizer/ProfileScreen";

const Tab = createBottomTabNavigator<OrganizerTabParamList>();

export default function OrganizerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1a1a1a",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#b5a65f",
        tabBarInactiveTintColor: "#888",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "QRScanner") {
            iconName = focused ? "qr-code" : "qr-code-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: "Quét QR" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
}
