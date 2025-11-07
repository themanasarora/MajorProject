// App.tsx
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
import TeacherHost from "./pages/TeacherHost";
import StudentQuiz from "./pages/StudentQuiz";


const Layout = () => {
  // use userData when available (merged profile + claims)
  const { user, userData } = useAuth();
  const location = useLocation();

  // Hide sidebar/navbar/chat on login, signup, and student welcome page
  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/student";

  // Also ensure layout hidden if no signed-in user
  const shouldShowLayout = !hideLayout && user;

  return (
    <div className="flex h-screen bg-background">
      {shouldShowLayout && <AppSidebar />}
      <div className={`flex-1 flex flex-col overflow-hidden ${shouldShowLayout ? "lg:ml-0" : ""}`}>
        {shouldShowLayout && <TopNavigation />}
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
            <Route path="/quiz-host" element={<ProtectedRoute role="teacher"><TeacherHost /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><StudentQuiz /></ProtectedRoute>} />


            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      {shouldShowLayout && <AIChatBubble />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={new QueryClient()}>
    {/* Force dark theme only */}
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
