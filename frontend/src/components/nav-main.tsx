'use client';

import { Link, useLocation } from 'react-router-dom';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

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

// Helper function to check if a path matches the current location
const isPathActive = (path: string, currentPath: string): boolean => {
  if (path === '#' || !path) return false;
  if (path === currentPath) return true;
  // Check if current path starts with the item path (for nested routes)
  // But only if the path is not just a prefix (e.g., /admin should not match /admin/dashboard)
  // We want exact matches or paths that are clearly nested
  if (currentPath.startsWith(path + '/')) {
    return true;
  }
  return false;
};

function SubMenuItems({ items, currentPath }: { items: NavItem['items']; currentPath: string }) {
  if (!items) return null;

  return (
    <SidebarMenuSub>
      {items.map((subItem) => {
        const isActive = isPathActive(subItem.url, currentPath);
        return (
          <SidebarMenuSubItem key={subItem.title}>
            <SidebarMenuSubButton asChild isActive={isActive}>
              <Link to={subItem.url}>
                <span>{subItem.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  );
}

function CollapsibleNavItem({ item, currentPath }: { item: NavItem; currentPath: string }) {
  // Check if any sub-item is active
  const hasActiveSubItem =
    item.items?.some((subItem) => isPathActive(subItem.url, currentPath)) ?? false;
  const isOpen = hasActiveSubItem || item.isActive;

  return (
    <Collapsible key={item.title} asChild defaultOpen={isOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={hasActiveSubItem}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SubMenuItems items={item.items} currentPath={currentPath} />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SimpleNavItem({ item, currentPath }: { item: NavItem; currentPath: string }) {
  // If item has sub-items, render them
  if (item.items && item.items.length > 0) {
    return (
      <SidebarMenuItem key={item.title}>
        <SubMenuItems items={item.items} currentPath={currentPath} />
      </SidebarMenuItem>
    );
  }

  // Use isActive prop if provided, otherwise check path
  const isActive =
    item.isActive !== undefined ? item.isActive : isPathActive(item.url, currentPath);
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
        <Link to={item.url}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.isCollapsible ? (
            <CollapsibleNavItem key={item.title} item={item} currentPath={currentPath} />
          ) : (
            <SimpleNavItem key={item.title} item={item} currentPath={currentPath} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
