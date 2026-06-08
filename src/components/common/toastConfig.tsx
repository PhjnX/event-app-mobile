import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ToastConfig } from "react-native-toast-message";

type ToastProps = {
  text1?: string;
  text2?: string;
};

const ToastBase = ({
  icon,
  iconColor,
  accentColor,
  text1,
  text2,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  accentColor: string;
  text1?: string;
  text2?: string;
}) => (
  <View
    style={{
      width: "90%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#141414",
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.07)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
      // ✅ FIX: đã xóa gap: 12
    }}
  >
    {/* Left accent bar */}
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 12,
        bottom: 12,
        width: 3,
        borderRadius: 99,
        backgroundColor: accentColor,
      }}
    />

    {/* Icon — FIX: thay gap bằng marginRight */}
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: `${accentColor}18`,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 6,
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>

    {/* Text */}
    <View style={{ flex: 1 }}>
      {text1 ? (
        <Text
          style={{
            color: "#fff",
            fontWeight: "700",
            fontSize: 14,
            marginBottom: text2 ? 2 : 0,
          }}
          numberOfLines={1}
        >
          {text1}
        </Text>
      ) : null}
      {text2 ? (
        <Text
          style={{ color: "#888", fontSize: 12, lineHeight: 17 }}
          numberOfLines={2}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }: ToastProps) => (
    <ToastBase
      icon="checkmark-circle"
      iconColor="#4ade80"
      accentColor="#4ade80"
      text1={text1}
      text2={text2}
    />
  ),
  error: ({ text1, text2 }: ToastProps) => (
    <ToastBase
      icon="close-circle"
      iconColor="#f87171"
      accentColor="#f87171"
      text1={text1}
      text2={text2}
    />
  ),
  info: ({ text1, text2 }: ToastProps) => (
    <ToastBase
      icon="information-circle"
      iconColor="#D8C97B"
      accentColor="#D8C97B"
      text1={text1}
      text2={text2}
    />
  ),
  warning: ({ text1, text2 }: ToastProps) => (
    <ToastBase
      icon="warning"
      iconColor="#fb923c"
      accentColor="#fb923c"
      text1={text1}
      text2={text2}
    />
  ),
};
