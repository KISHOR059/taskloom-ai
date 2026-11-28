import {
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
} from "lucide-react";
import { Suspense, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import ThemeToggle from "@/features/theme/ThemeToggle";
import { CommandPaletteProvider } from "@/features/command-palette";
import { useCommandPalette } from "@/features/command-palette/command-palette.hooks";
import { CommandShortcuts } from "@/features/command-palette/CommandShortcuts";
import {
  NotificationBell,
  NotificationDrawer,
  useNotificationEffects,
} from "@/features/notifications";
import RouteLoading from "@/app/RouteLoading";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/auth.context";
import SessionManager from "@/features/auth/session/SessionManager";
import { TaskloomLogo } from "@/shared/components/TaskloomLogo";
import AssistantFloatingWidget from "@/features/assistant/AssistantFloatingWidget";

const mainNavigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Tasks", icon: CheckSquare, to: "/tasks" },
  { label: "Calendar", icon: CalendarDays, to: "/calendar" },
  { label: "Notes", icon: FileText, to: "/notes" },
];

const bottomNavigationItems = [
  { label: "Settings", icon: Settings, to: "/settings" },
];

function SidebarNavigation({
  items,
  collapsed = false,
  ariaLabel = "Primary navigation",
}: {
  items: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; to: string }>;
  collapsed?: boolean;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="space-y-1">
      {items.map(({ label, icon: Icon, to }) => {
        const linkEl = (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg text-xs font-medium transition-all duration-150",
                collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                  : "text-muted-foreground hover:bg-accent/90 hover:text-accent-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        );

        if (collapsed) {
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs font-medium">{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return linkEl;
      })}
    </nav>
  );
}

function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar/95">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border/80",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <TaskloomLogo size="sm" iconOnly={collapsed} />
        {onToggleCollapse && !collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar rail"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Collapse rail</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ScrollArea className={cn("flex-1 py-4", collapsed ? "px-2" : "px-3")}>
        <SidebarNavigation items={mainNavigationItems} collapsed={collapsed} />
      </ScrollArea>

      <div
        className={cn(
          "mt-auto shrink-0 border-t border-sidebar-border/80 space-y-1",
          collapsed ? "p-2" : "p-3",
        )}
      >
        <SidebarNavigation
          items={bottomNavigationItems}
          collapsed={collapsed}
          ariaLabel="Secondary navigation"
        />
        {onToggleCollapse && collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                aria-label="Expand sidebar"
                className="w-full h-9 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "TL";

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <NavLink to="/login">Login</NavLink>
        </Button>
        <Button asChild size="sm">
          <NavLink to="/register">Register</NavLink>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open account menu"
          className="rounded-full size-8"
          size="icon"
          variant="ghost"
        >
          <Avatar className="size-8 border border-primary/30">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {user ? `${user.firstName} ${user.lastName}` : "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to="/settings">Settings</NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void logout();
          }}
          className="text-rose-600 focus:text-rose-600"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const IS_MAC = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

function CommandPaletteSearchButton() {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search commands"
      className="flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-border/80 bg-muted/50 px-2.5 sm:px-3 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-accent/70 hover:text-foreground shadow-2xs"
    >
      <Search className="size-3.5 shrink-0 text-primary/80" />
      <span className="min-w-0 flex-1 truncate text-left">
        Search or jump to…
      </span>
      <span className="hidden sm:inline-flex">
        <CommandShortcuts keys={[IS_MAC ? "⌘" : "Ctrl", "K"]} />
      </span>
    </button>
  );
}

function AppLayout() {
  useNotificationEffects();
  const [railCollapsed, setRailCollapsed] = useState(true);

  return (
    <CommandPaletteProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Desktop Collapsible Rail Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 hidden border-r border-sidebar-border/80 bg-sidebar lg:block transition-[width] duration-200",
            railCollapsed ? "w-16" : "w-56",
          )}
        >
          <Sidebar
            collapsed={railCollapsed}
            onToggleCollapse={() => setRailCollapsed((prev) => !prev)}
          />
        </aside>

        <div
          className={cn(
            "flex flex-1 flex-col transition-[padding] duration-200",
            railCollapsed ? "lg:pl-16" : "lg:pl-56",
          )}
        >
          {/* Pro-Density Command Bar Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-3 border-b border-border/75 bg-background/90 px-3 sm:px-5 backdrop-blur-md">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    aria-label="Open navigation"
                    className="size-8 shrink-0"
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-64 max-w-[85vw] p-0" side="left">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Sidebar />
                </SheetContent>
              </Sheet>

              <TaskloomLogo size="sm" textClassName="hidden sm:inline-block" />
            </div>

            <div className="max-w-lg flex-1">
              <CommandPaletteSearchButton />
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Badge
                variant="outline"
                className="hidden sm:inline-flex h-5 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider rounded-full border-primary/30 bg-primary/10 text-primary select-none cursor-default"
                title="Taskloom is currently in beta"
                aria-label="Taskloom is currently in beta"
              >
                BETA
              </Badge>
              <NotificationDrawer>
                <NotificationBell />
              </NotificationDrawer>
              <ThemeToggle />
              <Separator orientation="vertical" className="h-5" />
              <UserMenu />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] flex-1 p-3 sm:p-4 lg:p-6 space-y-4">
            <Suspense fallback={<RouteLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <SessionManager />
        <AssistantFloatingWidget />
      </div>
    </CommandPaletteProvider>
  );
}

export default AppLayout;
