export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email: string };
};

export type UserTabParamList = {
  Home: undefined;
  Events: undefined;
  Moments: undefined;
  News: undefined;
  MyTickets: undefined;
};

export type OrganizerTabParamList = {
  Home: undefined;
  QRScanner: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  UserMain: undefined;
  OrganizerMain: undefined;
  EventDetail: { slug: string };
  NewsDetail: { slug: string };
  EventMoments: { eventId: number; eventName: string };
  MyTickets: undefined;
  Profile: undefined;
  ActivityQRScanner: { ticketCode?: string } | undefined;
  Notifications: undefined;
  RegisterOrganizer: undefined;
  NotificationsOrganizerScreen: undefined;
};
