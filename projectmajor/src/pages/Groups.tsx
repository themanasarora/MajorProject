"use client";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "@/firebase";
import { useAuth } from "@/contexts/Authcontext";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Send, 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Paperclip,
  FileText,
  Image,
  X,
  Download,
  File
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Groups() {
  const { userData, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    grade: ""
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-600">Loading user data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if no user data after auth loading is complete
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Unable to load user data</p>
              <p className="text-sm mt-2 text-gray-600">Please check your authentication and try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch groups
  useEffect(() => {
    const initGroups = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("🔍 Initializing groups for:", {
          uid: userData.uid,
          role: userData.role,
          grade: userData.grade
        });

        // Students can only read groups for their grade
        if (userData.role === "student" && !userData.grade) {
          setError("Student grade information missing");
          setLoading(false);
          return;
        }

        // Set up real-time listener for groups
        let groupsQuery;
        if (userData.role === "teacher") {
          // Teachers see all groups ordered by name
          groupsQuery = query(collection(db, "groups"), orderBy("name"));
        } else {
          // Students see only their grade's group, ordered by name
          groupsQuery = query(
            collection(db, "groups"), 
            where("grade", "==", userData.grade),
            orderBy("name")
          );
        }

        const unsubscribe = onSnapshot(
          groupsQuery,
          (snapshot) => {
            const groupsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log("✅ Groups loaded:", groupsData);
            setGroups(groupsData);
            setLoading(false);
            
            // Auto-select first group if none selected and user is student
            if (userData.role === "student" && groupsData.length > 0 && !selectedGroup) {
              setSelectedGroup(groupsData[0]);
            }
          },
          (error) => {
            console.error("❌ Error loading groups:", error);
            setError(`Failed to load groups: ${error.message}`);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (err) {
        console.error("❌ Error in initGroups:", err);
        setError(`Error setting up groups: ${err.message}`);
        setLoading(false);
      }
    };

    initGroups();
  }, [userData]);

  // Subscribe to messages of selected group
  useEffect(() => {
    if (!selectedGroup) {
      setMessages([]);
      return;
    }

    console.log("Setting up messages listener for group:", selectedGroup.id);

    try {
      const messagesRef = collection(db, "groups", selectedGroup.id, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || new Date()
          }));
          setMessages(messagesData);
        },
        (error) => {
          console.error("Error loading messages:", error);
          setError(`Failed to load messages: ${error.message}`);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up messages listener:", err);
      setError(`Error setting up messages: ${err.message}`);
    }
  }, [selectedGroup]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError("Please select a valid file type (JPEG, PNG, GIF, or PDF)");
      return;
    }

    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setFileToUpload(file);
    setShowFileUpload(true);
  };

  // Upload file to Firebase Storage
  const uploadFile = async () => {
    if (!fileToUpload || !selectedGroup) return;

    try {
      setUploading(true);
      setError("");

      // Create a unique file name
      const fileExtension = fileToUpload.name.split('.').pop();
      const fileName = `group_${selectedGroup.id}_${Date.now()}.${fileExtension}`;
      const fileRef = ref(storage, `group-files/${selectedGroup.id}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(fileRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Get file type
      const fileType = fileToUpload.type.startsWith('image/') ? 'image' : 'pdf';

      // Save message with file
      await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
        text: newMessage.trim(), // Include text if any
        fileUrl: downloadURL,
        fileName: fileToUpload.name,
        fileType: fileType,
        senderId: userData.uid,
        senderName: userData.name || userData.email,
        senderRole: userData.role,
        timestamp: serverTimestamp(),
      });

      // Reset states
      setFileToUpload(null);
      setShowFileUpload(false);
      setUploading(false);
      setNewMessage(""); // Clear text input

      console.log("✅ File uploaded successfully:", fileName);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(`Failed to upload file: ${err.message}`);
      setUploading(false);
    }
  };

  // Send new message (text only)
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || !selectedGroup) return;
    
    try {
      setError("");
      await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
        text: newMessage.trim(),
        senderId: userData.uid,
        senderName: userData.name || userData.email,
        senderRole: userData.role,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError(`Failed to send message: ${err.message}`);
    }
  };

  // Send message with file
  const sendMessageWithFile = async (e) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() && !fileToUpload) return;
    
    try {
      setError("");
      
      if (fileToUpload) {
        await uploadFile();
      } else {
        await sendMessage(e);
      }
      
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message with file:", err);
      setError(`Failed to send message: ${err.message}`);
    }
  };

  // Download file
  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (fileType === 'image') {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle Enter key for sending message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageWithFile(e);
    }
  };

  // Create new group (Teachers only)
  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim() || !groupForm.grade.trim()) return;

    try {
      setCreatingGroup(true);
      setError("");

      const groupId = `grade_${groupForm.grade.replace(/\s+/g, "_").toLowerCase()}`;
      
      // Check if group already exists
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        setError("A group for this grade already exists");
        setCreatingGroup(false);
        return;
      }

      // Create the group
      await setDoc(doc(db, "groups", groupId), {
        name: groupForm.name,
        description: groupForm.description,
        grade: groupForm.grade,
        type: "Class Group",
        members: [userData.uid],
        createdBy: userData.uid,
        createdAt: serverTimestamp(),
        teacherIds: [userData.uid],
      });

      // Reset form
      setGroupForm({ name: "", description: "", grade: "" });
      setCreatingGroup(false);

      console.log("✅ Group created successfully:", groupId);
    } catch (err) {
      console.error("Error creating group:", err);
      setError(`Failed to create group: ${err.message}`);
      setCreatingGroup(false);
    }
  };

  // Edit group (Teachers only)
  const editGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup || !groupForm.name.trim()) return;

    try {
      setError("");
      await updateDoc(doc(db, "groups", editingGroup.id), {
        name: groupForm.name,
        description: groupForm.description,
        updatedAt: serverTimestamp(),
      });

      setEditingGroup(null);
      setGroupForm({ name: "", description: "", grade: "" });
    } catch (err) {
      console.error("Error editing group:", err);
      setError(`Failed to edit group: ${err.message}`);
    }
  };

  // Delete group (Teachers only)
  const deleteGroup = async () => {
    if (!deletingGroup) return;

    try {
      setError("");
      
      // First, delete all messages in the group
      const messagesRef = collection(db, "groups", deletingGroup.id, "messages");
      const messagesSnap = await getDocs(messagesRef);
      
      const deletePromises = messagesSnap.docs.map((doc) => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Then delete the group itself
      await deleteDoc(doc(db, "groups", deletingGroup.id));
      
      setDeletingGroup(null);
      setSelectedGroup(null);
    } catch (err) {
      console.error("Error deleting group:", err);
      setError(`Failed to delete group: ${err.message}`);
    }
  };

  // Open edit dialog
  const openEditDialog = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      grade: group.grade
    });
  };

  // Reset form
  const resetForm = () => {
    setGroupForm({ name: "", description: "", grade: "" });
    setEditingGroup(null);
    setCreatingGroup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-600">Loading groups...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Class Groups
              </h1>
              <p className="text-gray-600 mt-1">
                {userData.role === "teacher" 
                  ? "Manage class groups and communicate with students" 
                  : `Your class group - Grade ${userData.grade}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                <CardContent className="p-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{userData.name || userData.email}</span>
                    <span className="text-gray-500"> • {userData.role}</span>
                    {userData.role === "student" && (
                      <span className="text-gray-500"> • Grade {userData.grade}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Create Group Button (Teachers only) */}
              {userData.role === "teacher" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Create New Class Group</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Create a new group for a specific grade level. Students will automatically see their grade's group.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createGroup}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label htmlFor="grade" className="text-sm font-medium text-gray-700">
                            Grade Level *
                          </label>
                          <Input
                            id="grade"
                            placeholder="e.g., 10th Grade, 11th Grade"
                            value={groupForm.grade}
                            onChange={(e) => setGroupForm({...groupForm, grade: e.target.value})}
                            required
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Group Name *
                          </label>
                          <Input
                            id="name"
                            placeholder="e.g., Grade 10 Class"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                            required
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <Textarea
                            id="description"
                            placeholder="Brief description of the group..."
                            value={groupForm.description}
                            onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                            rows={3}
                            className="bg-white"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creatingGroup} className="bg-blue-600 hover:bg-blue-700">
                          {creatingGroup ? "Creating..." : "Create Group"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Groups Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5" />
                    {userData.role === "teacher" ? "All Class Groups" : "Your Class Group"}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {userData.role === "teacher" 
                      ? "Manage and view all class groups" 
                      : `Grade ${userData.grade} - View only`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groups.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No groups available</p>
                      <p className="text-sm mt-1">
                        {userData.role === "teacher" 
                          ? "Create your first class group" 
                          : "No group found for your grade"}
                      </p>
                    </div>
                  ) : (
                    groups.map((group) => (
                      <Card
                        key={group.id}
                        className={`cursor-pointer transition-all border-2 bg-white/60 backdrop-blur-sm ${
                          selectedGroup?.id === group.id 
                            ? "border-blue-500 bg-blue-50/50" 
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center gap-3 flex-1"
                              onClick={() => setSelectedGroup(group)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {group.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                                <p className="text-sm text-gray-600 truncate">
                                  {group.members?.length || 0} members
                                </p>
                                <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-700">
                                  {group.grade}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Group Actions (Teachers only) */}
                            {userData.role === "teacher" && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(group)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingGroup(group)}
                                  className="text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              {selectedGroup ? (
                <Card className="h-full bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-900">{selectedGroup.name}</CardTitle>
                        <CardDescription className="text-gray-600">{selectedGroup.description}</CardDescription>
                      </div>
                      <div className="text-sm text-gray-500">
                        {messages.length} messages
                        {userData.role === "student" && (
                          <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700">
                            <Eye className="h-3 w-3 mr-1" />
                            View Only
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Messages Container */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-sm mt-1">
                            {userData.role === "teacher" 
                              ? "Start the conversation with your students!" 
                              : "No messages yet in this group"}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.senderId === userData.uid ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                                msg.senderId === userData.uid
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : msg.senderRole === "teacher"
                                  ? "bg-blue-100 border border-blue-200 text-gray-900 rounded-bl-none"
                                  : "bg-gray-100 text-gray-900 rounded-bl-none"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${
                                  msg.senderId === userData.uid 
                                    ? "text-blue-100" 
                                    : msg.senderRole === "teacher"
                                    ? "text-blue-700"
                                    : "text-gray-600"
                                }`}>
                                  {msg.senderName}
                                </span>
                                <span className={`text-xs ${
                                  msg.senderId === userData.uid 
                                    ? "text-blue-200" 
                                    : msg.senderRole === "teacher"
                                    ? "text-blue-600"
                                    : "text-gray-500"
                                }`}>
                                  {msg.senderRole}
                                </span>
                              </div>
                              
                              {/* File Message */}
                              {msg.fileUrl && (
                                <div className={`mb-2 p-3 rounded-lg border ${
                                  msg.senderId === userData.uid 
                                    ? "bg-blue-500/20 border-blue-400/30" 
                                    : "bg-white border-gray-200"
                                }`}>
                                  <div className="flex items-center gap-3">
                                    {getFileIcon(msg.fileType)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {msg.fileName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {msg.fileType === 'image' ? 'Image' : 'PDF Document'}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => downloadFile(msg.fileUrl, msg.fileName)}
                                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Image Preview */}
                                  {msg.fileType === 'image' && (
                                    <div className="mt-2">
                                      <img 
                                        src={msg.fileUrl} 
                                        alt={msg.fileName}
                                        className="max-w-full h-32 object-cover rounded-lg cursor-pointer border"
                                        onClick={() => window.open(msg.fileUrl, '_blank')}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Text Message */}
                              {msg.text && (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              )}
                              
                              <p className={`text-xs mt-2 ${
                                msg.senderId === userData.uid 
                                  ? "text-blue-200" 
                                  : msg.senderRole === "teacher"
                                  ? "text-blue-600/70"
                                  : "text-gray-500"
                              }`}>
                                {msg.timestamp?.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* File Upload Preview */}
                    {showFileUpload && fileToUpload && (
                      <div className="border-t p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-900">File to Upload</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFileToUpload(null);
                              setShowFileUpload(false);
                            }}
                            className="h-6 w-6 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                          {getFileIcon(fileToUpload.type.startsWith('image/') ? 'image' : 'pdf')}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{fileToUpload.name}</p>
                            <p className="text-xs text-gray-600">
                              {formatFileSize(fileToUpload.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Input - Only for Teachers */}
                    {userData.role === "teacher" && (
                      <div className="border-t border-gray-200 p-4 bg-white/50">
                        <form onSubmit={sendMessageWithFile} className="flex gap-2">
                          <div className="flex-1 flex gap-2">
                            <Input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Type your message or upload a file..."
                              className="flex-1 bg-white border-gray-300"
                            />
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              accept=".pdf,.jpg,.jpeg,.png,.gif,image/*"
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              className="border-gray-300 text-gray-600 hover:text-gray-700"
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button 
                            type="submit" 
                            disabled={(!newMessage.trim() && !fileToUpload) || uploading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send
                              </>
                            )}
                          </Button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                          Supported files: PDF, JPG, PNG, GIF (max 10MB)
                        </p>
                      </div>
                    )}

                    {/* View Only Notice for Students */}
                    {userData.role === "student" && (
                      <div className="border-t border-gray-200 p-4 bg-gray-100/50">
                        <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4" />
                          View only - Teachers can send messages and files in this group
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {userData.role === "teacher" ? "No Group Selected" : "No Group Available"}
                    </h3>
                    <p className="text-gray-600">
                      {userData.role === "teacher" 
                        ? "Select a group from the sidebar to view and send messages" 
                        : "No group is available for your grade. Contact your teacher."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Edit Group Dialog */}
          <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Edit Group</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Update the group name and description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editGroup}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                      Group Name *
                    </label>
                    <Input
                      id="edit-name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Textarea
                      id="edit-description"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                      rows={3}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Grade (Cannot be changed)
                    </label>
                    <Input
                      value={groupForm.grade}
                      disabled
                      className="bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Group Confirmation */}
          <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  This will permanently delete the group "{deletingGroup?.name}" and all its messages. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteGroup} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}