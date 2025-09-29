import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
              <TopNavigation />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/notepad" element={<Notepad />} />
                  <Route path="/study-tools" element={<StudyTools />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <AIChatBubble />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
