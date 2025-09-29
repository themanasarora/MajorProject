import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Star, TrendingUp, Award } from "lucide-react";

const students = [
  { 
    id: 1, 
    name: "Alice Johnson", 
    overallGrade: "A", 
    percentage: 92, 
    subjects: {
      math: { grade: "A+", score: 95 },
      science: { grade: "A", score: 89 },
      english: { grade: "A", score: 92 }
    },
    attendance: 96,
    behavior: "Excellent"
  },
  { 
    id: 2, 
    name: "Bob Smith", 
    overallGrade: "B+", 
    percentage: 87, 
    subjects: {
      math: { grade: "B+", score: 88 },
      science: { grade: "A-", score: 85 },
      english: { grade: "B+", score: 89 }
    },
    attendance: 94,
    behavior: "Good"
  },
  { 
    id: 3, 
    name: "Carol Davis", 
    overallGrade: "A-", 
    percentage: 89, 
    subjects: {
      math: { grade: "A", score: 91 },
      science: { grade: "A-", score: 87 },
      english: { grade: "A", score: 90 }
    },
    attendance: 98,
    behavior: "Excellent"
  }
];

export default function Reports() {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBehaviorBadge = (behavior: string) => {
    const variants = {
      "Excellent": "bg-green-100 text-green-800 border-green-200",
      "Good": "bg-blue-100 text-blue-800 border-blue-200",
      "Satisfactory": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Needs Improvement": "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <Badge className={variants[behavior as keyof typeof variants] || variants["Satisfactory"]}>
        {behavior}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Report Cards</h1>
          <p className="text-muted-foreground">Generate and manage student report cards</p>
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
            <FileText className="h-4 w-4 mr-2" />
            Generate All Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">23</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">15</p>
            <p className="text-xs text-muted-foreground">A Grades</p>
          </CardContent>
        </Card>
        
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">87%</p>
            <p className="text-xs text-muted-foreground">Avg. Score</p>
          </CardContent>
        </Card>
        
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">18</p>
            <p className="text-xs text-muted-foreground">Reports Ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Report Cards */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card key={student.id} className="card-gentle hover:card-gentle-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <CardDescription className="text-xs">Overall Grade: {student.overallGrade}</CardDescription>
                    </div>
                    <div className={`text-2xl font-bold ${getGradeColor(student.overallGrade)}`}>
                      {student.overallGrade}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Score</span>
                      <span className="font-medium">{student.percentage}%</span>
                    </div>
                    <Progress value={student.percentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Math:</span>
                      <span className={getGradeColor(student.subjects.math.grade)}>
                        {student.subjects.math.grade} ({student.subjects.math.score}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Science:</span>
                      <span className={getGradeColor(student.subjects.science.grade)}>
                        {student.subjects.science.grade} ({student.subjects.science.score}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">English:</span>
                      <span className={getGradeColor(student.subjects.english.grade)}>
                        {student.subjects.english.grade} ({student.subjects.english.score}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Attendance: {student.attendance}%
                    </div>
                    {getBehaviorBadge(student.behavior)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card className="card-gentle">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Detailed individual report cards will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}