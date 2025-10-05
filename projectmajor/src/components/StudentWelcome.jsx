import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const StudentWelcome = () => {
  const { logout, user } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (!user) return;

        // 1. Get student profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        setStudentInfo(userData);

        const grade = userData.grade;
        if (!grade) return;

        // 2. Get attendance for last 30 days
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
            // Skip date if there's an error
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
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {studentInfo?.name?.charAt(0) || user?.email?.charAt(0) || "S"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {studentInfo?.name || user?.email}
                </h1>
                <p className="text-gray-600">
                  Grade {studentInfo?.grade} • {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                No attendance records found for the last 30 days. This could be because attendance hasn't been marked yet or there's a configuration issue.
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

        {/* Quick Stats Summary */}
        {attendanceList.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">{stats.present}</div>
              <div className="text-sm opacity-90">Days Present</div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">{stats.absent}</div>
              <div className="text-sm opacity-90">Days Absent</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">{stats.percentage}%</div>
              <div className="text-sm opacity-90">Overall Attendance</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Attendance System • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentWelcome;