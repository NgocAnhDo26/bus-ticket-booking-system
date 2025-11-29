import { type UserRole } from "@/types/user";

export const getDashboardPath = (role?: UserRole | null) =>
  role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
