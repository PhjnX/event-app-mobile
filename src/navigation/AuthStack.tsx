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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {() => <OnboardingScreen onSkip={onSkip} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
