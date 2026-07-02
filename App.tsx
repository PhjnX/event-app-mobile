import "./global.css";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { useState, useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";

import store from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { toastConfig } from "./src/components/common/toastConfig";
import { NotificationProvider } from "./src/context/NotificationContext";
import SplashArtScreen from "./src/screens/SplashScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Giữ màn hình native splash không tự động ẩn
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Xử lý ẩn Native Splash và Fallback luồng chuyển màn hình
  useEffect(() => {
    if (!fontsLoaded) return;

    // 1. Ép ẩn Native Splash ngay khi font load xong để lộ Custom Splash/App UI
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Lỗi khi ẩn native splash screen:", e);
      }
    };
    hideNativeSplash();

    // 2. Cơ chế dự phòng: Tự động tắt Animated Splash sau 3.5 giây nếu có lỗi sập ngầm
    const timeoutId = setTimeout(() => {
      setShowAnimatedSplash(false);
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [fontsLoaded]);

  // Nếu font chưa load xong, giữ nguyên màn hình trống (hoặc vẫn đang hiển thị Native Splash)
  if (!fontsLoaded) return null;

  // Hiển thị màn hình Animated Splash Custom
  if (showAnimatedSplash) {
    return (
      <View style={{ flex: 1 }}>
        <SplashArtScreen
          onFinish={() => {
            setShowAnimatedSplash(false);
          }}
        />
      </View>
    );
  }

  // Luồng chính đi vào ứng dụng
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NotificationProvider>
            <AppNavigator />
            <StatusBar style="dark" />
            <Toast config={toastConfig} />
          </NotificationProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
