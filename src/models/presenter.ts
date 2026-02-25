export interface Presenter {
  presenterId: number;
  fullName: string;
  title: string;
  company: string;
  bio: string;
  avatarUrl: string;
  featured: boolean;
  organizerId?: number;
}
