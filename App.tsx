import "./global.css";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { useState, useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";

import store from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { toastConfig } from "./src/components/common/toastConfig";
import { NotificationProvider } from "./src/context/NotificationContext";
import SplashArtScreen from "./src/screens/SplashScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
          ...AntDesign.font,
          ...Ionicons.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
          ...MaterialCommunityIcons.font,
          ...Feather.font,
        });
      } catch (e) {
        console.warn("Lỗi khi nạp asset font hoặc icon:", e);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {}
        setAppIsReady(true);
      }
    };

    prepareApp();

    const timeoutId = setTimeout(() => {
      setShowAnimatedSplash(false);
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: "#0a0a0a" }} />;
  }

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
