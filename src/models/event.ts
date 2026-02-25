export interface Event {
  eventId: number;
  eventName: string;
  slug?: string;
  description?: string;
  location?: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  organizerName?: string;
  organizerSlug?: string;
  status?: string;
  visibility?: string;
  totalRegistrations?: number;
  maxAttendees?: number;
}

export interface Activity {
  activityId: number;
  activityName: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  activityImageUrl?: string;
  presenterName?: string;
  presenterAvatarUrl?: string;
}

export interface Registration {
  registrationId: number;
  eventId: number;
  eventName: string;
  eventSlug?: string;
  eventBanner?: string;
  eventStartDate: string;
  eventEndDate?: string;
  location?: string;
  status: string;
  ticketCode?: string;
  createdAt: string;
  activityNames?: string[];
}
