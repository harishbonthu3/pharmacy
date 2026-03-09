import Button from "../ui/Button";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <div className="text-sm text-slate-500">Pharmacy Management</div>
          <div className="text-lg font-bold text-slate-900">Dashboard</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.role}</div>
          </div>
          <Button variant="danger" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}