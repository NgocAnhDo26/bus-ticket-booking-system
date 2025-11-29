"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isCollapsible: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

type NavMainProps = {
  items: NavItem[];
};

function SubMenuItems({ items }: { items: NavItem["items"] }) {
  if (!items) return null;

  return (
    <SidebarMenuSub>
      {items.map((subItem) => (
        <SidebarMenuSubItem key={subItem.title}>
          <SidebarMenuSubButton asChild>
            <Link to={subItem.url}>
              <span>{subItem.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

function CollapsibleNavItem({ item }: { item: NavItem }) {
  return (
    <Collapsible
      key={item.title}
      asChild
      defaultOpen={item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SubMenuItems items={item.items} />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SimpleNavItem({ item }: { item: NavItem }) {
  // If item has sub-items, render them
  if (item.items && item.items.length > 0) {
    return (
      <SidebarMenuItem key={item.title}>
        <SubMenuItems items={item.items} />
      </SidebarMenuItem>
    );
  }

  // Otherwise, render the item itself as a simple link
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton tooltip={item.title} asChild>
        <Link to={item.url}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain({ items }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.isCollapsible ? (
            <CollapsibleNavItem key={item.title} item={item} />
          ) : (
            <SimpleNavItem key={item.title} item={item} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
