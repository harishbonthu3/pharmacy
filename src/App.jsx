import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Billing from "./pages/Billing";
import Purchases from "./pages/Purchases";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import { PERMS } from "./auth/permissions";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute permissions={[PERMS.DASHBOARD_VIEW]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="medicines"
          element={
            <ProtectedRoute permissions={[PERMS.MEDICINES_VIEW]}>
              <Medicines />
            </ProtectedRoute>
          }
        />

        <Route
          path="billing"
          element={
            <ProtectedRoute permissions={[PERMS.BILLING_VIEW]}>
              <Billing />
            </ProtectedRoute>
          }
        />

        <Route
          path="purchases"
          element={
            <ProtectedRoute permissions={[PERMS.PURCHASES_VIEW]}>
              <Purchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="suppliers"
          element={
            <ProtectedRoute permissions={[PERMS.SUPPLIERS_VIEW]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />

        <Route
          path="customers"
          element={
            <ProtectedRoute permissions={[PERMS.CUSTOMERS_VIEW]}>
              <Customers />
            </ProtectedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <ProtectedRoute permissions={[PERMS.REPORTS_VIEW]}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}