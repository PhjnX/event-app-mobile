import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import type { UserTabParamList } from "./types";

// Screens
import HomeScreen from "../screens/user/HomeScreen";
import EventsScreen from "../screens/user/EventsScreen";
import MyTicketsScreen from "../screens/user/MyTicketsScreen";
import NewsScreen from "../screens/user/NewsScreen";
import ProfileScreen from "../screens/user/ProfileScreen";

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1f1f1f",
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#b5a65f",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          let size = 24;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Events") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "MyTickets") {
            iconName = focused ? "ticket" : "ticket-outline";
          } else if (route.name === "News") {
            iconName = focused ? "newspaper" : "newspaper-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person-circle" : "person-circle-outline";
          }

          return (
            <View
              className={`items-center justify-center ${
                focused ? "bg-primary-gold/20 rounded-full p-1" : ""
              }`}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: "Sự kiện" }}
      />
      <Tab.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ title: "Vé của tôi" }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{ title: "Tin tức" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
}
