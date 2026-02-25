export interface User {
  slug?: string;
  uid?: string;
  id?: number;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
}
