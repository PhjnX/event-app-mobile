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

// Interface Activity từng được khai ở đây đã bị xoá: nó trùng tên với bản trong
// models/activity.ts khiến models/index.ts không export được cái nào (TS2308),
// mà lại đặt sai tên gần hết các trường so với ActivityResponseDTO của backend
// (location/maxParticipants/presenterName... đều không tồn tại). Không file nào
// import nó. Dùng bản trong ./activity.ts — bản khớp với backend.

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
