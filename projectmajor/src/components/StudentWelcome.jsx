import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db, functions } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  getDocsFromServer
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import Groups from "../pages/Groups"; // Import your Groups component

const StudentWelcome = () => {
  const { logout, user } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [activeTab, setActiveTab] = useState("attendance"); // "attendance", "report-cards", "groups", "quiz"
  const [reportCards, setReportCards] = useState([]);
  const [reportCardsLoading, setReportCardsLoading] = useState(false);

  // --- Quiz state ---
  const [quizGameId, setQuizGameId] = useState("");
  const [quizJoined, setQuizJoined] = useState(false);
  const [quizGame, setQuizGame] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playersCount, setPlayersCount] = useState(0);

  // Fetch student data and attendance
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (!user) return;

        // Get student profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        setStudentInfo(userData);

        const grade = userData.grade;
        if (!grade) return;

        // Fetch attendance data
        await fetchAttendanceData(grade);
      } catch (err) {
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  // Fetch attendance data
  const fetchAttendanceData = async (grade) => {
    try {
      const attendanceData = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split("T")[0];

        try {
          const studentAttendanceRef = doc(
            db,
            "attendance",
            grade,
            "dates",
            dateString,
            "students",
            user.uid
          );

          const studentAttendanceSnap = await getDoc(studentAttendanceRef);

          if (studentAttendanceSnap.exists()) {
            const attendance = studentAttendanceSnap.data();
            attendanceData.push({
              date: dateString,
              status: attendance.isPresent ? "Present" : "Absent",
              timestamp: attendance.markedAt,
              day: date.toLocaleDateString("en-US", { weekday: "short" }),
              fullDate: date,
            });
          }
        } catch (error) {
          // keep going
          continue;
        }
      }

      // Calculate statistics
      const presentCount = attendanceData.filter((item) => item.status === "Present").length;
      const totalCount = attendanceData.length;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      setStats({
        present: presentCount,
        absent: totalCount - presentCount,
        total: totalCount,
        percentage: percentage,
      });

      setAttendanceList(attendanceData);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  // Fetch report cards
  const fetchReportCards = async () => {
    try {
      setReportCardsLoading(true);
      const reportCardsRef = collection(db, "report_cards");
      const querySnapshot = await getDocs(reportCardsRef);

      const reports = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only show report cards for the current student
        if (data.studentId === user.uid) {
          reports.push({
            id: docSnap.id,
            ...data,
            date: data.date?.toDate?.() || new Date(),
          });
        }
      });

      // Sort by date, most recent first
      reports.sort((a, b) => b.date - a.date);
      setReportCards(reports);
    } catch (err) {
      console.error("Error fetching report cards:", err);
    } finally {
      setReportCardsLoading(false);
    }
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "report-cards") {
      fetchReportCards();
    }
  };

  // Function to get color based on percentage
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  // Function to get status badge color
  const getStatusColor = (status) => {
    return status === "Present"
      ? "bg-green-800 text-green-100 border-green-700"
      : "bg-red-800 text-red-100 border-red-700";
  };

  // Function to get grade color
  const getGradeColor = (grade) => {
    if (grade >= 90) return "text-green-300 bg-green-900 border-green-800";
    if (grade >= 80) return "text-blue-300 bg-blue-900 border-blue-800";
    if (grade >= 70) return "text-yellow-300 bg-yellow-900 border-yellow-800";
    return "text-red-300 bg-red-900 border-red-800";
  };

  // -----------------------
  // QUIZ: join, listen, submit, leaderboard
  // -----------------------
  useEffect(() => {
    if (!quizJoined || !quizGameId) return;

    const gameRef = doc(db, "games", quizGameId);
    const unsubGame = onSnapshot(gameRef, async (gSnap) => {
      if (!gSnap.exists()) {
        setQuizGame(null);
        setQuizQuestion(null);
        setLeaderboard([]);
        setPlayersCount(0);
        return;
      }

      const gData = gSnap.data();
      setQuizGame(gData);

      // subscribe to current question if set
      if (gData.currentQuestionId) {
        const qRef = doc(db, "games", quizGameId, "questions", gData.currentQuestionId);
        const qSnap = await getDoc(qRef);
        if (qSnap.exists()) {
          const qData = qSnap.data();
          setQuizQuestion({ id: qSnap.id, ...qData });

          // setup timer based on server timestamp startAt
          const startAtMs =
            qData.startAt && typeof qData.startAt.toMillis === "function"
              ? qData.startAt.toMillis()
              : qData.startAt || Date.now();
          const endAt = startAtMs + (qData.durationSec || 20) * 1000;

          // immediate compute
          const computeLeft = () => Math.max(0, Math.floor((endAt - Date.now()) / 1000));
          setTimeLeft(computeLeft());

          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            const left = computeLeft();
            setTimeLeft(left);
            if (left <= 0 && timerRef.current) {
              clearInterval(timerRef.current);
            }
          }, 300);
        } else {
          setQuizQuestion(null);
          setTimeLeft(null);
        }
      } else {
        setQuizQuestion(null);
        setTimeLeft(null);
      }
    });

    // leaderboard listener
    const playersRef = collection(db, "games", quizGameId, "players");
    const qPlayers = query(playersRef, orderBy("score", "desc"));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLeaderboard(arr);
      setPlayersCount(arr.length);
    });

    return () => {
      unsubGame && unsubGame();
      unsubPlayers && unsubPlayers();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizJoined, quizGameId, user]);

  const joinQuiz = async () => {
    if (!quizGameId || !user) return alert("Enter game ID and ensure you're logged in.");
    try {
      const playerRef = doc(db, "games", quizGameId, "players", user.uid);
      await setDoc(
        playerRef,
        {
          uid: user.uid,
          displayName: studentInfo?.name || user.displayName || user.email?.split("@")[0] || "Student",
          score: 0,
          joinedAt: new Date(),
        },
        { merge: true }
      );
      setQuizJoined(true);
      setActiveTab("quiz");
    } catch (err) {
      console.error("Error joining quiz:", err);
      alert("Failed to join quiz. Check game ID.");
    }
  };

  const submitAnswer = async (selectedIndex) => {
    if (!quizGameId || !quizQuestion) return;
    if (!user) return alert("Please log in.");
    setSubmitting(true);
    try {
      const submitFn = httpsCallable(functions, "submitAnswer");
      const res = await submitFn({ gameId: quizGameId, questionId: quizQuestion.id, selectedIndex });
      alert("Submitted! Points awarded: " + (res.data?.awardedPoints ?? "0"));
    } catch (err) {
      console.error("Submit error:", err);
      alert(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------
  // RENDERERS
  // -----------------------
  const renderAttendanceTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Attendance */}
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Attendance</h3>
            <div className={`text-2xl font-bold ${getPercentageColor(stats.percentage)}`}>
              {stats.percentage}%
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                stats.percentage >= 90 ? "bg-green-400" : stats.percentage >= 75 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Based on {stats.total} records</p>
        </div>

        {/* Present Days */}
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{stats.present}</p>
              <p className="text-sm text-gray-400">Present Days</p>
            </div>
          </div>
        </div>

        {/* Absent Days */}
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{stats.absent}</p>
              <p className="text-sm text-gray-400">Absent Days</p>
            </div>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">Attendance History</h2>
          <p className="text-gray-400 text-sm">Last 30 days of attendance records</p>
        </div>

        {attendanceList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">No Attendance Records</h3>
            <p className="text-gray-400 max-w-md mx-auto">No attendance records found for the last 30 days.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {attendanceList.map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-900 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-100">{new Date(item.fullDate).getDate()}</div>
                      <div className="text-xs text-gray-400 uppercase">
                        {new Date(item.fullDate).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-100">
                        {new Date(item.fullDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-400">
                        Marked at {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString() : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportCardsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">Report Cards</h2>
          <p className="text-gray-400 text-sm">Your academic performance reports</p>
        </div>

        {reportCardsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading report cards...</p>
          </div>
        ) : reportCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">No Report Cards</h3>
            <p className="text-gray-400 max-w-md mx-auto">No report cards available yet. They will appear here once your teacher uploads them.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {reportCards.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-900 transition-colors duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {report.term || "Report Card"} - {report.date.toLocaleDateString()}
                    </h3>
                    <p className="text-gray-400 text-sm">Prepared by: {report.teacherName || "Teacher"}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getGradeColor(report.overallGrade || 0)}`}>
                    Overall: {report.overallGrade || "N/A"}%
                  </div>
                </div>

                {report.subjects && Object.keys(report.subjects).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(report.subjects).map(([subject, grade]) => (
                      <div key={subject} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-100 capitalize">{subject}</span>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(grade)}`}>{grade}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {report.comments && (
                  <div className="mt-4 p-4 bg-blue-900 rounded-lg">
                    <h4 className="font-semibold text-gray-100 mb-2">Teacher's Comments:</h4>
                    <p className="text-gray-200">{report.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderGroupsTab = () => (
    <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
      <Groups />
    </div>
  );

  // QUIZ tab UI
  const renderQuizTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-100">Live Quiz</h2>
        <p className="text-gray-400 text-sm">Join a live quiz using Game ID provided by your teacher.</p>

        {!quizJoined ? (
          <div className="mt-4 flex items-center gap-3">
            <input
              value={quizGameId}
              onChange={(e) => setQuizGameId(e.target.value)}
              placeholder="Enter Game ID"
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 w-64 focus:outline-none"
            />
            <button onClick={joinQuiz} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
              Join
            </button>
            <div className="text-gray-400">Players: {playersCount}</div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">Game:</div>
                <div className="font-semibold text-gray-100">{quizGame?.topic || quizGameId}</div>
              </div>
              <div className="text-sm text-gray-400">Players: {playersCount}</div>
            </div>

            {quizQuestion ? (
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-100">{quizQuestion.text}</h3>
                  <div className="text-sm text-gray-400">Time left: <span className="font-semibold text-gray-100">{timeLeft ?? "--"}</span>s</div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizQuestion.choices?.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => submitAnswer(idx)}
                      disabled={submitting}
                      className="text-left p-3 rounded-lg border border-gray-700 hover:bg-gray-900 transition-colors duration-150"
                    >
                      <div className="font-medium text-gray-100">{String.fromCharCode(65 + idx)}. {choice}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700 text-gray-400">
                Waiting for the teacher to start the next question...
              </div>
            )}

            {/* Leaderboard */}
            <div className="mt-6 bg-gray-900 rounded-lg border border-gray-700 p-4">
              <h4 className="text-md font-semibold text-gray-100 mb-3">Leaderboard</h4>
              <div className="divide-y divide-gray-700">
                {leaderboard.length === 0 ? (
                  <div className="py-4 text-gray-400">No players yet</div>
                ) : (
                  leaderboard.map((p, i) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-100">
                          {p.displayName?.charAt(0) || "S"}
                        </div>
                        <div className="text-gray-100">{p.displayName}</div>
                      </div>
                      <div className="text-gray-100 font-semibold">{p.score || 0} pts</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    // Default dark theme container
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 shadow-lg min-h-screen border-r border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {studentInfo?.name?.charAt(0) || user?.email?.charAt(0) || "S"}
              </div>
              <div>
                <h2 className="font-semibold text-gray-100 truncate">{studentInfo?.name || user?.email}</h2>
                <p className="text-sm text-gray-400">Grade {studentInfo?.grade}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleTabChange("attendance")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "attendance" ? "bg-blue-700 text-white shadow-md" : "text-gray-200 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📅</span>
              <span className="font-medium">Attendance</span>
            </button>

            <button
              onClick={() => handleTabChange("report-cards")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "report-cards" ? "bg-blue-700 text-white shadow-md" : "text-gray-200 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">📝</span>
              <span className="font-medium">Report Cards</span>
            </button>

            <button
              onClick={() => handleTabChange("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "groups" ? "bg-blue-700 text-white shadow-md" : "text-gray-200 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">💬</span>
              <span className="font-medium">Groups</span>
            </button>

            <button
              onClick={() => handleTabChange("quiz")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "quiz" ? "bg-blue-700 text-white shadow-md" : "text-gray-200 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">🎮</span>
              <span className="font-medium">Live Quiz</span>
            </button>
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-200 hover:bg-red-700 hover:text-red-200 transition-all duration-200"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {activeTab === "attendance" && "Attendance Dashboard"}
                {activeTab === "report-cards" && "Academic Reports"}
                {activeTab === "groups" && "Class Groups"}
                {activeTab === "quiz" && "Live Quiz"}
              </h1>
              <p className="text-gray-400">
                {activeTab === "attendance" && "Track your attendance and participation"}
                {activeTab === "report-cards" && "View your academic performance and progress"}
                {activeTab === "groups" && "Communicate with your class and teachers"}
                {activeTab === "quiz" && "Join live quizzes hosted by your teacher"}
              </p>
            </div>

            {/* Tab Content */}
            {activeTab === "attendance" && renderAttendanceTab()}
            {activeTab === "report-cards" && renderReportCardsTab()}
            {activeTab === "groups" && renderGroupsTab()}
            {activeTab === "quiz" && renderQuizTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWelcome;
