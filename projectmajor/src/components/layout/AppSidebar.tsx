import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Bot,
  FileText,
  StickyNote,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Groups", url: "/groups", icon: Users },
  { title: "Attendance", url: "/attendance", icon: Calendar },
  { title: "Report Cards", url: "/reports", icon: FileText },
  { title: "Notepad", url: "/notepad", icon: StickyNote },
  { title: "Study Tools", url: "/study-tools", icon: BookOpen },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col fixed lg:relative z-50 lg:z-auto",
        isCollapsed ? "w-16" : "w-64",
        "lg:translate-x-0"
      )}
    >
      {/* Header with toggle */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                TeacherAssist
              </h1>
              <p className="text-xs text-sidebar-foreground/70">
                Making education easier ✨
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "sidebar-item",
              isActive(item.url) && "active"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Motivational footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="card-gentle p-3 text-center">
            <p className="motivational-text">
              🌟 You're doing great today!
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}