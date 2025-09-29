import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Save, Calendar, Tag } from "lucide-react";

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const initialNotes: Note[] = [
  {
    id: 1,
    title: "Lesson Plan - Algebra Basics",
    content: "Cover linear equations, variables, and basic algebraic operations. Include practice problems and group activities.",
    tags: ["math", "lesson-plan", "grade-10"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    title: "Parent Meeting Notes",
    content: "Discussed Alice's progress in mathematics. Parents are pleased with improvement. Suggested additional practice at home.",
    tags: ["parent-meeting", "alice-johnson"],
    createdAt: "2024-01-14",
    updatedAt: "2024-01-14"
  },
  {
    id: 3,
    title: "Quiz Ideas - Photosynthesis",
    content: "Multiple choice questions about chlorophyll, light reactions, Calvin cycle. Include diagrams and labeling exercises.",
    tags: ["science", "quiz", "biology"],
    createdAt: "2024-01-13",
    updatedAt: "2024-01-13"
  }
];

export default function Notepad() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "New Note",
      content: "",
      tags: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    if (isEditing) {
      handleSaveNote();
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleEditNote = () => {
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (selectedNote) {
      const updatedNotes = notes.map(note =>
        note.id === selectedNote.id
          ? {
              ...note,
              title: editTitle,
              content: editContent,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : note
      );
      setNotes(updatedNotes);
      setSelectedNote({ ...selectedNote, title: editTitle, content: editContent });
    }
    setIsEditing(false);
  };

  const handleDeleteNote = (noteId: number) => {
    setNotes(notes.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notepad</h1>
          <p className="text-muted-foreground">Keep track of your teaching notes and ideas</p>
        </div>
        <Button onClick={handleNewNote} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-all hover:card-gentle-hover ${
                  selectedNote?.id === note.id ? 'ring-2 ring-primary/20 bg-accent/20' : 'card-gentle'
                }`}
                onClick={() => handleSelectNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {note.updatedAt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <Card className="card-gentle h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      />
                    ) : (
                      <CardTitle className="text-lg">{selectedNote.title}</CardTitle>
                    )}
                    <CardDescription className="text-xs mt-1">
                      Last updated: {selectedNote.updatedAt}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <Button size="sm" onClick={handleSaveNote}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleEditNote}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="min-h-[400px] resize-none border-none p-0 focus-visible:ring-0"
                  />
                ) : (
                  <div className="min-h-[400px] whitespace-pre-wrap text-sm">
                    {selectedNote.content || "No content yet. Click Edit to add content."}
                  </div>
                )}
                
                {/* Tags */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {selectedNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-gentle h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No note selected</p>
                  <p className="text-sm">Select a note from the list or create a new one to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}