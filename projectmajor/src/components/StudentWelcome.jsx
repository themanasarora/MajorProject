import { useAuth } from "../contexts/AuthContext";

const StudentWelcome = () => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-500 to-blue-500 text-white">
      <h1 className="text-3xl font-bold mb-6">🎓 Welcome, Student!</h1>
      <button
        onClick={logout}
        className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold"
      >
        Logout
      </button>
    </div>
  );
};

export default StudentWelcome;
