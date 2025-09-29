import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Languages, BookOpen, Copy, Download, Sparkles, Brain, HelpCircle, PenTool, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input"; // adjust path to your project






export default function StudyTools() {
  const [summaryInput, setSummaryInput] = useState("");
  const [translationInput, setTranslationInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [assignmentDetails, setAssignmentDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [summaryResult, setSummaryResult] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium"); // default to medium
  const [translationResult, setTranslationResult] = useState("");
const [notesResult, setNotesResult] = useState("");
const [translationSource, setTranslationSource] = useState("english");
const [translationTarget, setTranslationTarget] = useState("spanish");
const [notesStyle, setNotesStyle] = useState("bullet");
const [notesGrade, setNotesGrade] = useState("highschool");
const [notesSubject, setNotesSubject] = useState("other");




const handleSummarize = async () => {
  try {
    let response;

    if (summaryInput.trim()) {
      // Summarize text
      response = await fetch("http://localhost:5000/summarize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryInput, length: summaryLength }),
      });
    } else if (file) {
      // Summarize file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("length", summaryLength);

      response = await fetch("http://localhost:5000/summarize-file", {
        method: "POST",
        body: formData,
      });
    } else {
      setSummaryResult("❌ Please enter text or upload a file");
      return;
    }

    const data = await response.json();
    setSummaryResult(data.summary || "No summary generated");
  } catch (error) {
    console.error(error);
    setSummaryResult("❌ Error generating summary");
  }
};

const handleTranslate = async () => {
  try {
    const response = await fetch("http://localhost:5000/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: translationInput,
        source: translationSource,
        target: translationTarget,
      }),
    });
    const data = await response.json();
    // pick only the first word
    const firstWord = data.translation?.split(/[\s\n]/)[0] || "No translation";
    setTranslationResult(firstWord);
  } catch (error) {
    console.error(error);
    setTranslationResult("❌ Error generating translation");
  }
};


const handleNotes = async () => {
  if (!notesInput.trim()) return;

  try {
    const response = await fetch("http://localhost:5000/generate-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: notesInput,
        style: notesStyle,
        subject: notesSubject,
        grade: notesGrade, // added grade info
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // Optional: remove any extra instructions or explanations from API
    let cleanNotes = data.notes || "No notes generated";
    // If notes come as a string with extra text, you can parse it here
    // e.g., remove trailing prompts or chatbot instructions

    setNotesResult(cleanNotes);
  } catch (error) {
    console.error("Notes generation error:", error);
    setNotesResult("❌ Error generating notes");
  }
};






  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Study Tools</h1>
          <p className="text-muted-foreground">AI-powered tools for summarizing, translating, and note generation</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Enhanced
        </Badge>
      </div>

      <Tabs defaultValue="summarizer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:max-w-2xl">
          <TabsTrigger value="summarizer">Summarizer</TabsTrigger>
          <TabsTrigger value="translator">Translator</TabsTrigger>
          <TabsTrigger value="notes">Notes Gen</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Gen</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
        </TabsList>

        {/* Summarizer Tab */}
        {/* Summarizer Tab */}
<TabsContent value="summarizer" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card className="card-gentle">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Text / File Summarizer</CardTitle>
            <CardDescription>Summarize text, PDFs, or images</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Summary Length</label>
          <Select defaultValue="medium">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short (2-3 sentences)</SelectItem>
              <SelectItem value="medium">Medium (1 paragraph)</SelectItem>
              <SelectItem value="long">Long (2-3 paragraphs)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Text to Summarize</label>
          <Textarea
            placeholder="Paste the text you want to summarize here..."
            value={summaryInput}
            onChange={(e) => setSummaryInput(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        {/* File Upload */}
<div>
  <label
    htmlFor="file-upload"
    className="flex flex-col items-center justify-center w-full h-32 
               border-2 border-dashed border-muted-foreground/25 
               rounded-xl cursor-pointer bg-background/50 
               hover:bg-muted/20 transition-colors"
  >
    <span className="text-sm text-muted-foreground">
      Click to upload or drag and drop
    </span>
    <span className="text-xs text-muted-foreground mt-1">
      PDF or Image files
    </span>
  </label>

  <input
    id="file-upload"
    type="file"
    accept=".pdf,image/*"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
    className="hidden"
  />

  {file && (
    <p className="text-xs text-muted-foreground mt-2">
      Selected file: <span className="font-medium">{file.name}</span>
    </p>
  )}
</div>


        <Button
          className="w-full"
          disabled={!summaryInput.trim() && !file}
          onClick={handleSummarize}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Summary
        </Button>
      </CardContent>
    </Card>

    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="text-lg">Summary Result</CardTitle>
        <CardDescription>Your AI-generated summary will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border">
          {summaryResult ? (
            <p>{summaryResult}</p>
          ) : (
            <p className="text-muted-foreground text-center mt-16">
              Enter text or upload a file, then click "Generate Summary"
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={!summaryResult}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" className="flex-1" disabled={!summaryResult}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>


        {/* Translator Tab */}
        <TabsContent value="translator" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Translator Input Card */}
    <Card className="card-gentle">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Languages className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Language Translator</CardTitle>
            <CardDescription>Translate text to different languages</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* From (Source Language) */}
          <div>
            <label className="text-sm font-medium mb-2 block">From</label>
            <Select value={translationSource} onValueChange={setTranslationSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="auto">Auto-detect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* To (Target Language) */}
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Select value={translationTarget} onValueChange={setTranslationTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Textarea for input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Text to Translate</label>
          <Textarea
            placeholder="Enter text to translate..."
            value={translationInput}
            onChange={(e) => setTranslationInput(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        {/* Translate Button */}
        <Button
          className="w-full"
          disabled={!translationInput.trim()}
          onClick={handleTranslate}
        >
          <Languages className="h-4 w-4 mr-2" />
          Translate
        </Button>
      </CardContent>
    </Card>

    {/* Translator Result Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="text-lg">Translation Result</CardTitle>
        <CardDescription>Translated text will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border">
          {translationResult ? (
            <p>{translationResult}</p>
          ) : (
            <p className="text-muted-foreground text-center mt-16">
              Enter text and click "Translate" to see results
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={!translationResult}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" className="flex-1" disabled={!translationResult}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>


        {/* Notes Generator Tab */}
<TabsContent value="notes" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* Input Card */}
    <Card className="card-gentle">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Notes Generator</CardTitle>
            <CardDescription>Convert text into structured study notes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Grade Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Grade / Level</label>
          <Select value={notesGrade} onValueChange={setNotesGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade/level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="highschool">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="advanced">Advanced / AP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Note Style</label>
          <Select value={notesStyle} onValueChange={setNotesStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullet">Bullet Points</SelectItem>
              <SelectItem value="detailed">detailed Format</SelectItem>
              <SelectItem value="qa">Q&A Format</SelectItem>
              <SelectItem value="mindmap">Mind Map</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Subject</label>
          <Input
            placeholder="Enter subject/topic"
            value={notesSubject}
            onChange={(e) => setNotesSubject(e.target.value)}
          />
        </div>

        {/* Text Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Source Material</label>
          <Textarea
            placeholder="Paste your study material, lecture transcript, or textbook content..."
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          disabled={!notesInput.trim()}
          onClick={handleNotes}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Generate Notes
        </Button>
      </CardContent>
    </Card>

    {/* Output Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="text-lg">Generated Notes</CardTitle>
        <CardDescription>Structured study notes will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {notesResult ? (
            <p>{notesResult}</p>
          ) : (
            <p className="text-muted-foreground text-center mt-16">
              Enter source material and click "Generate Notes" to see results
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={!notesResult}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" className="flex-1" disabled={!notesResult}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>



        {/* Quiz Generator Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-gentle border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-primary rounded-xl">
                    <Brain className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Quiz Generator</CardTitle>
                    <CardDescription>Create custom quizzes with AI assistance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Select value={quizSubject} onValueChange={setQuizSubject}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="geography">Geography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Topic/Focus</label>
                  <Textarea
                    placeholder="Enter the specific topic or learning objectives for the quiz..."
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    className="min-h-[120px] bg-background/50"
                  />
                </div>
                
                <Button className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground" disabled={!quizSubject || !quizTopic.trim()}>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Quiz
                </Button>
              </CardContent>
            </Card>

            <Card className="card-gentle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Generated Quiz
                </CardTitle>
                <CardDescription>Your AI-generated quiz will appear here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[200px] p-6 bg-gradient-subtle rounded-xl border-2 border-dashed border-border/50">
                  <div className="text-center space-y-3 mt-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Wand2 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      Fill in the details and click "Generate Quiz" to create your custom quiz
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" disabled>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Quiz
                  </Button>
                  <Button variant="outline" className="flex-1" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assignment Generator Tab */}
        <TabsContent value="assignment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-gentle border-secondary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-primary rounded-xl">
                    <PenTool className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Assignment Generator</CardTitle>
                    <CardDescription>Create detailed assignments and projects</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assignment Type</label>
                    <Select value={assignmentType} onValueChange={setAssignmentType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="research">Research Project</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="worksheet">Worksheet</SelectItem>
                        <SelectItem value="creative">Creative Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grade Level</label>
                    <Select defaultValue="10">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">Grade 6</SelectItem>
                        <SelectItem value="7">Grade 7</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                        <SelectItem value="12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Assignment Details</label>
                  <Textarea
                    placeholder="Describe the assignment requirements, learning objectives, and any specific instructions..."
                    value={assignmentDetails}
                    onChange={(e) => setAssignmentDetails(e.target.value)}
                    className="min-h-[120px] bg-background/50"
                  />
                </div>
                
                <Button className="w-full bg-gradient-primary hover:bg-gradient-secondary/90" disabled={!assignmentType || !assignmentDetails.trim()}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Generate Assignment
                </Button>
              </CardContent>
            </Card>

            <Card className="card-gentle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Generated Assignment
                </CardTitle>
                <CardDescription>Your assignment details will appear here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[200px] p-6 bg-gradient-subtle rounded-xl border-2 border-dashed border-border/50">
                  <div className="text-center space-y-3 mt-12">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-8 w-8 text-secondary" />
                    </div>
                    <p className="text-muted-foreground">
                      Provide assignment details and click "Generate Assignment" to create structured content
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" disabled>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Assignment
                  </Button>
                  <Button variant="outline" className="flex-1" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}