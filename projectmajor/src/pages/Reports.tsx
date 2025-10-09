import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function ReportCardManager() {
  const [mode, setMode] = useState<"upload" | "view">("upload");

  // === Data States ===
  const [grades, setGrades] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  // === Upload States ===
  const [marks, setMarks] = useState({ math: "", science: "", english: "" });
  const [loading, setLoading] = useState(false);

  // === View States ===
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [viewGradeFilter, setViewGradeFilter] = useState<string>("all");
  const [viewStudentFilter, setViewStudentFilter] = useState<string>("all");
  const [filteredReports, setFilteredReports] = useState<any[]>([]);

  // === Fetch Students & Grades ===
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "student"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStudents(list);

        const uniqueGrades = Array.from(new Set(list.map((s) => s.grade))).sort();
        setGrades(uniqueGrades);
      } catch (err) {
        console.error("Error fetching students:", err);
        alert("Failed to fetch students.");
      }
    };

    fetchStudents();
  }, []);

  // === Filter Students by Grade (Upload Section) ===
  useEffect(() => {
    if (selectedGrade) {
      const filtered = students.filter((s) => s.grade === selectedGrade);
      setFilteredStudents(filtered);
      setSelectedStudent("");
    } else {
      setFilteredStudents([]);
      setSelectedStudent("");
    }
  }, [selectedGrade, students]);

  // === Fetch Reports (View Section) ===
  useEffect(() => {
    if (mode === "view") fetchReportCards();
  }, [mode]);

  const fetchReportCards = async () => {
    setFetchingReports(true);
    try {
      const reportsRef = collection(db, "report_cards");
      const snap = await getDocs(reportsRef);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReportCards(list);
    } catch (err) {
      console.error("Error fetching report cards:", err);
      alert("Failed to fetch report cards.");
    } finally {
      setFetchingReports(false);
    }
  };

  // === Calculate Grade ===
  const calculateGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    return "D";
  };

  // === Upload Report ===
  const handleUpload = async () => {
    if (!selectedGrade) return alert("Select a grade");
    if (!selectedStudent) return alert("Select a student");

    setLoading(true);
    try {
      const student = students.find((s) => s.id === selectedStudent);
      if (!student) throw new Error("Student not found");

      const subjects = {
        math: { score: Number(marks.math), grade: calculateGrade(Number(marks.math)) },
        science: { score: Number(marks.science), grade: calculateGrade(Number(marks.science)) },
        english: { score: Number(marks.english), grade: calculateGrade(Number(marks.english)) },
      };

      const total = Number(marks.math) + Number(marks.science) + Number(marks.english);
      const overallPercentage = Math.round(total / 3);
      const overallGrade = calculateGrade(overallPercentage);

      await setDoc(doc(db, "report_cards", student.id), {
        studentId: student.id,
        name: student.name,
        grade: student.grade,
        subjects,
        overallPercentage,
        overallGrade,
        createdAt: serverTimestamp(),
      });

      alert("Report uploaded successfully ✅");
      setMarks({ math: "", science: "", english: "" });
      setSelectedStudent("");
      setSelectedGrade("");
    } catch (err) {
      console.error("Error uploading report:", err);
      alert("Error uploading report ❌");
    } finally {
      setLoading(false);
    }
  };

  // === Apply Filters for Viewing ===
  useEffect(() => {
    let filtered = reportCards;

    if (viewGradeFilter !== "all") {
      filtered = filtered.filter((r) => r.grade === viewGradeFilter);
    }

    if (viewStudentFilter !== "all") {
      filtered = filtered.filter((r) => r.studentId === viewStudentFilter);
    }

    setFilteredReports(filtered);
  }, [viewGradeFilter, viewStudentFilter, reportCards]);

  // === Filter Students (for View Mode dropdown) ===
  const viewStudents = viewGradeFilter === "all"
    ? students
    : students.filter((s) => s.grade === viewGradeFilter);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 border rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-center">Report Card Manager</h2>

      {/* Mode Switch */}
      <div className="flex justify-center gap-4 mb-4">
        <Button variant={mode === "upload" ? "default" : "outline"} onClick={() => setMode("upload")}>
          Upload Reports
        </Button>
        <Button variant={mode === "view" ? "default" : "outline"} onClick={() => setMode("view")}>
          View Reports
        </Button>
      </div>

      {/* Upload Reports Section */}
      {mode === "upload" && (
        <>
          <Select onValueChange={setSelectedGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={setSelectedStudent}
            disabled={!selectedGrade || filteredStudents.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedGrade ? "Select Student" : "Select grade first"} />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Math Marks"
              value={marks.math}
              onChange={(e) => setMarks({ ...marks, math: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Science Marks"
              value={marks.science}
              onChange={(e) => setMarks({ ...marks, science: e.target.value })}
            />
            <Input
              type="number"
              placeholder="English Marks"
              value={marks.english}
              onChange={(e) => setMarks({ ...marks, english: e.target.value })}
            />
          </div>

          <Button onClick={handleUpload} disabled={loading || !selectedStudent} className="w-full">
            {loading ? "Uploading..." : "Upload Report"}
          </Button>
        </>
      )}

      {/* View Reports Section */}
      {mode === "view" && (
        <>
          {/* Grade Filter */}
          <Select onValueChange={setViewGradeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Student Filter */}
          <Select
            onValueChange={setViewStudentFilter}
            disabled={viewStudents.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {viewStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

{/* Report Cards */}
<div className="space-y-4 mt-2">
  {fetchingReports ? (
    <p>Loading report cards...</p>
  ) : filteredReports.length === 0 ? (
    <p>No report cards found.</p>
  ) : (
    filteredReports.map((report) => (
      <div
        key={report.id}
        className="border p-3 rounded-lg shadow-sm space-y-2 bg-card text-card-foreground"
      >
        <p className="font-semibold text-lg">
          {report.name} <span className="text-sm text-muted-foreground">({report.grade})</span>
        </p>

        <div className="space-y-1">
          <p>
            <span className="font-medium">Math:</span> {report.subjects.math.score}{" "}
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {report.subjects.math.grade}
            </span>
          </p>
          <p>
            <span className="font-medium">Science:</span> {report.subjects.science.score}{" "}
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {report.subjects.science.grade}
            </span>
          </p>
          <p>
            <span className="font-medium">English:</span> {report.subjects.english.score}{" "}
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {report.subjects.english.grade}
            </span>
          </p>
        </div>

        <p className="pt-1 border-t border-muted mt-2">
          <span className="font-medium">Overall:</span> {report.overallPercentage}%{" "}
          <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">
            {report.overallGrade}
          </span>
        </p>
      </div>
    ))
  )}
</div>

        </>
      )}
    </div>
  );
}
