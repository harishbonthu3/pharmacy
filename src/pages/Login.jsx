import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@pharmacy.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (error) {
      setErr(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fill = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left branding */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-blue-600" />
              <div className="text-2xl font-black text-slate-900">PharmaPro</div>
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight text-slate-900">
              Pharmacy Management
              <span className="text-blue-600"> System</span>
            </h1>
            <p className="mt-3 max-w-md text-slate-600">
              Inventory • Billing • Purchases • Customers • Reports — all in one clean dashboard.
            </p>

            <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-xs text-slate-500">Low Stock</div>
                <div className="mt-1 text-xl font-bold">Auto Alerts</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Expiry</div>
                <div className="mt-1 text-xl font-bold">Batch Wise</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Billing</div>
                <div className="mt-1 text-xl font-bold">POS Ready</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Reports</div>
                <div className="mt-1 text-xl font-bold">Profit View</div>
              </Card>
            </div>
          </div>

          {/* Right login card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md p-6">
              <div className="text-2xl font-black text-slate-900">Login</div>
              <div className="mt-1 text-sm text-slate-600">
                Use demo credentials below (backend connect later).
              </div>

              {err ? (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                  {err}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Input
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pharmacy.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="text-xs font-semibold text-slate-500">Demo Credentials</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => fill("admin@pharmacy.com", "Admin@123")}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
                  >
                    <div className="text-sm font-bold">ADMIN</div>
                    <div className="text-xs text-slate-600">admin@pharmacy.com • Admin@123</div>
                  </button>

                  <button
                    onClick={() => fill("pharmacist@pharmacy.com", "Pharma@123")}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
                  >
                    <div className="text-sm font-bold">PHARMACIST</div>
                    <div className="text-xs text-slate-600">pharmacist@pharmacy.com • Pharma@123</div>
                  </button>

                  <button
                    onClick={() => fill("cashier@pharmacy.com", "Cash@123")}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
                  >
                    <div className="text-sm font-bold">CASHIER</div>
                    <div className="text-xs text-slate-600">cashier@pharmacy.com • Cash@123</div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}