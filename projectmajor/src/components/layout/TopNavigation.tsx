import { useState } from "react";
import { Search, LogIn, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";  // ✅ import your auth hook
import { useNavigate } from "react-router-dom";    // ✅ for redirect

export function TopNavigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();  // ✅ get user + logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();       // ✅ call Firebase logout
      navigate("/login");   // ✅ redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Left side - Logo/Title on mobile */}
      <div className="flex items-center">
        <h2 className="font-semibold text-foreground md:hidden">TeacherAssist</h2>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search students, classes, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Right side - Theme toggle and Logout */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full hover:bg-muted"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Logout button (only if logged in) */}
        {user && (
          <Button className="button-friendly px-6" onClick={handleLogout}>
            <LogIn className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
