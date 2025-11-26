export type UserRole = "PASSENGER" | "ADMIN";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
};
