import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch } from "../../hooks/useRedux";
import { logoutUser } from "../../store/slices/authSlice";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-dark">
      <View className="flex-1 px-4">
        <Text className="text-2xl font-bold text-primary-gold mt-4 mb-6">
          👤 Organizer Profile
        </Text>

        <View className="bg-white/10 rounded-xl p-4 mb-4">
          <Text className="text-white/50">Profile info placeholder</Text>
        </View>

        <TouchableOpacity
          className="bg-red-500 py-4 rounded-xl mt-4"
          onPress={handleLogout}
        >
          <Text className="text-center text-white font-bold text-lg">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
