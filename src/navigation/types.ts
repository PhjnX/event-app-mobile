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
  MyTickets: undefined;
  News: undefined;
  Profile: undefined;
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
  Moments: { eventSlug: string };
  ActivityQRScanner: undefined;
  EventMoments: { eventId: number; eventName: string };
};
