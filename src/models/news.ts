export interface Post {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string;
  status?: string;
  createdAt: string;
  authorName?: string;
}
