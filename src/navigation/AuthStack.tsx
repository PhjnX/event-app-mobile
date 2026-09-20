import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

import OnboardingScreen from "../screens/auth/OnboardingScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  onSkip: () => void;
}

export default function AuthStack({ onSkip }: AuthStackProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Trước đây để mặc định nên chuyển màn khá cứng. Trượt từ phải kèm
        // vuốt-để-quay-lại là thói quen người dùng đã quen trên cả hai nền tảng.
        animation: "slide_from_right",
        animationDuration: 240,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome">
        {() => <OnboardingScreen onSkip={onSkip} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
