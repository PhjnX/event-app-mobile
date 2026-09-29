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
import { View, Dimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
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
import KhungNoiDung from "./src/components/common/KhungNoiDung";

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Từ Android 16, máy màn hình lớn (tablet, máy gập) bỏ qua khai báo khoá hướng
 * trong manifest. Vì vậy manifest không khoá nữa, thay vào đó khoá bằng mã lúc
 * chạy: điện thoại vẫn dọc như cũ vì mọi màn hình đều dựng cho chiều dọc, còn
 * màn hình lớn thì cho xoay tự do.
 *
 * Mốc 600dp là ngưỡng Android dùng để phân biệt điện thoại với máy tính bảng.
 */
const NGUONG_MAN_HINH_LON = 600;

async function khoaHuongManHinh() {
  const { width, height } = Dimensions.get("screen");
  const canhNgan = Math.min(width, height);
  try {
    if (canhNgan < NGUONG_MAN_HINH_LON) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } else {
      await ScreenOrientation.unlockAsync();
    }
  } catch {
    // Khoá hướng không thành công thì bỏ qua, app vẫn chạy bình thường.
  }
}

export default function App() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    khoaHuongManHinh();
  }, []);
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
        setAppIsReady(true);
      }
    };

    prepareApp();
  }, []);

  /**
   * Chỉ ẩn ảnh khởi động của hệ thống khi màn hiệu ứng đã vẽ xong khung đầu
   * tiên. Trước đây ẩn ngay sau khi nạp xong phông chữ, lúc đó React chưa kịp
   * vẽ gì nên lộ ra nền cửa sổ màu trắng rồi một khung đen — người dùng thấy
   * bốn cảnh nhấp nháy trước khi vào được trang chủ.
   */
  const anAnhKhoiDong = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  // Chưa nạp xong phông chữ: không vẽ gì cả, để ảnh khởi động của hệ thống
  // tiếp tục hiện. Trả về khung rỗng ở đây là tự tạo thêm một cảnh thừa.
  if (!appIsReady) return null;

  if (showAnimatedSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a" }} onLayout={anAnhKhoiDong}>
        <SplashArtScreen onFinish={() => setShowAnimatedSplash(false)} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NotificationProvider>
            <KhungNoiDung>
              <AppNavigator />
            </KhungNoiDung>
            <StatusBar style="dark" />
            <Toast config={toastConfig} />
          </NotificationProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
