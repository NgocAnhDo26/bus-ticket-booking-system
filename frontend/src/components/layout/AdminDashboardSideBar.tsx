import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Tickets } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useNav } from "@/hooks/useNav";

export function AdminDashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { adminNavItems, userData } = useNav();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <a
          href="#"
          className={cn(
            "flex items-center gap-3 font-medium p-2",
            isCollapsed && "justify-center",
          )}
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md shrink-0">
            <Tickets className="size-5" />
          </div>
          <p
            className={cn(
              "text-xl font-semibold overflow-hidden text-ellipsis text-nowrap",
              isCollapsed && "hidden",
            )}
          >
            SwiftRide
          </p>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
