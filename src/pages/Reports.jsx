import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";

function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const reportCards = [
    { title: "Sales Report", desc: "Day / Week / Month wise sales summary" },
    { title: "Profit Report", desc: "Selling - cost profit calculation" },
    { title: "Expiry Report", desc: "Medicines expiring soon list" },
    { title: "Low Stock Report", desc: "Low quantity medicines list" }
  ];

  const exportCSV = () => {
    const csv =
      "Report,Value\n" +
      "Today's Sales,12450\n" +
      "Low Stock Alerts,8\n" +
      "Expiring Soon,5\n";
    downloadTextFile("pharmacy-report.csv", csv, "text/csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Reports</div>
          <div className="text-sm text-slate-600">Export permission unte CSV download avuthundi</div>
        </div>

        <PermissionGate any={[PERMS.REPORTS_EXPORT]}>
          <Button onClick={exportCSV}>Export CSV</Button>
        </PermissionGate>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="From Date" type="date" />
          <Input label="To Date" type="date" />
          <Input label="Report Type" placeholder="Sales / Profit / Stock" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportCards.map((r, idx) => (
          <Card key={idx} className="p-5">
            <div className="text-lg font-extrabold text-slate-900">{r.title}</div>
            <div className="mt-1 text-sm text-slate-600">{r.desc}</div>

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => alert(`${r.title} view (next)`)}>View</Button>
              <Button onClick={() => alert(`${r.title} generated (demo)`)}>Generate</Button>

              <PermissionGate any={[PERMS.REPORTS_EXPORT]}>
                <Button variant="ghost" onClick={exportCSV}>Export</Button>
              </PermissionGate>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}