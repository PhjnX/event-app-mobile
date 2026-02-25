export interface Organizer {
  website: string;
  createdAt: string | number | Date;
  organizerName: string;
  organizerId: number;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  contactPhoneNumber: string;
  contactEmail: string;
  userId: number;
  username: string;
  approved: boolean;
  locked: boolean;
  unlockRequested: boolean;
}
