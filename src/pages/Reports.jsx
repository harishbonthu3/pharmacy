import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

function formatMoney(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportType, setReportType] = useState("");

  const [activeType, setActiveType] = useState("");
  const [reportData, setReportData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportCards = [
    { key: "sales", title: "Sales Report", desc: "Day / Week / Month wise sales summary" },
    { key: "profit", title: "Profit Report", desc: "Selling - cost profit calculation" },
    { key: "expiry", title: "Expiry Report", desc: "Medicines expiring soon list" },
    { key: "low-stock", title: "Low Stock Report", desc: "Low quantity medicines list" },
  ];

  const fetchReport = async (type) => {
    try {
      setLoading(true);
      setError("");
      setActiveType(type);

      const params = new URLSearchParams();
      params.set("type", type);
      if (fromDate) params.set("start", fromDate);
      if (toDate) params.set("end", toDate);

      const res = await api.get(`reports/?${params.toString()}`);
      setReportData({
        summary: res.data?.summary || {},
        rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
      });
      setReportType(type);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      setError(
        err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to load report"
      );
      setReportData({ summary: {}, rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const currentTitle = useMemo(() => {
    const found = reportCards.find((r) => r.key === activeType);
    return found ? found.title : "Report Result";
  }, [activeType]);

  const onExportCurrent = () => {
    if (!reportData.rows.length) {
      alert("Generate a report first");
      return;
    }
    downloadCsv(`${activeType || "report"}.csv`, reportData.rows);
  };

  const renderSummary = () => {
    if (!activeType) return null;

    if (activeType === "sales") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Total Bills</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {reportData.summary?.count ?? 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Total Sales</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {formatMoney(reportData.summary?.total_sales)}
            </div>
          </Card>
        </div>
      );
    }

    if (activeType === "profit") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Sold Items</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {reportData.summary?.count ?? 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Total Profit</div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {formatMoney(reportData.summary?.total_profit)}
            </div>
          </Card>
        </div>
      );
    }

    return (
      <Card className="p-4">
        <div className="text-sm text-slate-500">Records Found</div>
        <div className="mt-2 text-2xl font-black text-slate-900">
          {reportData.summary?.count ?? 0}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Reports</div>
          <div className="text-sm text-slate-600">
            Select date range and click Generate on any report card
          </div>
        </div>

        <PermissionGate any={[PERMS.REPORTS_EXPORT]}>
          <Button onClick={onExportCurrent}>Export CSV</Button>
        </PermissionGate>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Input
            label="Report Type"
            placeholder="Sales / Profit / Expiry / Low Stock"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          />
        </div>
      </Card>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportCards.map((r) => (
          <Card key={r.key} className="p-5">
            <div className="text-lg font-extrabold text-slate-900">{r.title}</div>
            <div className="mt-1 text-sm text-slate-600">{r.desc}</div>

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => fetchReport(r.key)}>
                View
              </Button>
              <Button onClick={() => fetchReport(r.key)}>
                Generate
              </Button>

              <PermissionGate any={[PERMS.REPORTS_EXPORT]}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (activeType !== r.key || !reportData.rows.length) {
                      fetchReport(r.key);
                      return;
                    }
                    downloadCsv(`${r.key}.csv`, reportData.rows);
                  }}
                >
                  Export
                </Button>
              </PermissionGate>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold text-slate-900">
              {currentTitle}
            </div>
            <div className="text-sm text-slate-500">
              {activeType
                ? `Showing ${activeType} report data`
                : "Generate any report to view result here"}
            </div>
          </div>

          {loading ? (
            <div className="text-sm font-semibold text-blue-600">Loading...</div>
          ) : null}
        </div>

        <div className="mt-4">{renderSummary()}</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {reportData.rows.length > 0 ? (
                  Object.keys(reportData.rows[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold capitalize">
                      {key.replaceAll("_", " ")}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 font-semibold">Report Data</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.rows.length > 0 ? (
                reportData.rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-200">
                    {Object.keys(row).map((key) => (
                      <td key={key} className="px-4 py-3 text-slate-700">
                        {typeof row[key] === "number" && key.toLowerCase().includes("price")
                          ? formatMoney(row[key])
                          : typeof row[key] === "number" && key.toLowerCase().includes("amount")
                          ? formatMoney(row[key])
                          : typeof row[key] === "number" && key.toLowerCase().includes("profit")
                          ? formatMoney(row[key])
                          : row[key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-6 text-center text-slate-500">
                    No report generated yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}