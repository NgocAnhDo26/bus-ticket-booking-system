import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "./api";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60,
  });
};
