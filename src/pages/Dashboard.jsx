import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import api from "../api/api";

function money(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState({
    today_sales: 0,
    low_stock_alerts: 0,
    expiry_soon_alerts: 0,
    top_selling: [],
    total_customers: 0,
    total_suppliers: 0,
    total_medicines: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("dashboard-summary/");
      setData({
        today_sales: res.data?.today_sales ?? 0,
        low_stock_alerts: res.data?.low_stock_alerts ?? 0,
        expiry_soon_alerts: res.data?.expiry_soon_alerts ?? 0,
        top_selling: Array.isArray(res.data?.top_selling) ? res.data.top_selling : [],
        total_customers: res.data?.total_customers ?? 0,
        total_suppliers: res.data?.total_suppliers ?? 0,
        total_medicines: res.data?.total_medicines ?? 0,
      });
    } catch (err) {
      console.error(err?.response?.data || err.message);
      setError(
        err?.response?.data?.detail
          ? `Failed to load dashboard data: ${err.response.data.detail}`
          : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Dashboard</div>
          <div className="text-sm text-slate-600">
            Real-time pharmacy overview from backend
          </div>
        </div>

        <Button variant="ghost" onClick={fetchDashboard}>
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6 text-center text-slate-500">
          Loading dashboard...
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-500">Today Sales</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {money(data.today_sales)}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-500">Low Stock Alerts</div>
              <div className="mt-2 text-3xl font-black text-red-600">
                {data.low_stock_alerts}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-500">Expiry Soon Alerts</div>
              <div className="mt-2 text-3xl font-black text-amber-600">
                {data.expiry_soon_alerts}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-500">Total Medicines</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {data.total_medicines}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="p-5">
              <div className="text-lg font-extrabold text-slate-900">Customers</div>
              <div className="mt-2 text-3xl font-black text-blue-700">
                {data.total_customers}
              </div>
              <div className="mt-1 text-sm text-slate-500">Registered customer count</div>
            </Card>

            <Card className="p-5">
              <div className="text-lg font-extrabold text-slate-900">Suppliers</div>
              <div className="mt-2 text-3xl font-black text-emerald-700">
                {data.total_suppliers}
              </div>
              <div className="mt-1 text-sm text-slate-500">Active supplier count</div>
            </Card>

            <Card className="p-5">
              <div className="text-lg font-extrabold text-slate-900">System Status</div>
              <div className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700 ring-1 ring-green-100">
                Backend Connected
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Dashboard is reading live data from Django backend
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div>
              <div className="text-lg font-extrabold text-slate-900">
                Top Selling Medicines
              </div>
              <div className="text-sm text-slate-500">
                Based on completed sales
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Medicine</th>
                    <th className="px-4 py-3 font-semibold">Qty Sold</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_selling.map((item, idx) => (
                    <tr key={`${item.name}-${idx}`} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-700">{item.qty}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {money(item.amount)}
                      </td>
                    </tr>
                  ))}

                  {data.top_selling.length === 0 ? (
                    <tr className="border-t border-slate-200">
                      <td colSpan="3" className="px-4 py-6 text-center text-slate-500">
                        No sales data yet
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}