import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { AIChatBubble } from "@/components/layout/AIChatBubble";
import Index from "./pages/Index";
import Groups from "./pages/Groups";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Notepad from "./pages/Notepad";
import StudyTools from "./pages/StudyTools";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StudentWelcome from "./components/StudentWelcome";

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide sidebar/navbar/chat on login, signup, and student welcome page
  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/student";

  return (
    <div className="flex h-screen bg-background">
      {!hideLayout && user && <AppSidebar />}
      <div className={`flex-1 flex flex-col overflow-hidden ${!hideLayout && user ? "lg:ml-0" : ""}`}>
        {!hideLayout && user && <TopNavigation />}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Route */}
            <Route path="/student" element={<ProtectedRoute><StudentWelcome /></ProtectedRoute>} />

            {/* Protected Teacher Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/notepad" element={<ProtectedRoute><Notepad /></ProtectedRoute>} />
            <Route path="/study-tools" element={<ProtectedRoute><StudyTools /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      {!hideLayout && user && <AIChatBubble />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
