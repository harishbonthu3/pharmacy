import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { PERMS } from "../../auth/permissions";

const menu = [
  { to: "/app/dashboard", label: "Dashboard", perm: PERMS.DASHBOARD_VIEW },
  { to: "/app/medicines", label: "Medicines", perm: PERMS.MEDICINES_VIEW },
  { to: "/app/billing", label: "Billing / POS", perm: PERMS.BILLING_VIEW },
  { to: "/app/purchases", label: "Purchases", perm: PERMS.PURCHASES_VIEW },
  { to: "/app/suppliers", label: "Suppliers", perm: PERMS.SUPPLIERS_VIEW },
  { to: "/app/customers", label: "Customers", perm: PERMS.CUSTOMERS_VIEW },
  { to: "/app/reports", label: "Reports", perm: PERMS.REPORTS_VIEW }
];

export default function Sidebar() {
  const { user, hasPerm } = useAuth();
  const links = menu.filter((m) => hasPerm(m.perm));

  return (
    <aside className="sticky top-0 h-screen w-72 border-r border-slate-200 bg-white">
      <div className="p-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="text-sm opacity-90">Welcome</div>
          <div className="text-xl font-bold">{user?.name}</div>
          <div className="text-xs opacity-90">{user?.role}</div>
          <div className="mt-1 text-[11px] opacity-90">
            Perms: {user?.permissions?.length || 0}
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    : "text-slate-700 hover:bg-slate-100"
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}