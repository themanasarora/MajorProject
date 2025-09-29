import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Bot, FileText, TrendingUp, Star } from "lucide-react";

// Removed stats section per user request

const quickActions = [
  {
    title: "Take Attendance",
    description: "Mark today's attendance for all your classes",
    icon: Calendar,
    action: "attendance",
  },
  {
    title: "AI Study Tools",
    description: "Generate quizzes, assignments and study materials",
    icon: Bot,
    action: "study-tools",
  },
  {
    title: "Create Report Cards",
    description: "Generate detailed student progress reports",
    icon: FileText,
    action: "reports",
  },
  {
    title: "Manage Groups",
    description: "Organize and communicate with your classes",
    icon: Users,
    action: "groups",
  },
];

export function DashboardCards() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card-gentle p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back, Teacher! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to inspire young minds today? Let's make learning amazing!
            </p>
          </div>
          <div className="text-6xl">🌟</div>
        </div>
      </div>

      {/* Removed stats section per user request */}

      {/* Quick Actions */}
      <Card className="card-gentle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, idx) => (
              <Card
                key={idx}
                className="card-gentle hover:card-gentle-hover cursor-pointer group transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-primary rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <action.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-gentle bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Daily Inspiration</h3>
            <p className="text-sm opacity-90">
              "The best teachers are those who show you where to look but don't tell you what to see."
            </p>
          </CardContent>
        </Card>

        <Card className="card-gentle bg-gradient-secondary">
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2 text-foreground">AI Tip of the Day</h3>
            <p className="text-sm text-muted-foreground">
              Try using the AI quiz generator to create personalized assessments that adapt to your students' learning pace!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}