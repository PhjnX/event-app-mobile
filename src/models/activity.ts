import type { Presenter } from "./presenter";

export interface ActivityCategory {
  categoryId: number;
  categoryName: string;
}

export interface Activity {
  activityId: number;
  activityName: string;
  description: string;
  startTime: string;
  endTime: string;
  roomOrVenue: string;
  eventId: number;
  category: ActivityCategory;
  presenter: Presenter;
  activityImageUrl?: string;
}
