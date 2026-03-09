import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_DEFAULT_PERMISSIONS } from "./permissions";

const AuthContext = createContext(null);

// IMPORTANT: bump key to avoid old cached permissions issues
const LS_KEY = "pharmacy_auth_v3";

/**
 * Dummy credentials (backend connect later)
 * ADMIN: admin@pharmacy.com / Admin@123
 * PHARMACIST: pharmacist@pharmacy.com / Pharma@123
 * CASHIER: cashier@pharmacy.com / Cash@123
 */
const DUMMY_USERS = [
  { email: "admin@pharmacy.com", password: "Admin@123", name: "Admin", role: "ADMIN" },
  { email: "pharmacist@pharmacy.com", password: "Pharma@123", name: "Pharmacist", role: "PHARMACIST" },
  { email: "cashier@pharmacy.com", password: "Cash@123", name: "Cashier", role: "CASHIER" }
];

// Always recompute permissions from role (prevents “logic maari poyindi” issue)
function buildUser(u) {
  const role = u.role;
  return {
    name: u.name,
    email: u.email,
    role,
    permissions: ROLE_DEFAULT_PERMISSIONS[role] || [],
    token: u.token || "dummy-token"
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setUser(buildUser(parsed));
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const login = async (email, password) => {
    const found = DUMMY_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error("Invalid email or password");

    const payload = buildUser(found);
    setUser(payload);
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    return payload;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
  };

  const hasPerm = (perm) => {
    if (!user) return false;
    return user.permissions?.includes(perm);
  };

  const hasAnyPerm = (perms = []) => {
    if (!user) return false;
    if (!perms || perms.length === 0) return true;
    return perms.some((p) => user.permissions?.includes(p));
  };

  const value = useMemo(() => ({ user, login, logout, hasPerm, hasAnyPerm }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}