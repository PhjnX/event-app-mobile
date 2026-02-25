import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QRScannerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary-dark">
      <View className="flex-1 px-4 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-gold mb-4">
          📷 Quét QR
        </Text>
        <View className="bg-white/10 rounded-xl p-8">
          <Text className="text-white/50">QR Scanner placeholder</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
