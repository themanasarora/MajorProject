import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar, Users, UserCheck, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugLog = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Fetch role + grade of logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      try {
        addDebugLog("🔍 Fetching user role...");
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role);
          addDebugLog(`✅ User role: ${data.role}`);

          if (data.role === "student") {
            navigate("/student");
          } else if (data.role === "teacher") {
            const teacherGrade = data.grade;
            setSelectedGrade(teacherGrade);
            addDebugLog(`📚 Teacher's grade: ${teacherGrade}`);
          }
        } else {
          addDebugLog("❌ User document not found");
        }
      } catch (error) {
        addDebugLog(`💥 Error fetching role: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, navigate]);

  // Fetch students for the teacher's grade
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedGrade) return;

      setLoading(true);
      addDebugLog(`👥 Fetching students for grade: ${selectedGrade}`);
      
      try {
        const colRef = collection(db, "users");
        const q = query(
          colRef,
          where("role", "==", "student"),
          where("grade", "==", selectedGrade)
        );

        const snapshot = await getDocs(q);
        addDebugLog(`✅ Found ${snapshot.size} students in grade ${selectedGrade}`);
        
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isPresent: true, // default to present
        }));

        setStudents(list);

        // Log student details for debugging
        list.forEach(student => {
          addDebugLog(`   📝 ${student.name || student.email} (${student.id})`);
        });

      } catch (error) {
        addDebugLog(`❌ Error fetching students: ${error.message}`);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedGrade]);

  // Debug function to check attendance data
  const debugAttendanceData = async () => {
    try {
      const date = new Date().toISOString().split("T")[0];
      addDebugLog(`\n🔍 DEBUG: Checking attendance for ${date}`);
      
      // Check if attendance collection exists
      const attendanceRef = collection(db, "attendance", selectedGrade, "dates", date, "students");
      const snapshot = await getDocs(attendanceRef);
      
      addDebugLog(`📊 Found ${snapshot.size} attendance records for today`);
      
      if (snapshot.size > 0) {
        snapshot.forEach(doc => {
          const data = doc.data();
          addDebugLog(`   ✅ ${data.name}: ${data.isPresent ? 'Present' : 'Absent'} (${doc.id})`);
        });
      } else {
        addDebugLog(`   ❌ No attendance records found for today`);
      }

    } catch (error) {
      addDebugLog(`💥 Debug error: ${error.message}`);
    }
  };

  // Toggle attendance checkbox
  const toggleAttendance = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isPresent: !s.isPresent } : s
      )
    );
  };

  // Save attendance to Firestore
  const markAttendance = async () => {
    if (!selectedGrade || students.length === 0) {
      toast.error("No students to mark attendance for");
      return;
    }

    setSaving(true);
    addDebugLog(`\n💾 Starting to save attendance...`);

    try {
      const date = new Date().toISOString().split("T")[0];
      const batch = writeBatch(db);

      addDebugLog(`📅 Date: ${date}`);
      addDebugLog(`🎯 Grade: ${selectedGrade}`);
      addDebugLog(`👥 Students: ${students.length}`);

      students.forEach((student) => {
        const ref = doc(
          db,
          "attendance",
          selectedGrade,
          "dates",
          date,
          "students",
          student.id
        );
        
        const attendanceData = {
          name: student.name || student.email || "Unnamed Student",
          email: student.email,
          grade: selectedGrade,
          isPresent: student.isPresent,
          markedAt: new Date(),
          markedBy: user.uid,
        };

        batch.set(ref, attendanceData);
        addDebugLog(`   ${student.isPresent ? '✅' : '❌'} ${student.name}: ${student.isPresent ? 'Present' : 'Absent'}`);
      });

      await batch.commit();
      addDebugLog(`🎉 Successfully saved attendance for ${students.length} students`);
      
      toast.success(`Attendance saved for ${students.length} students!`);
      
      // Debug after saving
      await debugAttendanceData();

    } catch (error) {
      console.error("Error saving attendance:", error);
      addDebugLog(`💥 Save error: ${error.message}`);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Mark all students as present
  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, isPresent: true })));
    addDebugLog("📝 Marked all students as Present");
  };

  // Mark all students as absent
  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, isPresent: false })));
    addDebugLog("📝 Marked all students as Absent");
  };

  // Refresh students list
  const refreshStudents = () => {
    if (selectedGrade) {
      addDebugLog("🔄 Refreshing students list...");
      const fetchStudents = async () => {
        setLoading(true);
        try {
          const colRef = collection(db, "users");
          const q = query(
            colRef,
            where("role", "==", "student"),
            where("grade", "==", selectedGrade)
          );

          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isPresent: true,
          }));

          setStudents(list);
          addDebugLog(`✅ Refreshed: ${list.length} students`);
        } catch (error) {
          addDebugLog(`❌ Refresh error: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    }
  };

  const presentCount = students.filter((s) => s.isPresent).length;
  const absentCount = students.length - presentCount;

  if (loading && students.length === 0) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading attendance system...</p>
        </div>
      </div>
    );
  }

  if (role !== "teacher") {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>This page is for teachers only.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Attendance System
          </h1>
          <p className="text-muted-foreground">
            Grade {selectedGrade} • {students.length} students
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={refreshStudents} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={markAttendance} 
            disabled={saving || students.length === 0}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={markAllPresent} variant="outline" size="sm">
          Mark All Present
        </Button>
        <Button onClick={markAllAbsent} variant="outline" size="sm">
          Mark All Absent
        </Button>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl">
        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {students.length}
            </p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>

        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {presentCount}
            </p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>

        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {absentCount}
            </p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>

        <Card className="card-gentle">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {presentCount > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
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
              <CardTitle>
                Today's Attendance - Grade {selectedGrade}
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground mb-2">No students found for Grade {selectedGrade}</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure students are registered with this grade in their profiles.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        student.isPresent 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={student.isPresent}
                          onCheckedChange={() => toggleAttendance(student.id)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {student.name || student.email || "Unnamed Student"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.email} • {student.isPresent ? "Present" : "Absent"}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        student.isPresent 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isPresent ? "PRESENT" : "ABSENT"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Panel */}
      {debugInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Debug Information
            </CardTitle>
            <CardDescription>
              Technical details for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              {debugInfo.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => navigator.clipboard.writeText(debugInfo.join('\n'))}
                variant="outline" 
                size="sm"
              >
                Copy Logs
              </Button>
              <Button 
                onClick={() => setDebugInfo([])}
                variant="outline" 
                size="sm"
              >
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}