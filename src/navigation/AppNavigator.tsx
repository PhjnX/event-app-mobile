import React, { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppSelector, useAppDispatch } from "../hooks/useRedux";
import { fetchCurrentUser, setSkippedAuth } from "../store/slices/authSlice";
import { ROLES } from "../constants";
import type { RootStackParamList } from "./types";

import AuthStackScreen from "./AuthStack";
import UserTabs from "./UserTabs";
import OrganizerTabs from "./OrganizerTabs";

// Shared Screens
import EventDetailScreen from "../screens/shared/EventDetailScreen";
import NewsDetailScreen from "../screens/shared/NewsDetailScreen";
import EventMomentsScreen from "../screens/user/EventMomentsScreen";

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
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error) {
        // Chưa đăng nhập
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    console.log("handleSkip called - dispatching setSkippedAuth");
    dispatch(setSkippedAuth(true));
  }, [dispatch]);

  if (isInitializing) {
    return null;
  }

  // Hiện Auth nếu: chưa đăng nhập VÀ chưa skip
  const showAuth = !isAuthenticated && !skippedAuth;
  const isOrganizer = isAuthenticated && user?.role === ROLES.ORGANIZER;

  console.log(
    "AppNavigator render - showAuth:",
    showAuth,
    "isAuthenticated:",
    isAuthenticated,
    "skippedAuth:",
    skippedAuth,
  );

  // ... các import giữ nguyên

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showAuth ? (
          // CASE 1: Chưa login & Chưa skip -> Hiện Auth làm màn hình chính
          <Stack.Screen name="Auth">
            {() => <AuthStackScreen onSkip={handleSkip} />}
          </Stack.Screen>
        ) : isOrganizer ? (
          // CASE 2: Organizer
          <>
            <Stack.Screen name="OrganizerMain" component={OrganizerTabs} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            {/* Organizer thường không cần navigate ngược lại Auth trừ khi logout, 
              nhưng nếu cần thiết có thể thêm vào đây */}
          </>
        ) : (
          // CASE 3: User hoặc Guest (Đã Skip)
          <>
            <Stack.Screen name="UserMain" component={UserTabs} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen
              name="EventMoments"
              component={EventMomentsScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Auth"
              options={{ presentation: "modal" }} // Hiệu ứng trượt lên (tuỳ chọn)
            >
              {(props) => (
                <AuthStackScreen
                  {...props}
                  // QUAN TRỌNG: Thay vì dùng handleSkip cũ, ta dùng navigation.goBack()
                  onSkip={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            {/* --------------------- */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
