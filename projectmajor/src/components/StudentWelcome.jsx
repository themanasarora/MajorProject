import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Groups from "../pages/Groups"; // Import your Groups component

const StudentWelcome = () => {
  const { logout, user } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [activeTab, setActiveTab] = useState("attendance"); // "attendance", "report-cards", "groups"
  const [reportCards, setReportCards] = useState([]);
  const [reportCardsLoading, setReportCardsLoading] = useState(false);

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
        const dateString = date.toISOString().split('T')[0];
        
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
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              fullDate: date
            });
          }
        } catch (error) {
          continue;
        }
      }

      // Calculate statistics
      const presentCount = attendanceData.filter(item => item.status === "Present").length;
      const totalCount = attendanceData.length;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      setStats({
        present: presentCount,
        absent: totalCount - presentCount,
        total: totalCount,
        percentage: percentage
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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only show report cards for the current student
        if (data.studentId === user.uid) {
          reports.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate?.() || new Date()
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
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  // Function to get status badge color
  const getStatusColor = (status) => {
    return status === "Present" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  // Function to get grade color
  const getGradeColor = (grade) => {
    if (grade >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (grade >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (grade >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Render attendance tab
  const renderAttendanceTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Attendance</h3>
            <div className={`text-2xl font-bold ${getPercentageColor(stats.percentage)}`}>
              {stats.percentage}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                stats.percentage >= 90 ? 'bg-green-500' :
                stats.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Based on {stats.total} records
          </p>
        </div>

        {/* Present Days */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              <p className="text-sm text-gray-500">Present Days</p>
            </div>
          </div>
        </div>

        {/* Absent Days */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              <p className="text-sm text-gray-500">Absent Days</p>
            </div>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
          <p className="text-gray-600 text-sm">Last 30 days of attendance records</p>
        </div>

        {attendanceList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No attendance records found for the last 30 days.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {attendanceList.map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(item.fullDate).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {new Date(item.fullDate).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {new Date(item.fullDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        Marked at {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A'}
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

  // Render report cards tab
  const renderReportCardsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Report Cards</h2>
          <p className="text-gray-600 text-sm">Your academic performance reports</p>
        </div>

        {reportCardsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report cards...</p>
          </div>
        ) : reportCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Cards</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No report cards available yet. They will appear here once your teacher uploads them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reportCards.map((report, index) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.term || "Report Card"} - {report.date.toLocaleDateString()}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Prepared by: {report.teacherName || "Teacher"}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getGradeColor(report.overallGrade || 0)}`}>
                    Overall: {report.overallGrade || "N/A"}%
                  </div>
                </div>
                
                {report.subjects && Object.keys(report.subjects).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(report.subjects).map(([subject, grade]) => (
                      <div key={subject} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 capitalize">
                            {subject}
                          </span>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(grade)}`}>
                            {grade}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {report.comments && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Teacher's Comments:</h4>
                    <p className="text-gray-700">{report.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render groups tab
  const renderGroupsTab = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Groups />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {studentInfo?.name?.charAt(0) || user?.email?.charAt(0) || "S"}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 truncate">
                  {studentInfo?.name || user?.email}
                </h2>
                <p className="text-sm text-gray-500">Grade {studentInfo?.grade}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleTabChange("attendance")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "attendance"
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">📅</span>
              <span className="font-medium">Attendance</span>
            </button>

            <button
              onClick={() => handleTabChange("report-cards")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "report-cards"
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">📝</span>
              <span className="font-medium">Report Cards</span>
            </button>

            <button
              onClick={() => handleTabChange("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === "groups"
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">💬</span>
              <span className="font-medium">Group Chat</span>
            </button>
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === "attendance" && "Attendance Dashboard"}
                {activeTab === "report-cards" && "Academic Reports"}
                {activeTab === "groups" && "Class Groups"}
              </h1>
              <p className="text-gray-600">
                {activeTab === "attendance" && "Track your attendance and participation"}
                {activeTab === "report-cards" && "View your academic performance and progress"}
                {activeTab === "groups" && "Communicate with your class and teachers"}
              </p>
            </div>

            {/* Tab Content */}
            {activeTab === "attendance" && renderAttendanceTab()}
            {activeTab === "report-cards" && renderReportCardsTab()}
            {activeTab === "groups" && renderGroupsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWelcome;