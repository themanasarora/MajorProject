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
const [assignmentType, setAssignmentType] = useState("");
const [assignmentDetails, setAssignmentDetails] = useState("");
const [assignmentGradeLevel, setAssignmentGradeLevel] = useState("10");
const [assignmentSubject, setAssignmentSubject] = useState("general");
const [assignmentResult, setAssignmentResult] = useState("");
const [quizSubject, setQuizSubject] = useState("");
const [quizTopic, setQuizTopic] = useState("");
const [quizDifficulty, setQuizDifficulty] = useState("medium");
const [quizGradeLevel, setQuizGradeLevel] = useState("highschool");
const [quizNumQuestions, setQuizNumQuestions] = useState(5);
const [quizResult, setQuizResult] = useState("");

// Summarizer States
const [summaryInput, setSummaryInput] = useState("");
const [summaryLength, setSummaryLength] = useState("medium");
const [file, setFile] = useState<File | null>(null);
const [summaryResult, setSummaryResult] = useState("");

// Translator States
const [translationInput, setTranslationInput] = useState("");
const [translationSource, setTranslationSource] = useState("english");
const [translationTarget, setTranslationTarget] = useState("spanish");
const [translationResult, setTranslationResult] = useState("");

// Notes Generator States
const [notesInput, setNotesInput] = useState("");
const [notesStyle, setNotesStyle] = useState("bullet");
const [notesGrade, setNotesGrade] = useState("highschool");
const [notesSubject, setNotesSubject] = useState("general");
const [notesResult, setNotesResult] = useState("");





const handleGenerateQuiz = async () => {
  if (!quizSubject || !quizTopic.trim()) {
    setQuizResult("❌ Please select a subject and enter a topic");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: quizSubject,
        topic: quizTopic,
        difficulty: quizDifficulty,
        grade_level: quizGradeLevel,
        num_questions: quizNumQuestions
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setQuizResult(data.quiz || "No quiz generated");
  } catch (error) {
    console.error("Quiz generation error:", error);
    setQuizResult("❌ Error generating quiz");
  }
};

const handleGenerateAssignment = async () => {
  if (!assignmentType || !assignmentDetails.trim()) {
    setAssignmentResult("❌ Please select assignment type and enter details");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/generate-assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: assignmentType,
        details: assignmentDetails,
        grade_level: assignmentGradeLevel,
        subject: assignmentSubject
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setAssignmentResult(data.assignment || "No assignment generated");
  } catch (error) {
    console.error("Assignment generation error:", error);
    setAssignmentResult("❌ Error generating assignment");
  }
};

// Summarizer Handler
const handleSummarize = async () => {
  try {
    let response;

    if (summaryInput.trim()) {
      // Summarize text
      response = await fetch("http://localhost:5000/summarize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: summaryInput, 
          length: summaryLength 
        }),
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
    setSummaryResult(data.summary || data.error || "No summary generated");
  } catch (error) {
    console.error(error);
    setSummaryResult("❌ Error generating summary");
  }
};

// Translator Handler
const handleTranslate = async () => {
  if (!translationInput.trim()) {
    setTranslationResult("❌ Please enter text to translate");
    return;
  }

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
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    const firstWord = data.translation?.split(/[\s\n]/)[0] || "No translation";
    setTranslationResult(firstWord);
  } catch (error) {
    console.error(error);
    setTranslationResult("❌ Error generating translation");
  }
};

// Notes Generator Handler
const handleNotes = async () => {
  if (!notesInput.trim()) {
    setNotesResult("❌ Please enter text for notes generation");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/generate-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: notesInput,
        style: notesStyle,
        subject: notesSubject,
        grade: notesGrade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setNotesResult(data.notes || data.error || "No notes generated");
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
{/* Summarizer Tab */}
<TabsContent value="summarizer" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Summarizer Input Card */}
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
        {/* Summary Length */}
        <div>
          <label className="text-sm font-medium mb-2 block">Summary Length</label>
          <Select value={summaryLength} onValueChange={setSummaryLength}>
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
            placeholder="Paste the text you want to summarize here...
Examples:
- Article content
- Lecture notes
- Research paper abstract
- Book chapter"
            value={summaryInput}
            onChange={(e) => setSummaryInput(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Or Upload File</label>
          <div
            className="flex flex-col items-center justify-center w-full h-32 
                       border-2 border-dashed border-muted-foreground/25 
                       rounded-xl cursor-pointer bg-background/50 
                       hover:bg-muted/20 transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              PDF files supported
            </span>
          </div>

          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          {file && (
            <div className="mt-2 p-2 bg-primary/10 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">{file.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFile(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          )}
        </div>

        {/* Generate Button */}
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

    {/* Summarizer Result Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="text-lg">Summary Result</CardTitle>
        <CardDescription>Your AI-generated summary will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {summaryResult ? (
            <div className="space-y-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Generated Summary:</p>
              </div>
              <p>{summaryResult}</p>
            </div>
          ) : (
            <div className="text-center space-y-3 mt-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Enter text or upload a file, then click "Generate Summary"
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={!summaryResult}
            onClick={() => {
              navigator.clipboard.writeText(summaryResult);
              // Add toast notification here
            }}
          >
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
        {/* Language Selection Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Source Language */}
          <div>
            <label className="text-sm font-medium mb-2 block">From</label>
            <Select value={translationSource} onValueChange={setTranslationSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="auto">Auto-detect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Language */}
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Select value={translationTarget} onValueChange={setTranslationTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Text to Translate</label>
          <Textarea
            placeholder="Enter the word or phrase you want to translate...
Examples:
- Hello
- Thank you
- Good morning
- How are you?"
            value={translationInput}
            onChange={(e) => setTranslationInput(e.target.value)}
            className="min-h-[150px]"
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
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {translationResult ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary mb-2">Original Text</p>
                <p className="text-lg">{translationInput}</p>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  Translation ({translationTarget})
                </p>
                <p className="text-xl font-semibold text-green-800 dark:text-green-300">
                  {translationResult}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 mt-12">
              <Languages className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Enter text and click "Translate" to see results
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={!translationResult}
            onClick={() => {
              navigator.clipboard.writeText(translationResult);
              // Add toast notification here
            }}
          >
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
{/* Notes Generator Tab */}
<TabsContent value="notes" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Notes Input Card */}
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
        {/* Grade Level */}
        <div>
          <label className="text-sm font-medium mb-2 block">Grade / Level</label>
          <Select value={notesGrade} onValueChange={setNotesGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade/level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elementary">Elementary School</SelectItem>
              <SelectItem value="middle-school">Middle School</SelectItem>
              <SelectItem value="highschool">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="advanced">Advanced / University</SelectItem>
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
              <SelectItem value="detailed">Detailed Format</SelectItem>
              <SelectItem value="qa">Q&A Format</SelectItem>
              <SelectItem value="mindmap">Mind Map</SelectItem>
              <SelectItem value="outline">Outline Format</SelectItem>
              <SelectItem value="cornell">Cornell Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Subject</label>
          <Input
            placeholder="Enter subject/topic (e.g., Biology, History, Mathematics)"
            value={notesSubject}
            onChange={(e) => setNotesSubject(e.target.value)}
          />
        </div>

        {/* Text Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Source Material</label>
          <Textarea
            placeholder="Paste your study material, lecture transcript, or textbook content...
Examples:
- Lecture notes from class
- Textbook chapter content
- Research paper abstract
- Video transcript
- Article content"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="min-h-[150px]"
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

    {/* Notes Result Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="text-lg">Generated Notes</CardTitle>
        <CardDescription>Structured study notes will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {notesResult ? (
            <div className="space-y-3">
              <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
                <p className="text-sm font-medium text-primary">Generated Notes:</p>
                <div className="flex gap-1 text-xs">
                  <Badge variant="secondary">{notesStyle} style</Badge>
                  <Badge variant="secondary">{notesGrade} level</Badge>
                </div>
              </div>
              <div className="notes-content">
                {notesResult}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 mt-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Enter source material and click "Generate Notes" to see results
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={!notesResult}
            onClick={() => {
              navigator.clipboard.writeText(notesResult);
              // Add toast notification here
            }}
          >
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
        {/* Quiz Generator Tab */}
<TabsContent value="quiz" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Quiz Input Card */}
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
        {/* Subject Selection */}
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
              <SelectItem value="biology">Biology</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="computer-science">Computer Science</SelectItem>
              <SelectItem value="economics">Economics</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid for Difficulty and Grade Level */}
        <div className="grid grid-cols-2 gap-4">
          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty</label>
            <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
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
          
          {/* Grade Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">Grade Level</label>
            <Select value={quizGradeLevel} onValueChange={setQuizGradeLevel}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elementary">Elementary</SelectItem>
                <SelectItem value="middle-school">Middle School</SelectItem>
                <SelectItem value="highschool">High School</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="text-sm font-medium mb-2 block">Number of Questions</label>
          <Select value={quizNumQuestions.toString()} onValueChange={(value) => setQuizNumQuestions(parseInt(value))}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Questions</SelectItem>
              <SelectItem value="5">5 Questions</SelectItem>
              <SelectItem value="10">10 Questions</SelectItem>
              <SelectItem value="15">15 Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Topic Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Topic/Focus</label>
          <Textarea
            placeholder="Enter the specific topic or learning objectives for the quiz...
Examples: 
- Photosynthesis process in plants
- World War II major events  
- Quadratic equations and formulas
- Shakespeare's Macbeth themes"
            value={quizTopic}
            onChange={(e) => setQuizTopic(e.target.value)}
            className="min-h-[120px] bg-background/50"
          />
        </div>
        
        {/* Generate Button */}
        <Button 
          className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground" 
          disabled={!quizSubject || !quizTopic.trim()}
          onClick={handleGenerateQuiz}
        >
          <Brain className="h-4 w-4 mr-2" />
          Generate Quiz
        </Button>
      </CardContent>
    </Card>

    {/* Quiz Result Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Generated Quiz
        </CardTitle>
        <CardDescription>Your AI-generated quiz will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {quizResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Quiz Details:</h4>
                <p className="text-sm">Subject: {quizSubject} | Difficulty: {quizDifficulty} | Grade: {quizGradeLevel}</p>
              </div>
              <div className="quiz-content">
                {quizResult}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 mt-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Wand2 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Fill in the details and click "Generate Quiz" to create your custom quiz
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={!quizResult}
            onClick={() => {
              navigator.clipboard.writeText(quizResult);
              // You can add a toast notification here
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Quiz
          </Button>
          <Button variant="outline" className="flex-1" disabled={!quizResult}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>



        {/* Assignment Generator Tab */}
        {/* Assignment Generator Tab */}
<TabsContent value="assignment" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Assignment Input Card */}
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
        {/* Assignment Type and Grade Level Grid */}
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
                <SelectItem value="lab-report">Lab Report</SelectItem>
                <SelectItem value="case-study">Case Study</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Grade Level</label>
            <Select value={assignmentGradeLevel} onValueChange={setAssignmentGradeLevel}>
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
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Subject</label>
          <Input
            placeholder="Enter subject (e.g., Biology, History, Mathematics)"
            value={assignmentSubject}
            onChange={(e) => setAssignmentSubject(e.target.value)}
          />
        </div>
        
        {/* Assignment Details */}
        <div>
          <label className="text-sm font-medium mb-2 block">Assignment Details</label>
          <Textarea
            placeholder="Describe the assignment requirements, learning objectives, and any specific instructions...
Examples:
- Analyze the causes and effects of the Industrial Revolution
- Create a business plan for a startup company
- Write a lab report on chemical reactions
- Design a mobile app interface with wireframes"
            value={assignmentDetails}
            onChange={(e) => setAssignmentDetails(e.target.value)}
            className="min-h-[120px] bg-background/50"
          />
        </div>
        
        {/* Generate Button */}
        <Button 
          className="w-full bg-gradient-primary hover:bg-gradient-secondary/90" 
          disabled={!assignmentType || !assignmentDetails.trim()}
          onClick={handleGenerateAssignment}
        >
          <PenTool className="h-4 w-4 mr-2" />
          Generate Assignment
        </Button>
      </CardContent>
    </Card>

    {/* Assignment Result Card */}
    <Card className="card-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          Generated Assignment
        </CardTitle>
        <CardDescription>Your assignment details will appear here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] p-4 bg-background/50 rounded-lg border-2 border-dashed border-border whitespace-pre-line">
          {assignmentResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Assignment Details:</h4>
                <p className="text-sm">Type: {assignmentType} | Grade: {assignmentGradeLevel} | Subject: {assignmentSubject}</p>
              </div>
              <div className="assignment-content">
                {assignmentResult}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 mt-12">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-muted-foreground">
                Provide assignment details and click "Generate Assignment" to create structured content
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={!assignmentResult}
            onClick={() => {
              navigator.clipboard.writeText(assignmentResult);
              // You can add a toast notification here
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Assignment
          </Button>
          <Button variant="outline" className="flex-1" disabled={!assignmentResult}>
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