import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, permissions }) {
  const { user, hasAnyPerm } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (permissions && permissions.length > 0 && !hasAnyPerm(permissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}