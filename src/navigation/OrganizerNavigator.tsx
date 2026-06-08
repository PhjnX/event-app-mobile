import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OrganizerTabs from "./OrganizerTabs";
import OrganizerEventDetailScreen from "../screens/organizer/EventDetailScreen";
import { OrganizerRegistrationsScreen } from "../screens/organizer/RegistrationsScreen";
import OrganizerQRScannerScreen from "../screens/organizer/QRScannerScreen";

export type OrganizerStackParamList = {
  OrganizerTabsRoot: undefined;
  OrganizerEventDetail: { event: any };
  OrganizerRegistrations: {
    eventId: number;
    eventName?: string;
    activityId?: number;
    activityName?: string;
  };
  OrganizerQRScanner: {
    activityId?: number;
    activityName?: string;
    activities?: any[];
    eventId?: number;
    prefillTicket?: string;
  };
};

const Stack = createNativeStackNavigator<OrganizerStackParamList>();

export default function OrganizerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrganizerTabsRoot" component={OrganizerTabs} />
      <Stack.Screen
        name="OrganizerEventDetail"
        component={OrganizerEventDetailScreen}
      />
      <Stack.Screen
        name="OrganizerRegistrations"
        component={OrganizerRegistrationsScreen}
      />
      <Stack.Screen
        name="OrganizerQRScanner"
        component={OrganizerQRScannerScreen}
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
}
