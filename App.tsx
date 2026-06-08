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

import { useState, useCallback } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";

import store from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { toastConfig } from "./src/components/common/toastConfig";
import { NotificationProvider } from "./src/context/NotificationContext";
import SplashArtScreen from "./src/screens/SplashScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  if (showAnimatedSplash) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SplashArtScreen onFinish={() => setShowAnimatedSplash(false)} />
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
