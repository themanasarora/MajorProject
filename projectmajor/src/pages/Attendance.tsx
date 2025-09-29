import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, UserCheck } from "lucide-react";
import { useState } from "react";

const initialStudents = [
  { id: 1, name: "Alice Johnson", isPresent: true },
  { id: 2, name: "Bob Smith", isPresent: true },
  { id: 3, name: "Carol Davis", isPresent: false },
  { id: 4, name: "David Wilson", isPresent: false },
  { id: 5, name: "Emma Brown", isPresent: true },
  { id: 6, name: "Frank Miller", isPresent: true },
];

export default function Attendance() {
  const [students, setStudents] = useState(initialStudents);
  
  const toggleAttendance = (studentId: number) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  const presentCount = students.filter(student => student.isPresent).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select defaultValue="grade-10a">
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade-10a">Grade 10A</SelectItem>
              <SelectItem value="grade-10b">Grade 10B</SelectItem>
              <SelectItem value="grade-9a">Grade 9A</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <Card className="card-gentle">
            <CardHeader>
              <CardTitle>Today's Attendance - Grade 10A</CardTitle>
              <CardDescription>Mathematics Class • {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={student.isPresent}
                        onCheckedChange={() => toggleAttendance(student.id)}
                        className="h-5 w-5"
                      />
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.isPresent ? "Present" : "Absent"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week">
          <Card className="card-gentle">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Weekly attendance report will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="month">
          <Card className="card-gentle">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Monthly attendance report will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}