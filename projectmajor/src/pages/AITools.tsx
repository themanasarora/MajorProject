import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FileQuestion, PenTool, Sparkles, Download, Copy } from "lucide-react";

export default function AITools() {
  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">AI Tools</h1>
          <p className="text-muted-foreground">Generate quizzes and assignments with AI assistance</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-gentle hover:card-gentle-hover">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileQuestion className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Quiz Generator</CardTitle>
                <CardDescription>Create custom quizzes with AI assistance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Difficulty Level</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Topic/Keywords</label>
                <Textarea 
                  placeholder="Enter the topic or keywords for your quiz..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <Button className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Generate Quiz
            </Button>
          </CardContent>
        </Card>

        <Card className="card-gentle hover:card-gentle-hover">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <PenTool className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle>Assignment Generator</CardTitle>
                <CardDescription>Create engaging assignments automatically</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Assignment Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="problem-solving">Problem Solving</SelectItem>
                    <SelectItem value="research">Research Project</SelectItem>
                    <SelectItem value="creative">Creative Writing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Grade Level</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade-8">Grade 8</SelectItem>
                    <SelectItem value="grade-9">Grade 9</SelectItem>
                    <SelectItem value="grade-10">Grade 10</SelectItem>
                    <SelectItem value="grade-11">Grade 11</SelectItem>
                    <SelectItem value="grade-12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Assignment Details</label>
                <Textarea 
                  placeholder="Describe what you want the assignment to cover..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <Button className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Generate Assignment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="recent">Recent Generations</TabsTrigger>
          <TabsTrigger value="saved">Saved Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-gentle">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Math Quiz - Algebra</CardTitle>
                    <CardDescription className="text-xs">Generated 2 hours ago</CardDescription>
                  </div>
                  <Badge variant="outline">Quiz</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  10 questions covering linear equations and basic algebraic concepts...
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gentle">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Science Assignment - Photosynthesis</CardTitle>
                    <CardDescription className="text-xs">Generated yesterday</CardDescription>
                  </div>
                  <Badge variant="outline">Assignment</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  Research project on plant photosynthesis process with practical experiments...
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          <Card className="card-gentle">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Your saved templates will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}