import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

function sumQty(batches) {
  return (batches || []).reduce((s, b) => s + Number(b.qty || 0), 0);
}

function nearestExpiry(batches) {
  const dates = (batches || [])
    .map((b) => b.expiry)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);

  return dates.length ? dates[0].toISOString().slice(0, 10) : "";
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function daysFromToday(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingMed, setSavingMed] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [error, setError] = useState("");

  // medicine modal
  const [medOpen, setMedOpen] = useState(false);
  const [medMode, setMedMode] = useState("add");
  const [medId, setMedId] = useState(null);
  const [medForm, setMedForm] = useState({ name: "", category: "", barcode: "" });

  // batch modal
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState("add");
  const [batchMedId, setBatchMedId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [batchForm, setBatchForm] = useState({
    batchNo: "",
    expiry: "",
    mrp: 0,
    cost: 0,
    sell: 0,
    qty: 0
  });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("medicines/");
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const rows = useMemo(() => {
    return medicines
      .map((m) => {
        const stock = sumQty(m.batches);
        const exp = nearestExpiry(m.batches);
        return { ...m, stock, nearestExp: exp };
      })
      .filter((m) => {
        const matchQ = q
          ? `${m.name || ""} ${m.barcode || ""}`.toLowerCase().includes(q.toLowerCase())
          : true;
        const matchC = cat
          ? String(m.category || "").toLowerCase().includes(cat.toLowerCase())
          : true;
        return matchQ && matchC;
      });
  }, [medicines, q, cat]);

  const resetMedForm = () => {
    setMedForm({ name: "", category: "", barcode: "" });
  };

  const resetBatchForm = () => {
    setBatchForm({
      batchNo: "",
      expiry: "",
      mrp: 0,
      cost: 0,
      sell: 0,
      qty: 0
    });
  };

  // medicine actions
  const openAddMedicine = () => {
    setMedMode("add");
    setMedId(null);
    resetMedForm();
    setMedOpen(true);
  };

  const openEditMedicine = (m) => {
    setMedMode("edit");
    setMedId(m.id);
    setMedForm({
      name: m.name || "",
      category: m.category || "",
      barcode: m.barcode || ""
    });
    setMedOpen(true);
  };

  const saveMedicine = async () => {
    if (!medForm.name.trim()) return alert("Medicine name required");
    if (!medForm.category.trim()) return alert("Category required");

    const payload = {
      name: medForm.name.trim(),
      category: medForm.category.trim(),
      barcode: medForm.barcode.trim() || null
    };

    try {
      setSavingMed(true);

      if (medMode === "add") {
        await api.post("medicines/", payload);
      } else {
        await api.put(`medicines/${medId}/`, payload);
      }

      await fetchMedicines();
      setMedOpen(false);
      resetMedForm();
      setMedId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save medicine");
    } finally {
      setSavingMed(false);
    }
  };

  const deleteMedicine = async (id) => {
    if (!confirm("Delete this medicine (and all batches)?")) return;
    try {
      await api.delete(`medicines/${id}/`);
      await fetchMedicines();
    } catch (err) {
      console.error(err);
      alert("Failed to delete medicine");
    }
  };

  // batch actions
  const openAddBatch = (m) => {
    setBatchMode("add");
    setBatchMedId(m.id);
    setBatchId(null);
    resetBatchForm();
    setBatchOpen(true);
  };

  const openEditBatch = (m, b) => {
    setBatchMode("edit");
    setBatchMedId(m.id);
    setBatchId(b.id);
    setBatchForm({
      batchNo: b.batch_no || "",
      expiry: b.expiry || "",
      mrp: b.mrp ?? 0,
      cost: b.cost ?? 0,
      sell: b.sell ?? 0,
      qty: b.qty ?? 0
    });
    setBatchOpen(true);
  };

  const saveBatch = async () => {
    if (!batchForm.batchNo.trim()) return alert("Batch No required");
    if (!batchForm.expiry) return alert("Expiry date required");

    const mrp = Number(batchForm.mrp);
    const cost = Number(batchForm.cost);
    const sell = Number(batchForm.sell);
    const qty = Number(batchForm.qty);

    if ([mrp, cost, sell, qty].some((n) => Number.isNaN(n) || n < 0)) {
      return alert("MRP/Cost/Sell/Qty must be 0 or more");
    }

    const payload = {
      medicine: Number(batchMedId),
      batch_no: batchForm.batchNo.trim(),
      expiry: batchForm.expiry,
      mrp,
      cost,
      sell,
      qty
    };

    try {
      setSavingBatch(true);

      if (batchMode === "add") {
        await api.post("batches/", payload);
      } else {
        await api.put(`batches/${batchId}/`, payload);
      }

      await fetchMedicines();
      setBatchOpen(false);
      resetBatchForm();
      setBatchId(null);
      setBatchMedId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save batch");
    } finally {
      setSavingBatch(false);
    }
  };

  const deleteBatch = async (bId) => {
    if (!confirm("Delete this batch?")) return;
    try {
      await api.delete(`batches/${bId}/`);
      await fetchMedicines();
    } catch (err) {
      console.error(err);
      alert("Failed to delete batch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Medicines (Batch-wise)</div>
          <div className="text-sm text-slate-600">Backend synced inventory with batches</div>
        </div>

        <PermissionGate any={[PERMS.MEDICINES_CREATE]}>
          <Button onClick={openAddMedicine}>Add Medicine</Button>
        </PermissionGate>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Search" placeholder="Name / barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Input label="Category" placeholder="Tablet / Syrup..." value={cat} onChange={(e) => setCat(e.target.value)} />
          <div className="flex items-end gap-2">
            <Button variant="ghost" onClick={() => { setQ(""); setCat(""); }}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6 text-center text-slate-500">
          Loading medicines...
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((m) => {
            const expDays = m.nearestExp ? daysFromToday(m.nearestExp) : null;
            const lowStock = m.stock <= 10;
            const expSoon = expDays !== null && expDays <= 30;

            return (
              <Card key={m.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">{m.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Category: <b>{m.category}</b> • Barcode: <b>{m.barcode || "-"}</b>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                        Stock: {m.stock}
                      </span>

                      {lowStock ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
                          Low Stock
                        </span>
                      ) : null}

                      {m.nearestExp ? (
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-bold ring-1",
                            expSoon ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-slate-50 text-slate-700 ring-slate-200"
                          ].join(" ")}
                        >
                          Nearest Exp: {fmtDate(m.nearestExp)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          No batches
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <PermissionGate any={[PERMS.MEDICINES_EDIT]}>
                      <Button variant="ghost" onClick={() => openEditMedicine(m)}>
                        Edit
                      </Button>
                    </PermissionGate>

                    <PermissionGate any={[PERMS.MEDICINES_DELETE]}>
                      <Button variant="danger" onClick={() => deleteMedicine(m.id)}>
                        Delete
                      </Button>
                    </PermissionGate>

                    <PermissionGate any={[PERMS.MEDICINES_CREATE, PERMS.MEDICINES_EDIT]}>
                      <Button onClick={() => openAddBatch(m)}>Add Batch</Button>
                    </PermissionGate>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Batch No</th>
                        <th className="px-4 py-3 font-semibold">Expiry</th>
                        <th className="px-4 py-3 font-semibold">MRP</th>
                        <th className="px-4 py-3 font-semibold">Cost</th>
                        <th className="px-4 py-3 font-semibold">Sell</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(m.batches || []).map((b) => {
                        const bDays = b.expiry ? daysFromToday(b.expiry) : null;
                        const bExpSoon = bDays !== null && bDays <= 30;

                        return (
                          <tr key={b.id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{b.batch_no}</td>
                            <td className="px-4 py-3">
                              <span
                                className={[
                                  "rounded-full px-3 py-1 text-xs font-bold ring-1",
                                  bExpSoon ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-slate-50 text-slate-700 ring-slate-200"
                                ].join(" ")}
                              >
                                {fmtDate(b.expiry)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700">₹{b.mrp}</td>
                            <td className="px-4 py-3 text-slate-700">₹{b.cost}</td>
                            <td className="px-4 py-3 text-slate-700">₹{b.sell}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{b.qty}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <PermissionGate any={[PERMS.MEDICINES_EDIT]}>
                                  <Button variant="ghost" onClick={() => openEditBatch(m, b)}>
                                    Edit
                                  </Button>
                                </PermissionGate>
                                <PermissionGate any={[PERMS.MEDICINES_DELETE]}>
                                  <Button variant="danger" onClick={() => deleteBatch(b.id)}>
                                    Delete
                                  </Button>
                                </PermissionGate>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {(m.batches || []).length === 0 ? (
                        <tr className="border-t border-slate-200">
                          <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                            No batches yet. Click <b>Add Batch</b>.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}

          {rows.length === 0 ? (
            <Card className="p-6 text-center text-slate-500">
              No medicines found
            </Card>
          ) : null}
        </div>
      )}

      <Modal
        open={medOpen}
        title={medMode === "add" ? "Add Medicine" : "Edit Medicine"}
        onClose={() => setMedOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMedicine} disabled={savingMed}>
              {savingMed ? "Saving..." : medMode === "add" ? "Add" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Medicine Name"
            value={medForm.name}
            onChange={(e) => setMedForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Category"
            value={medForm.category}
            onChange={(e) => setMedForm((p) => ({ ...p, category: e.target.value }))}
          />
          <Input
            label="Barcode (optional)"
            value={medForm.barcode}
            onChange={(e) => setMedForm((p) => ({ ...p, barcode: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={batchOpen}
        title={batchMode === "add" ? "Add Batch" : "Edit Batch"}
        onClose={() => setBatchOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBatch} disabled={savingBatch}>
              {savingBatch ? "Saving..." : batchMode === "add" ? "Add" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Batch No"
            value={batchForm.batchNo}
            onChange={(e) => setBatchForm((p) => ({ ...p, batchNo: e.target.value }))}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={batchForm.expiry}
            onChange={(e) => setBatchForm((p) => ({ ...p, expiry: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="MRP"
              type="number"
              min="0"
              value={batchForm.mrp}
              onChange={(e) => setBatchForm((p) => ({ ...p, mrp: e.target.value }))}
            />
            <Input
              label="Cost"
              type="number"
              min="0"
              value={batchForm.cost}
              onChange={(e) => setBatchForm((p) => ({ ...p, cost: e.target.value }))}
            />
            <Input
              label="Sell"
              type="number"
              min="0"
              value={batchForm.sell}
              onChange={(e) => setBatchForm((p) => ({ ...p, sell: e.target.value }))}
            />
          </div>

          <Input
            label="Qty"
            type="number"
            min="0"
            value={batchForm.qty}
            onChange={(e) => setBatchForm((p) => ({ ...p, qty: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}