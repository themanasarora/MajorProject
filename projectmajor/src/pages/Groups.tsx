import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, MessageCircle, Settings } from "lucide-react";

const teacherGroups = [
  {
    id: 1,
    name: "Mathematics Department",
    type: "Teacher Group",
    description: "Collaborate with fellow math teachers on curriculum planning and resource sharing",
    members: 12,
    lastActivity: "2 hours ago",
    avatar: "/placeholder.svg",
    unread: 3
  },
  {
    id: 2,
    name: "Science Faculty",
    type: "Teacher Group",
    description: "Science department collaboration for lab activities and STEM initiatives", 
    members: 8,
    lastActivity: "1 day ago",
    avatar: "/placeholder.svg",
    unread: 0
  }
];

const studentGroups = [
  {
    id: 3,
    name: "Grade 10A - Mathematics",
    type: "Student Group",
    description: "Advanced mathematics class focusing on algebra and geometry concepts",
    members: 28,
    lastActivity: "5 minutes ago",
    avatar: "/placeholder.svg",
    unread: 12
  },
  {
    id: 4,
    name: "Grade 10B - Physics",
    type: "Student Group",
    description: "Physics fundamentals with emphasis on practical experiments and theory",
    members: 25,
    lastActivity: "1 hour ago",
    avatar: "/placeholder.svg",
    unread: 5
  },
  {
    id: 5,
    name: "Grade 9A - Chemistry",
    type: "Student Group",
    description: "Introduction to chemistry with lab work and chemical reactions study",
    members: 30,
    lastActivity: "3 hours ago",
    avatar: "/placeholder.svg",
    unread: 0
  }
];

export default function Groups() {
  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground">Manage your teacher and student groups</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Teacher Groups */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Teacher Groups</h2>
          <Badge variant="secondary">{teacherGroups.length}</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teacherGroups.map((group) => (
            <Card key={group.id} className="card-gentle hover:card-gentle-hover cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <CardDescription className="text-xs">{group.type}</CardDescription>
                    </div>
                  </div>
                  {group.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">{group.unread}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{group.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{group.members} members</span>
                  <span>{group.lastActivity}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Student Groups */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-secondary" />
          <h2 className="text-xl font-semibold">Student Groups</h2>
          <Badge variant="secondary">{studentGroups.length}</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {studentGroups.map((group) => (
            <Card key={group.id} className="card-gentle hover:card-gentle-hover cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <CardDescription className="text-xs">{group.type}</CardDescription>
                    </div>
                  </div>
                  {group.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">{group.unread}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{group.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{group.members} students</span>
                  <span>{group.lastActivity}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}