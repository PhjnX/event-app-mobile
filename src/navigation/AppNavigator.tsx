import React, { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppSelector, useAppDispatch } from "../hooks/useRedux";
import { fetchCurrentUser, setSkippedAuth } from "../store/slices/authSlice";
import { ROLES, STORAGE_KEYS } from "../constants";
import storageService from "../services/storageService";
import type { RootStackParamList } from "./types";

import AuthStackScreen from "./AuthStack";
import UserTabs from "./UserTabs";
import OrganizerNavigator from "./OrganizerNavigator";

// --- IMPORT SCREENS DÀNH CHO USER / SHARED ---
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import EventDetailScreen from "../screens/shared/EventDetailScreen";
import NewsDetailScreen from "../screens/shared/NewsDetailScreen";
import EventMomentsScreen from "../screens/user/EventMomentsScreen";
import MyTicketsScreen from "../screens/user/MyTicketsScreen";
import ProfileScreen from "../screens/user/ProfileScreen";
import ActivityQRScannerScreen from "../screens/user/ActivityQRScannerScreen";
import RegisterOrganizerScreen from "../screens/user/Registerorganizerscreen";

// --- IMPORT SCREENS RIÊNG CHO ORGANIZER ---
import NotificationsOrganizerScreen from "../screens/organizer/NotificationsOrganizerScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, skippedAuth } = useAppSelector(
    (state) => state.auth,
  );
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          setIsInitializing(false);
          return;
        }
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error) {
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const handleSkip = useCallback(
    () => dispatch(setSkippedAuth(true)),
    [dispatch],
  );

  if (isInitializing) return null;

  const showAuth = !isAuthenticated && !skippedAuth;
  const isOrganizer = isAuthenticated && user?.role === ROLES.ORGANIZER;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showAuth ? (
          <Stack.Screen name="Auth">
            {() => <AuthStackScreen onSkip={handleSkip} />}
          </Stack.Screen>
        ) : isOrganizer ? (
          <>
            {/* --- LUỒNG MÀN HÌNH CỦA ORGANIZER --- */}
            <Stack.Screen name="OrganizerMain" component={OrganizerNavigator} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="EventMoments" component={EventMomentsScreen} />
            <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

            {/* Gọi đúng màn hình Notifications riêng của Organizer */}
            <Stack.Screen
              name="NotificationsOrganizerScreen"
              component={NotificationsOrganizerScreen}
            />

            <Stack.Screen
              name="RegisterOrganizer"
              component={RegisterOrganizerScreen}
            />
          </>
        ) : (
          <>
            {/* --- LUỒNG MÀN HÌNH CỦA USER --- */}
            <Stack.Screen name="UserMain" component={UserTabs} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="EventMoments" component={EventMomentsScreen} />
            <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="ActivityQRScanner"
              component={ActivityQRScannerScreen}
              options={{ presentation: "fullScreenModal" }}
            />

            {/* Gọi màn hình Notifications chung cho User */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />

            <Stack.Screen
              name="RegisterOrganizer"
              component={RegisterOrganizerScreen}
            />
            <Stack.Screen name="Auth" options={{ presentation: "modal" }}>
              {(props) => (
                <AuthStackScreen
                  {...props}
                  onSkip={() => {
                    if (props.navigation.canGoBack()) props.navigation.goBack();
                    else props.navigation.navigate("UserMain");
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
