import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, userData } = useAuth(); // assuming you store user info
  if (!user) return <Navigate to="/login" replace />;
  if (role && userData?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
};


export default ProtectedRoute;
